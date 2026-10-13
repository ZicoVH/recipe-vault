import { Link } from 'react-router'
import RecipeFacts from './RecipeFacts'
import styles from './RecipeDetail.module.css'
import { formatAmount } from './formatAmount'
import TagList from './TagList'
import type { Recipe } from './types'

type RecipeDetailProps = {
  recipe: Recipe
}

function RecipeDetail({ recipe }: RecipeDetailProps) {
  const {
    title,
    servings,
    prepTimeMinutes,
    cookTimeMinutes,
    tags,
    ingredients,
    steps,
  } = recipe

  return (
    <article className={styles.detail}>
      <title>{`${title} · Recipe Vault`}</title>
      <Link to="/" className={styles.back}>
        <span aria-hidden="true">←</span> Alle recepten
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <RecipeFacts
        servings={servings}
        prepTimeMinutes={prepTimeMinutes}
        cookTimeMinutes={cookTimeMinutes}
      />
      <div className={styles.tags}>
        <TagList tags={tags} />
      </div>
      {ingredients.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Ingrediënten</h2>
          <ul className={styles.ingredients}>
            {ingredients.map((ingredient, index) => {
              const amount = formatAmount(ingredient)
              return (
                <li key={index} className={styles.ingredient}>
                  {amount && <span className={styles.amount}>{amount}</span>}
                  <span className={styles.name}>
                    {ingredient.note
                      ? `${ingredient.name}, ${ingredient.note}`
                      : ingredient.name}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {steps.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.heading}>Bereiding</h2>
          <ol className={styles.steps}>
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
      )}
    </article>
  )
}

export default RecipeDetail
