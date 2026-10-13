import { useParams } from 'react-router'
import NotFound from '../NotFound'
import RecipeDetail from './RecipeDetail'
import type { Recipe } from './types'

type RecipeDetailRouteProps = {
  recipes: Recipe[]
}

function RecipeDetailRoute({ recipes }: RecipeDetailRouteProps) {
  const { recipeId } = useParams()
  const recipe = recipes.find((candidate) => candidate.id === recipeId)

  if (!recipe) {
    return (
      <NotFound
        heading="Recept niet gevonden"
        message="Dit recept bestaat niet (meer)."
      />
    )
  }

  return <RecipeDetail recipe={recipe} />
}

export default RecipeDetailRoute
