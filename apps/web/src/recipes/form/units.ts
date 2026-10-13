/** Units offered in the ingredient form, metric and Dutch cooking units (D6). */
export const COMMON_UNITS = ['g', 'ml', 'el', 'tl', 'kg', 'l', 'stuk']

export const OTHER_UNITS = [
  'dl',
  'cl',
  'mespunt',
  'snufje',
  'scheutje',
  'handvol',
  'teentje',
  'takje',
  'blaadje',
  'plak',
  'sneetje',
  'bosje',
  'blik',
  'pak',
  'zakje',
  'potje',
]

export const KNOWN_UNITS = new Set([...COMMON_UNITS, ...OTHER_UNITS])
