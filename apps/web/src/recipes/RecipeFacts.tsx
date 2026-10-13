import type { ReactNode } from 'react'
import { formatDuration } from './formatDuration'
import styles from './RecipeFacts.module.css'

type RecipeFactsProps = {
  servings?: number
  prepTimeMinutes?: number
  cookTimeMinutes?: number
}

type FactProps = {
  label: string
  children: ReactNode
}

function Fact({ label, children }: FactProps) {
  return (
    <div className={styles.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function Minutes({ value }: { value: number }) {
  return <time dateTime={`PT${value}M`}>{formatDuration(value)}</time>
}

function RecipeFacts({
  servings,
  prepTimeMinutes,
  cookTimeMinutes,
}: RecipeFactsProps) {
  if (
    servings === undefined &&
    prepTimeMinutes === undefined &&
    cookTimeMinutes === undefined
  ) {
    return null
  }

  return (
    <dl className={styles.facts}>
      {servings !== undefined && (
        <Fact label={servings === 1 ? 'Persoon' : 'Personen'}>{servings}</Fact>
      )}
      {prepTimeMinutes !== undefined && (
        <Fact label="Voorbereiding">
          <Minutes value={prepTimeMinutes} />
        </Fact>
      )}
      {cookTimeMinutes !== undefined && (
        <Fact label="Kooktijd">
          <Minutes value={cookTimeMinutes} />
        </Fact>
      )}
    </dl>
  )
}

export default RecipeFacts
