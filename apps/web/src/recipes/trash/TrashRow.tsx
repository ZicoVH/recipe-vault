import { useEffect, useRef, useState } from 'react'
import { Form } from 'react-router'
import buttons from '../../Button.module.css'
import type { RecipeSummary } from '../types'
import styles from './Trash.module.css'

type TrashRowProps = {
  recipe: RecipeSummary
  /** True while a request is running, so nothing is submitted twice. */
  busy: boolean
}

const dateFormat = new Intl.DateTimeFormat('nl-BE', {
  dateStyle: 'long',
  timeStyle: 'short',
})

function HiddenFields({
  intent,
  recipe,
}: {
  intent: 'restore' | 'delete'
  recipe: RecipeSummary
}) {
  return (
    <>
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="id" value={recipe.id} />
      <input type="hidden" name="title" value={recipe.title} />
    </>
  )
}

function TrashRow({ recipe, busy }: TrashRowProps) {
  const { title, deletedAt } = recipe
  const [confirming, setConfirming] = useState(false)
  const questionRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  useEffect(() => {
    if (confirming) {
      // Read the question first. The safe choice (cancel) comes before the
      // destructive one in the tab order.
      questionRef.current?.focus()
    } else if (returnFocus.current) {
      returnFocus.current = false
      triggerRef.current?.focus()
    }
  }, [confirming])

  function cancel() {
    returnFocus.current = true
    setConfirming(false)
  }

  return (
    <li className={styles.row}>
      <h2 className={styles.title}>{title}</h2>
      {deletedAt && (
        <p className={styles.deleted}>
          Verwijderd op{' '}
          <time dateTime={deletedAt}>
            {dateFormat.format(new Date(deletedAt))}
          </time>
        </p>
      )}
      <div className={styles.actions}>
        <Form method="post">
          <HiddenFields intent="restore" recipe={recipe} />
          <button
            type="submit"
            className={buttons.secondary}
            aria-label={`Terugzetten: ${title}`}
            disabled={busy}
          >
            Terugzetten
          </button>
        </Form>
        <button
          ref={triggerRef}
          type="button"
          className={buttons.danger}
          aria-label={`Definitief verwijderen: ${title}`}
          aria-expanded={confirming}
          aria-controls={confirming ? `confirm-group-${recipe.id}` : undefined}
          disabled={busy}
          onClick={() => setConfirming(true)}
        >
          Definitief verwijderen
        </button>
      </div>
      {confirming && (
        <div
          ref={questionRef}
          id={`confirm-group-${recipe.id}`}
          tabIndex={-1}
          role="group"
          aria-labelledby={`confirm-${recipe.id}`}
          className={styles.confirm}
        >
          <p id={`confirm-${recipe.id}`} className={styles.question}>
            Weet je zeker dat je ‘{title}’ definitief wilt verwijderen? Dit kan
            niet ongedaan worden gemaakt.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={buttons.secondary}
              onClick={cancel}
            >
              Annuleren
            </button>
            <Form method="post">
              <HiddenFields intent="delete" recipe={recipe} />
              <button type="submit" className={buttons.danger} disabled={busy}>
                Ja, definitief verwijderen
              </button>
            </Form>
          </div>
        </div>
      )}
    </li>
  )
}

export default TrashRow
