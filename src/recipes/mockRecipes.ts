import type { Recipe } from './types'

// Placeholder data for the overview page. Fictional, to be replaced once
// recipes come from a real source.
export const mockRecipes: Recipe[] = [
  {
    id: 'stoofvlees-met-friet',
    title: 'Stoofvlees met friet',
    prepTimeMinutes: 30,
    cookTimeMinutes: 180,
    tags: ['hoofdgerecht', 'belgisch', 'stoofpot'],
  },
  {
    id: 'witloof-met-hesp-en-kaas',
    title: 'Witloof met hesp en kaas',
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    tags: ['hoofdgerecht', 'oven', 'klassiek'],
  },
  {
    id: 'tomatensoep-met-balletjes',
    title: 'Tomatensoep met balletjes',
    prepTimeMinutes: 25,
    cookTimeMinutes: 35,
    tags: ['soep', 'klassiek'],
  },
  {
    id: 'salade-met-geitenkaas-en-walnoten',
    title: 'Salade met geitenkaas en walnoten',
    prepTimeMinutes: 15,
    tags: ['salade', 'vegetarisch', 'snel'],
  },
  {
    id: 'rijstpap',
    title: 'Rijstpap',
    cookTimeMinutes: 50,
    tags: ['dessert', 'klassiek'],
  },
  {
    id: 'creme-brulee',
    title: 'Crème brûlée',
    prepTimeMinutes: 20,
    cookTimeMinutes: 45,
    tags: ['dessert', 'feest', 'frans'],
  },
  {
    id: 'weekendbrood',
    title:
      'Langzaam gerezen weekendbrood met rozemarijn, zeezout en een scheut olijfolie',
    tags: ['brood', 'bakken', 'weekend', 'vegetarisch', 'vegan', 'ontbijt'],
  },
]
