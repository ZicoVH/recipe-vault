import type { ReactNode } from 'react'
import { CookIcon, PrepIcon, ServingsIcon } from './FactIcons'
import { formatDuration } from './formatDuration'
import styles from './RecipeFacts.module.css'

type RecipeFactsProps = {
  /** `compact` shows an icon and a value. `labelled` shows a visible label. */
  variant?: 'labelled' | 'compact'
  servings?: number
  prepTimeMinutes?: number | null
  cookTimeMinutes?: number | null
}

type FactProps = {
  label: string
  icon: ReactNode
  compact: boolean
  children: ReactNode
}

function Fact({ label, icon, compact, children }: FactProps) {
  if (compact) {
    // The label stays in the markup for screen readers and as a tooltip.
    return (
      <div className={styles.compactFact}>
        <dt className={styles.visuallyHidden}>{label}</dt>
        <dd>
          {icon}
          {children}
        </dd>
      </div>
    )
  }
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
  variant = 'labelled',
  servings,
  prepTimeMinutes,
  cookTimeMinutes,
}: RecipeFactsProps) {
  const compact = variant === 'compact'
  if (
    servings === undefined &&
    prepTimeMinutes == null &&
    cookTimeMinutes == null
  ) {
    return null
  }

  return (
    <dl className={compact ? styles.compactFacts : styles.facts}>
      {servings !== undefined && (
        <Fact
          label={servings === 1 ? 'Persoon' : 'Personen'}
          icon={<ServingsIcon />}
          compact={compact}
        >
          {servings}
        </Fact>
      )}
      {prepTimeMinutes != null && (
        <Fact label="Voorbereiding" icon={<PrepIcon />} compact={compact}>
          <Minutes value={prepTimeMinutes} />
        </Fact>
      )}
      {cookTimeMinutes != null && (
        <Fact label="Kooktijd" icon={<CookIcon />} compact={compact}>
          <Minutes value={cookTimeMinutes} />
        </Fact>
      )}
    </dl>
  )
}

export default RecipeFacts
