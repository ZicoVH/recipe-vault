import { useEffect, useRef } from 'react'
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router'
import styles from './Layout.module.css'

function Layout() {
  const { pathname } = useLocation()
  const previousPathname = useRef(pathname)

  // After navigating, move focus to the new page's heading so screen reader
  // and keyboard users start at the top of the new content. Not on first load.
  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    const heading = document.querySelector<HTMLElement>('main h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }, [pathname])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          Recipe Vault
        </Link>
        {pathname === '/' && <p>Jouw persoonlijke receptencollectie</p>}
      </header>
      <main>
        <Outlet />
      </main>
      <ScrollRestoration />
    </div>
  )
}

export default Layout
