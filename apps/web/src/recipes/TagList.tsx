import styles from './TagList.module.css'

type TagListProps = {
  tags: string[]
}

function TagList({ tags }: TagListProps) {
  if (tags.length === 0) return null

  return (
    <ul className={styles.tags}>
      {tags.map((tag) => (
        <li key={tag} className={styles.tag}>
          {tag}
        </li>
      ))}
    </ul>
  )
}

export default TagList
