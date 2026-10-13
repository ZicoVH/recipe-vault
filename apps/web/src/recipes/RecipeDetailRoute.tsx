import { useActionData, useLoaderData } from 'react-router'
import NotFound from '../NotFound'
import RecipeDetail from './RecipeDetail'
import type { detailLoader } from './loaders'
import type { TrashResult } from './trash/trashActions'

function RecipeDetailRoute() {
  const recipe = useLoaderData<Awaited<ReturnType<typeof detailLoader>>>()
  const result = useActionData<TrashResult>()

  if (!recipe) {
    return (
      <NotFound
        heading="Recept niet gevonden"
        message="Dit recept bestaat niet (meer)."
      />
    )
  }

  return (
    <RecipeDetail
      recipe={recipe}
      deleteFailure={result?.status === 'failed' ? result : undefined}
    />
  )
}

export default RecipeDetailRoute
