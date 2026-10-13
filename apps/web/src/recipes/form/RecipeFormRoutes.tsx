import { useLoaderData } from 'react-router'
import NotFound from '../../NotFound'
import type { detailLoader } from '../loaders'
import RecipeForm from './RecipeForm'

export function RecipeNewRoute() {
  return <RecipeForm recipe={null} />
}

export function RecipeEditRoute() {
  const recipe = useLoaderData<Awaited<ReturnType<typeof detailLoader>>>()

  if (!recipe) {
    return (
      <NotFound
        heading="Recept niet gevonden"
        message="Dit recept bestaat niet (meer)."
      />
    )
  }

  // The key resets the form state when another recipe is opened.
  return <RecipeForm key={recipe.id} recipe={recipe} />
}
