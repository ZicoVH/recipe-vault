import styles from './Layout.module.css'

/** Shown by the router while the first page data loads. */
function PageLoading() {
  return (
    <div className={styles.page}>
      <title>Laden · Recipe Vault</title>
      <p role="status">Recepten laden…</p>
    </div>
  )
}

export default PageLoading
