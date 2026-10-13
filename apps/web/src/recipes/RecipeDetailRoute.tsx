import { useLoaderData } from 'react-router'
import NotFound from '../NotFound'
import RecipeDetail from './RecipeDetail'
import type { detailLoader } from './loaders'

function RecipeDetailRoute() {
  const recipe = useLoaderData<Awaited<ReturnType<typeof detailLoader>>>()

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
