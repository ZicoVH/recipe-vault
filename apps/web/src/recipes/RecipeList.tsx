import RecipeCard from './RecipeCard'
import styles from './RecipeList.module.css'
import type { Recipe } from './types'

type RecipeListProps = {
  recipes: Recipe[]
}

function RecipeList({ recipes }: RecipeListProps) {
  if (recipes.length === 0) {
    return <p>Nog geen recepten.</p>
  }

  return (
    <ul className={styles.list}>
      {recipes.map((recipe) => (
        <li key={recipe.id}>
          <RecipeCard recipe={recipe} />
        </li>
      ))}
    </ul>
  )
}

export default RecipeList
