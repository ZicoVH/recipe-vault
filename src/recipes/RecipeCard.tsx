import { formatDuration } from './formatDuration'
import styles from './RecipeCard.module.css'
import type { Recipe } from './types'

type RecipeCardProps = {
  recipe: Recipe
}

type TimeRowProps = {
  label: string
  minutes: number
}

function TimeRow({ label, minutes }: TimeRowProps) {
  return (
    <div className={styles.timeRow}>
      <dt>{label}</dt>
      <dd>
        <time dateTime={`PT${minutes}M`}>{formatDuration(minutes)}</time>
      </dd>
    </div>
  )
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const { title, prepTimeMinutes, cookTimeMinutes, tags } = recipe
  const hasTimes =
    prepTimeMinutes !== undefined || cookTimeMinutes !== undefined

  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {hasTimes && (
        <dl className={styles.times}>
          {prepTimeMinutes !== undefined && (
            <TimeRow label="Voorbereiding" minutes={prepTimeMinutes} />
          )}
          {cookTimeMinutes !== undefined && (
            <TimeRow label="Kooktijd" minutes={cookTimeMinutes} />
          )}
        </dl>
      )}
      {tags.length > 0 && (
        <ul className={styles.tags}>
          {tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default RecipeCard
