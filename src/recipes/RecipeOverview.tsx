import { useId, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import RecipeList from './RecipeList'
import styles from './RecipeOverview.module.css'
import { filterRecipesByTitle } from './searchRecipes'
import type { Recipe } from './types'

type RecipeOverviewProps = {
  recipes: Recipe[]
}

function formatResultCount(count: number) {
  return count === 1 ? '1 recept gevonden' : `${count} recepten gevonden`
}

function RecipeOverview({ recipes }: RecipeOverviewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigationType = useNavigationType()
  const searchId = useId()
  const urlQuery = searchParams.get('q') ?? ''

  // The input is driven by local state, not by the URL: the URL updates after
  // a router navigation, and feeding it back into the input drops characters
  // typed in the meantime. The URL is a mirror, so going back from a recipe
  // keeps the search.
  const [query, setQuery] = useState(urlQuery)
  const [seenLocationKey, setSeenLocationKey] = useState(location.key)

  // Adopt the URL after outside navigations, such as the brand link (push) or
  // Back and Forward (pop). Typing always replaces, so its own URL updates,
  // which arrive late, are ignored: adopting them would overwrite characters
  // typed in the meantime. This assumes no outside navigation to this page
  // uses replace; if one is added, it must be told apart from typing.
  if (location.key !== seenLocationKey) {
    setSeenLocationKey(location.key)
    if (navigationType !== 'REPLACE') {
      setQuery(urlQuery)
    }
  }

  const trimmedQuery = query.trim()
  const visibleRecipes = filterRecipesByTitle(recipes, query)

  // One live region announces the outcome, so a screen reader does not hear
  // the no-results message twice.
  let status = ''
  if (trimmedQuery !== '') {
    status =
      visibleRecipes.length === 0
        ? `Geen recepten gevonden voor ‘${trimmedQuery}’.`
        : formatResultCount(visibleRecipes.length)
  }

  // Replace avoids a history entry per keystroke, and the scroll position
  // must not reset while typing.
  function handleQueryChange(value: string) {
    setQuery(value)
    setSearchParams(value === '' ? {} : { q: value }, {
      replace: true,
      preventScrollReset: true,
    })
  }

  return (
    <section>
      <title>Recepten · Recipe Vault</title>
      <h1 className={styles.heading}>Recepten</h1>
      {recipes.length > 0 && (
        <div role="search" className={styles.search}>
          <label htmlFor={searchId} className={styles.label}>
            Zoek op titel
          </label>
          <input
            id={searchId}
            type="search"
            className={styles.input}
            value={query}
            autoComplete="off"
            onChange={(event) => handleQueryChange(event.target.value)}
          />
          <p role="status" className={styles.status}>
            {status}
          </p>
        </div>
      )}
      {(visibleRecipes.length > 0 || recipes.length === 0) && (
        <RecipeList recipes={visibleRecipes} />
      )}
    </section>
  )
}

export default RecipeOverview
