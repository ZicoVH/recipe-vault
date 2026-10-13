import { Link } from 'react-router'
import styles from './NotFound.module.css'

type NotFoundProps = {
  heading: string
  message: string
}

function NotFound({ heading, message }: NotFoundProps) {
  return (
    <section>
      <title>Niet gevonden · Recipe Vault</title>
      <h1 className={styles.heading}>{heading}</h1>
      <p>{message}</p>
      <Link to="/" className={styles.back}>
        <span aria-hidden="true">←</span> Alle recepten
      </Link>
    </section>
  )
}

export default NotFound
