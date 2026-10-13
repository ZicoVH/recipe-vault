import { useLoaderData } from 'react-router'
import RecipeOverview from './RecipeOverview'
import type { overviewLoader } from './loaders'

function RecipeOverviewRoute() {
  const recipes = useLoaderData<Awaited<ReturnType<typeof overviewLoader>>>()
  return <RecipeOverview recipes={recipes} />
}

export default RecipeOverviewRoute
