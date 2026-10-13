import type { ReactNode } from 'react'
import { formatDuration } from './formatDuration'
import styles from './RecipeFacts.module.css'

type RecipeFactsProps = {
  servings?: number
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
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
    prepTimeMinutes == null &&
    cookTimeMinutes == null
  ) {
    return null
  }

  return (
    <dl className={styles.facts}>
      {servings !== undefined && (
        <Fact label={servings === 1 ? 'Persoon' : 'Personen'}>{servings}</Fact>
      )}
      {prepTimeMinutes != null && (
        <Fact label="Voorbereiding">
          <Minutes value={prepTimeMinutes} />
        </Fact>
      )}
      {cookTimeMinutes != null && (
        <Fact label="Kooktijd">
          <Minutes value={cookTimeMinutes} />
        </Fact>
      )}
    </dl>
  )
}

export default RecipeFacts
