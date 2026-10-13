import { useActionData, useLoaderData, useNavigation } from 'react-router'
import type { trashLoader } from '../loaders'
import type { TrashResult } from './trashActions'
import TrashPage from './TrashPage'

function TrashRoute() {
  const recipes = useLoaderData<Awaited<ReturnType<typeof trashLoader>>>()
  const result = useActionData<TrashResult>()
  const navigation = useNavigation()

  return (
    <TrashPage
      recipes={recipes}
      result={result}
      busy={navigation.state !== 'idle'}
    />
  )
}

export default TrashRoute
