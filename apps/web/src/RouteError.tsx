import { useRouteError } from 'react-router'
import { ApiError } from './api/client'
import buttons from './Button.module.css'
import styles from './NotFound.module.css'

function RouteError() {
  const error = useRouteError()
  // No answer at all, or a server or proxy error such as the dev proxy
  // reports when the API is down.
  const unreachable =
    error instanceof ApiError && (error.status === null || error.status >= 500)

  return (
    <section>
      <title>Er ging iets mis · Recipe Vault</title>
      <h1 className={styles.heading}>Er ging iets mis</h1>
      <p role="alert">
        {unreachable
          ? 'De server reageert niet. Controleer of de server draait en probeer het opnieuw.'
          : 'De gegevens konden niet worden geladen. Probeer het later opnieuw.'}
      </p>
      <button
        type="button"
        className={buttons.secondary}
        onClick={() => window.location.reload()}
      >
        Probeer opnieuw
      </button>
    </section>
  )
}

export default RouteError
