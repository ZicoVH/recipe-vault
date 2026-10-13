import { useEffect, useId, useRef, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigation,
  useNavigationType,
  useSearchParams,
} from 'react-router'
import buttons from '../Button.module.css'
import type { OverviewData } from './loaders'
import RecipeList from './RecipeList'
import { normalizeTags } from './searchParams'
import styles from './RecipeOverview.module.css'
import TagFilter from './TagFilter'

type RecipeOverviewProps = {
  data: OverviewData
}

/** Time without typing before the search is sent to the API. */
const SEARCH_DELAY_MS = 250

function formatResultCount(count: number) {
  return count === 1 ? '1 recept gevonden' : `${count} recepten gevonden`
}

function quoteList(items: string[]) {
  const quoted = items.map((item) => `‘${item}’`)
  if (quoted.length <= 1) return quoted.join('')
  return `${quoted.slice(0, -1).join(', ')} en ${quoted[quoted.length - 1]}`
}

/** The outcome of the search as one sentence. Empty without a search. */
function describeResult(q: string, tags: string[], count: number): string {
  if (q === '' && tags.length === 0) return ''
  if (count > 0) return formatResultCount(count)
  const parts = ['Geen recepten gevonden']
  if (q !== '') parts.push(`voor ‘${q}’`)
  if (tags.length > 0) {
    parts.push(
      tags.length === 1
        ? `met de tag ${quoteList(tags)}`
        : `met de tags ${quoteList(tags)}`,
    )
  }
  return `${parts.join(' ')}.`
}

function RecipeOverview({ data }: RecipeOverviewProps) {
  const { recipes, tags, q: loadedQuery, selectedTags: loadedTags } = data
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigation = useNavigation()
  const navigationType = useNavigationType()
  const searchId = useId()
  const urlQuery = searchParams.get('q') ?? ''
  const urlTags = normalizeTags(searchParams.getAll('tag'))

  // The input is driven by local state, not by the URL: the URL updates after
  // a router navigation, and feeding it back into the input drops characters
  // typed in the meantime. The URL is a mirror, so going back from a recipe
  // keeps the search. The recipes come from the API for that URL.
  const [query, setQuery] = useState(urlQuery)
  // The chosen tags live here too and not only in the URL: the URL follows
  // after the API has answered, so reading it would drop a tag clicked or a
  // word typed while a search is still loading, and the checkbox would not
  // toggle until then.
  const [selected, setSelected] = useState(urlTags)
  const [seenLocationKey, setSeenLocationKey] = useState(location.key)
  const [outsideNavigations, setOutsideNavigations] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  // What the search timer sends when it fires.
  const latest = useRef({ query: urlQuery, tags: urlTags })
  const searchInput = useRef<HTMLInputElement>(null)
  const focusSearchAfterClear = useRef(false)

  // Adopt the URL after outside navigations, such as the brand link (push) or
  // Back and Forward (pop). Typing and tag changes always replace, so their
  // own URL updates, which arrive late, are ignored: adopting them would
  // overwrite characters typed in the meantime. This assumes no outside
  // navigation to this page uses replace; if one is added, it must be told
  // apart from typing.
  if (location.key !== seenLocationKey) {
    setSeenLocationKey(location.key)
    if (navigationType !== 'REPLACE') {
      setQuery(urlQuery)
      setSelected(urlTags)
      setOutsideNavigations((count) => count + 1)
    }
  }

  useEffect(() => {
    latest.current = { query, tags: selected }
  })

  // After an outside navigation (Back, the brand link, clearing) the input was
  // replaced, so a search still waiting would undo it. Our own navigations do
  // not count: they arrive when the API has answered, and clearing the timer
  // then would drop whatever was typed meanwhile.
  useEffect(() => {
    window.clearTimeout(timer.current)
  }, [outsideNavigations])

  // Nothing is sent after leaving the page.
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Replace avoids a history entry per keystroke, and the scroll position
  // must not reset while typing.
  function updateUrl(nextQuery: string, nextTags: string[]) {
    const params = new URLSearchParams()
    if (nextQuery !== '') params.set('q', nextQuery)
    for (const tag of nextTags) params.append('tag', tag)
    setSearchParams(params, { replace: true, preventScrollReset: true })
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    latest.current = { ...latest.current, query: value }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(
      () => updateUrl(latest.current.query, latest.current.tags),
      SEARCH_DELAY_MS,
    )
  }

  function toggleTag(name: string) {
    // A tag change is sent at once, together with any text still waiting.
    window.clearTimeout(timer.current)
    const lower = name.toLowerCase()
    const current = latest.current.tags
    const next = current.some((tag) => tag.toLowerCase() === lower)
      ? current.filter((tag) => tag.toLowerCase() !== lower)
      : [...current, name]
    setSelected(next)
    latest.current = { ...latest.current, tags: next }
    updateUrl(latest.current.query, next)
  }

  const hasFilters = loadedQuery !== '' || loadedTags.length > 0
  // The status describes the recipes that are on screen, so it is built from
  // the loaded data and not from the URL, which may already be ahead.
  const status = describeResult(loadedQuery, loadedTags, recipes.length)
  // Without any recipe there is nothing to search yet.
  const showSearch = recipes.length > 0 || hasFilters || tags.length > 0
  // A search for the same page is loading: the list on screen is out of date.
  const searching =
    navigation.state === 'loading' &&
    navigation.location?.pathname === location.pathname

  // The "clear" link disappears when the full list is back, which would drop
  // keyboard focus. Put it in the search box instead.
  useEffect(() => {
    if (focusSearchAfterClear.current && !hasFilters && recipes.length > 0) {
      focusSearchAfterClear.current = false
      searchInput.current?.focus()
    }
  })

  return (
    <section>
      <title>Recepten · Recipe Vault</title>
      <div className={styles.titleRow}>
        <h1 className={styles.heading}>Recepten</h1>
        <div className={styles.titleActions}>
          <Link to="/exporteren-importeren" className={buttons.secondary}>
            Exporteren en importeren
          </Link>
          <Link to="/prullenbak" className={buttons.secondary}>
            Prullenbak
          </Link>
          <Link to="/recepten/nieuw" className={buttons.primary}>
            Nieuw recept
          </Link>
        </div>
      </div>
      {showSearch && (
        <div role="search" className={styles.search}>
          <label htmlFor={searchId} className={styles.label}>
            Zoek op titel, ingrediënt of tag
          </label>
          <input
            id={searchId}
            ref={searchInput}
            type="search"
            className={styles.input}
            value={query}
            autoComplete="off"
            onChange={(event) => handleQueryChange(event.target.value)}
          />
          <TagFilter tags={tags} selected={selected} onToggle={toggleTag} />
          {/* One live region announces the outcome, so a screen reader does
              not hear the no-results message twice. */}
          <p role="status" className={styles.status}>
            {status}
          </p>
          {recipes.length === 0 && hasFilters && (
            <Link
              to="/"
              className={styles.clear}
              onClick={() => {
                focusSearchAfterClear.current = true
              }}
            >
              Wis zoekopdracht en filters
            </Link>
          )}
        </div>
      )}
      {(recipes.length > 0 || !hasFilters) && (
        <div
          aria-busy={searching}
          className={searching ? styles.busy : undefined}
        >
          <RecipeList recipes={recipes} />
        </div>
      )}
    </section>
  )
}

export default RecipeOverview
