import styles from './App.module.css'
import RecipeOverview from './recipes/RecipeOverview'
import { mockRecipes } from './recipes/mockRecipes'

function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Recipe Vault</h1>
        <p>Jouw persoonlijke receptencollectie</p>
      </header>
      <main>
        <RecipeOverview recipes={mockRecipes} />
      </main>
    </div>
  )
}

export default App
