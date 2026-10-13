import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import type { RecipeSummary } from '../types'
import type { TrashResult } from './trashActions'
import styles from './Trash.module.css'
import TrashRow from './TrashRow'

type TrashPageProps = {
  recipes: RecipeSummary[]
  /** The outcome of the last restore or delete, shown in a status message. */
  result: TrashResult | undefined
  busy: boolean
}

function TrashPage({ recipes, result, busy }: TrashPageProps) {
  const statusRef = useRef<HTMLDivElement>(null)
  const [searchParams] = useSearchParams()
  // A delete from the recipe page lands here with the id of that recipe.
  const deletedId = searchParams.get('verwijderd')
  const justDeleted = recipes.find((recipe) => recipe.id === deletedId)
  const hasMessage = result !== undefined || justDeleted !== undefined

  // The button that was used is gone after the list reloads, so focus would be
  // lost. Moving it to the message also reads out the result. Without a live
  // role, so the message is not announced twice.
  useEffect(() => {
    if (result || justDeleted) statusRef.current?.focus()
  }, [result, justDeleted])

  return (
    <section className={styles.page}>
      <title>Prullenbak · Recipe Vault</title>
      <Link to="/" className={styles.back}>
        <span aria-hidden="true">←</span> Alle recepten
      </Link>
      <h1 className={styles.heading}>Prullenbak</h1>
      <p className={styles.intro}>
        Verwijderde recepten blijven hier bewaard tot je ze definitief
        verwijdert.
      </p>

      <div
        ref={statusRef}
        tabIndex={-1}
        // Tells the layout not to move focus to the heading after navigating.
        data-initial-focus={hasMessage ? '' : undefined}
        className={styles.status}
      >
        {!result && justDeleted && (
          <p className={styles.message}>
            ‘{justDeleted.title}’ is naar de prullenbak verplaatst. Je kunt het
            hieronder terugzetten.
          </p>
        )}
        {result && (
          <p
            className={`${styles.message} ${result.status === 'failed' ? styles.failed : ''}`}
          >
            {result.message}
            {result.status === 'done' && result.recipeId && (
              <>
                {' '}
                <Link to={`/recepten/${result.recipeId}`}>Bekijk recept</Link>
              </>
            )}
          </p>
        )}
      </div>

      {recipes.length === 0 ? (
        <p className={styles.empty}>De prullenbak is leeg.</p>
      ) : (
        <ul className={styles.list}>
          {recipes.map((recipe) => (
            <TrashRow key={recipe.id} recipe={recipe} busy={busy} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default TrashPage
