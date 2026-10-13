// Deterministic seed data for the spike: Dutch, French and English recipes
// with accents, plus fixed test cases. Throwaway code, not part of the app.

function prng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORDS = {
  nl: {
    dish: [
      'Stoofvlees',
      'Erwtensoep',
      'Stamppot',
      'Hutspot',
      'Kaassoufflé',
      'Appeltaart',
      'Pannenkoeken',
      'Witlof in de oven',
      'Boerenkool',
      'Gehaktballen',
    ],
    ing: [
      'ui',
      'aardappel',
      'wortel',
      'rundvlees',
      'boter',
      'melk',
      'bloem',
      'ei',
      'peterselie',
      'prei',
      'spek',
      'kaas',
    ],
    tag: [
      'hoofdgerecht',
      'winter',
      'snel',
      'vegetarisch',
      'dessert',
      'klassiek',
    ],
  },
  fr: {
    dish: [
      'Boeuf bourguignon',
      'Tarte tatin',
      'Ratatouille',
      'Gratin dauphinois',
      'Soupe à l’oignon',
      'Quiche lorraine',
      'Mousse au chocolat',
      'Blanquette de veau',
    ],
    ing: [
      'crème fraîche',
      'beurre',
      'échalote',
      'thym',
      'pommes de terre',
      'œuf',
      'farine',
      'lardons',
      'gruyère',
      'champignons',
    ],
    tag: [
      'plat principal',
      'été',
      'rapide',
      'végétarien',
      'dessert',
      'classique',
    ],
  },
  en: {
    dish: [
      'Pancakes',
      'Chili con carne',
      'Apple crumble',
      'Mac and cheese',
      'Tomato soup',
    ],
    ing: [
      'onion',
      'butter',
      'flour',
      'egg',
      'milk',
      'cheese',
      'tomato',
      'beans',
    ],
    tag: ['main', 'quick', 'vegetarian', 'dessert', 'comfort'],
  },
}

export const FIXED = [
  {
    title: 'Crème brûlée',
    ingredients: ['crème', 'vanille', 'suiker'],
    tags: ['dessert'],
  },
  {
    title: 'Crêpes',
    ingredients: ['farine', 'lait', 'œufs'],
    tags: ['dessert', 'rapide'],
  },
  {
    title: 'Saumon à l’oseille',
    ingredients: ['saumon', 'oseille', 'crème fraîche'],
    tags: ['poisson'],
  },
  {
    title: 'Stoofvlees met friet',
    ingredients: ['rundvlees', 'bier', 'mosterd'],
    tags: ['hoofdgerecht', 'klassiek'],
  },
  // Trashed on purpose: must never show up in search results.
  {
    title: 'Crème brûlée (oud)',
    ingredients: ['crème'],
    tags: ['dessert'],
    trashed: true,
  },
]

export function generate(count = 500, seed = 42) {
  const rnd = prng(seed)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const between = (min, max) => min + Math.floor(rnd() * (max - min + 1))
  const recipes = FIXED.map((r) => ({
    servings: 4,
    steps: ['Bereiden.'],
    trashed: false,
    ...r,
  }))
  for (let i = recipes.length; i < count; i++) {
    const roll = rnd()
    const lang = roll < 0.7 ? 'nl' : roll < 0.9 ? 'fr' : 'en'
    const w = WORDS[lang]
    recipes.push({
      title: `${pick(w.dish)} ${i}`,
      servings: between(1, 8),
      ingredients: Array.from({ length: between(5, 25) }, () => pick(w.ing)),
      steps: Array.from({ length: between(3, 12) }, (_, n) => `Stap ${n + 1}`),
      tags: Array.from({ length: between(0, 6) }, () => pick(w.tag)),
      trashed: rnd() < 0.02,
    })
  }
  return recipes
}
