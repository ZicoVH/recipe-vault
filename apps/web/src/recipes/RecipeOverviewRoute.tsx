import { useLoaderData } from 'react-router'
import RecipeOverview from './RecipeOverview'
import type { overviewLoader } from './loaders'

function RecipeOverviewRoute() {
  const data = useLoaderData<Awaited<ReturnType<typeof overviewLoader>>>()
  return <RecipeOverview data={data} />
}

export default RecipeOverviewRoute
