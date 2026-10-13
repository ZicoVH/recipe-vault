import type { Ingredient } from './types'

const numberFormat = new Intl.NumberFormat('nl-BE', {
  maximumFractionDigits: 3,
})

/** "800 g", "2,5 el" or "2". Empty when the ingredient has no quantity. */
export function formatAmount({ quantity, unit }: Ingredient): string {
  if (quantity === null) return ''
  const amount = numberFormat.format(quantity)
  return unit ? `${amount} ${unit}` : amount
}
