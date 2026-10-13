import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import Layout from './Layout'
import NotFound from './NotFound'
import RecipeDetailRoute from './recipes/RecipeDetailRoute'
import RecipeOverview from './recipes/RecipeOverview'
import { mockRecipes } from './recipes/mockRecipes'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RecipeOverview recipes={mockRecipes} /> },
      {
        path: 'recepten/:recipeId',
        element: <RecipeDetailRoute recipes={mockRecipes} />,
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
