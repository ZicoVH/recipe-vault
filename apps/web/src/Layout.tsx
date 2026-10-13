import { useEffect, useRef } from 'react'
import {
  Link,
  Outlet,
  ScrollRestoration,
  useLocation,
  useNavigation,
} from 'react-router'
import styles from './Layout.module.css'
import ThemeSwitcher from './theme/ThemeSwitcher'

function Layout() {
  const { pathname } = useLocation()
  const navigation = useNavigation()
  // Not for changes of the query string only, such as typing in the search box.
  const navigatingToOtherPage =
    navigation.state === 'loading' && navigation.location.pathname !== pathname
  const previousPathname = useRef(pathname)

  // After navigating, move focus to the new page's heading so screen reader
  // and keyboard users start at the top of the new content. Not on first load.
  useEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    // A page that moves focus itself, such as to a result message, opts out.
    if (document.querySelector('main [data-initial-focus]')) return

    const heading = document.querySelector<HTMLElement>('main h1')
    if (heading) {
      heading.tabIndex = -1
      heading.focus({ preventScroll: true })
    }
  }, [pathname])

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.brand}>
            Recipe Vault
          </Link>
          {pathname === '/' && (
            <p className={styles.tagline}>
              Jouw persoonlijke receptencollectie
            </p>
          )}
          <ThemeSwitcher />
        </div>
      </header>
      <div className={styles.page}>
        <p role="status" className={styles.loading}>
          {navigation.state === 'submitting'
            ? 'Bezig…'
            : navigatingToOtherPage
              ? 'Laden…'
              : ''}
        </p>
        <main>
          <Outlet />
        </main>
        <ScrollRestoration />
      </div>
    </>
  )
}

export default Layout
