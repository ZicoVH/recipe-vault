import { Link } from 'react-router'
import RecipeFacts from './RecipeFacts'
import styles from './RecipeCard.module.css'
import TagList from './TagList'
import type { Recipe } from './types'

type RecipeCardProps = {
  recipe: Recipe
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const { id, title, prepTimeMinutes, cookTimeMinutes, tags } = recipe

  return (
    <article className={styles.card}>
      <h2 className={styles.title}>
        <Link to={`/recepten/${id}`} className={styles.link}>
          {title}
        </Link>
      </h2>
      <RecipeFacts
        prepTimeMinutes={prepTimeMinutes}
        cookTimeMinutes={cookTimeMinutes}
      />
      <div className={styles.tags}>
        <TagList tags={tags} />
      </div>
    </article>
  )
}

export default RecipeCard
