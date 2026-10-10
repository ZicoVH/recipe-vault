import RecipeList from './RecipeList'
import styles from './RecipeOverview.module.css'
import type { Recipe } from './types'

type RecipeOverviewProps = {
  recipes: Recipe[]
}

function RecipeOverview({ recipes }: RecipeOverviewProps) {
  return (
    <section>
      <title>Recepten · Recipe Vault</title>
      <h1 className={styles.heading}>Recepten</h1>
      <RecipeList recipes={recipes} />
    </section>
  )
}

export default RecipeOverview
