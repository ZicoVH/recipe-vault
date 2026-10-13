import styles from './TagFilter.module.css'
import type { TagCount } from './types'

type TagFilterProps = {
  tags: TagCount[]
  /** Tags currently chosen. Compared ignoring case, like the API does. */
  selected: string[]
  onToggle: (tag: string) => void
}

type Item = { name: string; count?: number }

/** How many of the most used tags are shown before "Meer tags". */
const VISIBLE_TAGS = 12
/** Hiding fewer tags than this is not worth a toggle. */
const MIN_HIDDEN = 4

/** Checkboxes shaped like chips. A recipe must have every chosen tag (AND). */
function TagFilter({ tags, selected, onToggle }: TagFilterProps) {
  const isSelected = (name: string) =>
    selected.some((tag) => tag.toLowerCase() === name.toLowerCase())

  // A tag from the URL that no recipe uses (any more) stays visible, so it can
  // be unchecked.
  const unknown = selected.filter(
    (tag) =>
      !tags.some((known) => known.name.toLowerCase() === tag.toLowerCase()),
  )
  const items: Item[] = [...tags, ...unknown.map((name) => ({ name }))]
  if (items.length === 0) return null

  // Show the most used tags and everything chosen. The rest waits behind a
  // toggle, so many tags do not push the results off the screen.
  const mostUsed = new Set(
    [...tags]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'nl'))
      .slice(0, VISIBLE_TAGS)
      .map((tag) => tag.name),
  )
  const hidden = items.filter(
    (item) => !mostUsed.has(item.name) && !isSelected(item.name),
  )
  const showAll = hidden.length < MIN_HIDDEN
  const shown = showAll ? items : items.filter((item) => !hidden.includes(item))

  function renderChip({ name, count }: Item) {
    const checked = isSelected(name)
    return (
      <li key={name}>
        <label className={styles.chip}>
          <input
            type="checkbox"
            className={styles.check}
            checked={checked}
            onChange={() => onToggle(name)}
          />
          <span className={styles.chipText}>
            {/* A check mark, so the state does not rely on colour alone. */}
            {checked && (
              <span aria-hidden="true" className={styles.tick}>
                ✓
              </span>
            )}
            {name}
            {count !== undefined && (
              <>
                <span aria-hidden="true" className={styles.count}>
                  {' '}
                  ({count})
                </span>
                <span className={styles.visuallyHidden}>
                  , {count === 1 ? '1 recept' : `${count} recepten`}
                </span>
              </>
            )}
          </span>
        </label>
      </li>
    )
  }

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Filter op tag</legend>
      <p className={styles.hint}>Een recept moet alle gekozen tags hebben.</p>
      <ul className={styles.chips}>{shown.map(renderChip)}</ul>
      {!showAll && (
        <details className={styles.more}>
          <summary className={styles.summary}>
            Meer tags ({hidden.length})
          </summary>
          <ul className={styles.chips}>{hidden.map(renderChip)}</ul>
        </details>
      )}
    </fieldset>
  )
}

export default TagFilter
