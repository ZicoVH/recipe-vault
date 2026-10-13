import { useEffect, useRef, useState } from 'react'
import { Form, Link } from 'react-router'
import buttons from '../../Button.module.css'
import type { ImportResult } from './exchangeActions'
import styles from './Exchange.module.css'

type ExchangePageProps = {
  /** The outcome of the last import, shown in a message that gets focus. */
  result: ImportResult | undefined
  /** True while the import request runs, so it is not submitted twice. */
  importing: boolean
}

function formatAdded(count: number) {
  return count === 1
    ? '1 recept is toegevoegd.'
    : `${count} recepten zijn toegevoegd.`
}

function ExchangePage({ result, importing }: ExchangePageProps) {
  const resultRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // The button that was used keeps focus, so move it to the outcome: that
  // also reads the result out. A chosen file is cleared after a success.
  useEffect(() => {
    if (!result) return
    resultRef.current?.focus()
    if (result.status === 'done') formRef.current?.reset()
  }, [result])

  async function exportRecipes() {
    // The button stays enabled so it keeps keyboard focus. Ignore repeats.
    if (exporting) return
    setExporting(true)
    setExportMessage('')
    try {
      const response = await fetch('/api/export')
      if (!response.ok) throw new Error(`Status ${response.status}`)
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      // Local date, so the name matches the day the user sees.
      link.download = `recipe-vault-${new Date().toLocaleDateString('sv-SE')}.json`
      // Some browsers only start the download from an attached link.
      document.body.append(link)
      link.click()
      link.remove()
      // Revoking at once can cancel the download in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setExportMessage('Het bestand met je recepten is gedownload.')
    } catch {
      setExportMessage(
        'Exporteren is niet gelukt. Controleer of de server draait en probeer het opnieuw.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className={styles.page}>
      <title>Exporteren en importeren · Recipe Vault</title>
      <Link to="/" className={styles.back}>
        <span aria-hidden="true">←</span> Alle recepten
      </Link>
      <h1 className={styles.heading}>Exporteren en importeren</h1>

      <section aria-labelledby="export-heading" className={styles.block}>
        <h2 id="export-heading" className={styles.subheading}>
          Exporteren
        </h2>
        <p>
          Download al je recepten als één JSON-bestand. Recepten in de
          prullenbak zitten er niet bij.
        </p>
        <button
          type="button"
          className={buttons.primary}
          aria-disabled={exporting}
          onClick={exportRecipes}
        >
          {exporting ? 'Bezig…' : 'Recepten downloaden'}
        </button>
        <p role="status" className={styles.exportStatus}>
          {exportMessage}
        </p>
      </section>

      <section aria-labelledby="import-heading" className={styles.block}>
        <h2 id="import-heading" className={styles.subheading}>
          Importeren
        </h2>
        <p>
          Kies een JSON-bestand dat je eerder hebt geëxporteerd. De recepten
          worden toegevoegd aan je collectie. Bestaande recepten blijven
          ongewijzigd. Als het bestand een fout bevat, wordt er niets
          toegevoegd.
        </p>
        <div
          ref={resultRef}
          tabIndex={-1}
          className={styles.result}
          data-has-result={result ? '' : undefined}
        >
          {result?.status === 'done' && (
            <p className={styles.message}>
              {formatAdded(result.added)}{' '}
              <Link to="/">Bekijk alle recepten</Link>
            </p>
          )}
          {result?.status === 'failed' && (
            <div className={`${styles.message} ${styles.failed}`}>
              <p>{result.message}</p>
              {result.problems.length > 0 && (
                <ul className={styles.problems}>
                  {result.problems.map((problem, index) => (
                    <li key={index}>{problem}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <Form
          ref={formRef}
          method="post"
          encType="multipart/form-data"
          className={styles.importForm}
        >
          <label htmlFor="import-file" className={styles.label}>
            Bestand om te importeren
          </label>
          <input
            id="import-file"
            type="file"
            name="file"
            accept=".json,application/json"
            className={styles.file}
          />
          <button
            type="submit"
            className={buttons.primary}
            disabled={importing}
          >
            {importing ? 'Bezig…' : 'Importeren'}
          </button>
        </Form>
      </section>
    </section>
  )
}

export default ExchangePage
