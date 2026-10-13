import { useEffect, useRef } from 'react'
import { Form, Link, useNavigation } from 'react-router'
import buttons from '../Button.module.css'
import RecipeFacts from './RecipeFacts'
import styles from './RecipeDetail.module.css'
import { formatAmount } from './formatAmount'
import TagList from './TagList'
import type { TrashResult } from './trash/trashActions'
import type { Recipe } from './types'

type RecipeDetailProps = {
  recipe: Recipe
  /** The failed attempt to move the recipe to the trash, if there was one. */
  deleteFailure?: Extract<TrashResult, { status: 'failed' }>
}

function RecipeDetail({ recipe, deleteFailure }: RecipeDetailProps) {
  const navigation = useNavigation()
  const errorRef = useRef<HTMLParagraphElement>(null)

  // The delete button was disabled during the request, which drops focus.
  // Put it on the message, which also reads it out. Runs for every failed
  // attempt, because each result is a new object.
  useEffect(() => {
    if (deleteFailure) errorRef.current?.focus()
  }, [deleteFailure])
  const {
    id,
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
      <div className={styles.topBar}>
        <Link to="/" className={styles.back}>
          <span aria-hidden="true">←</span> Alle recepten
        </Link>
        <Link to={`/recepten/${id}/bewerken`} className={buttons.secondary}>
          Bewerken
        </Link>
      </div>
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
                  {amount && (
                    <>
                      <span className={styles.amount}>{amount}</span>{' '}
                    </>
                  )}
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
      <section className={styles.dangerZone}>
        <h2 className={styles.heading}>Recept verwijderen</h2>
        <p>
          Het recept gaat naar de prullenbak. Daar kun je het terugzetten of
          definitief verwijderen.
        </p>
        {deleteFailure && (
          <p ref={errorRef} tabIndex={-1} className={styles.deleteError}>
            {deleteFailure.message}
          </p>
        )}
        <Form method="post">
          <button
            type="submit"
            className={buttons.danger}
            disabled={navigation.state !== 'idle'}
          >
            Verwijderen
          </button>
        </Form>
      </section>
    </article>
  )
}

export default RecipeDetail
