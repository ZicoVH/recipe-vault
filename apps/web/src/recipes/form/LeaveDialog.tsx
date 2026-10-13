import { useEffect, useRef } from 'react'
import buttons from '../../Button.module.css'
import styles from './RecipeForm.module.css'

type LeaveDialogProps = {
  open: boolean
  onStay: () => void
  onLeave: () => void
}

/**
 * Asks whether to leave a form with unsaved changes. A native modal dialog
 * traps focus, closes on Escape and gives focus back to what had it before.
 */
function LeaveDialog({ open, onStay, onLeave }: LeaveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const stayRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // The safe choice gets the initial focus.
      stayRef.current?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={styles.leaveDialog}
      aria-labelledby="leave-title"
      aria-describedby="leave-text"
      // Escape: stay on the page.
      onCancel={(event) => {
        event.preventDefault()
        onStay()
      }}
    >
      <h2 id="leave-title" className={styles.leaveTitle}>
        Wijzigingen niet opgeslagen
      </h2>
      <p id="leave-text">
        Als je deze pagina verlaat, gaan je wijzigingen verloren. Wil je blijven
        bewerken?
      </p>
      <div className={styles.actions}>
        <button
          ref={stayRef}
          type="button"
          className={buttons.primary}
          onClick={onStay}
        >
          Blijven bewerken
        </button>
        <button type="button" className={buttons.danger} onClick={onLeave}>
          Pagina verlaten
        </button>
      </div>
    </dialog>
  )
}

export default LeaveDialog
