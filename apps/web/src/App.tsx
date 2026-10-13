import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import Layout from './Layout'
import NotFound from './NotFound'
import PageLoading from './PageLoading'
import RouteError from './RouteError'
import RecipeDetailRoute from './recipes/RecipeDetailRoute'
import {
  createRecipeAction,
  updateRecipeAction,
} from './recipes/form/formActions'
import {
  RecipeEditRoute,
  RecipeNewRoute,
} from './recipes/form/RecipeFormRoutes'
import RecipeOverviewRoute from './recipes/RecipeOverviewRoute'
import {
  reloadUnlessRequestFailed,
  trashPageAction,
  trashRecipeAction,
} from './recipes/trash/trashActions'
import TrashRoute from './recipes/trash/TrashRoute'
import {
  detailLoader,
  ignoreSearchChange,
  keepFormAfterFailedSave,
  overviewLoader,
  trashLoader,
} from './recipes/loaders'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    hydrateFallbackElement: <PageLoading />,
    children: [
      {
        // Pathless route: a failed loader shows the error page inside the layout.
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: <RecipeOverviewRoute />,
            loader: overviewLoader,
            shouldRevalidate: ignoreSearchChange,
          },
          {
            path: 'prullenbak',
            element: <TrashRoute />,
            loader: trashLoader,
            shouldRevalidate: reloadUnlessRequestFailed,
            action: trashPageAction,
          },
          {
            path: 'recepten/nieuw',
            element: <RecipeNewRoute />,
            action: createRecipeAction,
          },
          {
            path: 'recepten/:recipeId',
            element: <RecipeDetailRoute />,
            loader: detailLoader,
            shouldRevalidate: reloadUnlessRequestFailed,
            action: trashRecipeAction,
          },
          {
            path: 'recepten/:recipeId/bewerken',
            element: <RecipeEditRoute />,
            loader: detailLoader,
            shouldRevalidate: keepFormAfterFailedSave,
            action: updateRecipeAction,
          },
        ],
      },
      {
        path: '*',
        element: (
          <NotFound
            heading="Pagina niet gevonden"
            message="Deze pagina bestaat niet."
          />
        ),
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
