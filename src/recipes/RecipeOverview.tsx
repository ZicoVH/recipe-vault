import RecipeList from './RecipeList'
import styles from './RecipeOverview.module.css'
import type { Recipe } from './types'

type RecipeOverviewProps = {
  recipes: Recipe[]
}

function RecipeOverview({ recipes }: RecipeOverviewProps) {
  return (
    <section>
      <h2 className={styles.heading}>Recepten</h2>
      <RecipeList recipes={recipes} />
    </section>
  )
}

export default RecipeOverview
