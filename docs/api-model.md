# Data and API model

Status: proposed, for ticket 0.4. Provisional until ADR 0001 is accepted. This document defines the recipe model, the REST API contract and the export format. It is technology-neutral about storage. Limits and defaults marked "proposal" are design choices, not measured values, and can change during implementation.

Based on `docs/requirements.md` (D5, D6, D9, D10, D11, D12, D13, D15, D17, D18) and `docs/adr/0001-backend-architecture.md`.

## Principles

- **Single user, no auth.** There is no user id on any record (D1, D15).
- **No photo or multi-user fields.** New fields can be added later without breaking existing clients (D15).
- **The API is language-neutral.** Errors carry stable codes and field paths. The frontend maps them to Dutch messages (US3).
- **The server owns ids and timestamps.** Clients never send them.
- **JSON over HTTP**, all under `/api`, UTF-8.

## Recipe model

```ts
type Ingredient = {
  name: string // required, e.g. "boter" or "een snufje zout"
  quantity: number | null // optional, positive decimal, e.g. 2.5
  unit: string | null // optional, e.g. "g", "ml", "el"
  note: string | null // optional, e.g. "fijngehakt"
}

type Recipe = {
  id: string // UUID, server generated
  title: string // required
  servings: number // required, whole number >= 1 (D12)
  prepTimeMinutes: number | null // optional, whole number >= 1 (D8)
  cookTimeMinutes: number | null // optional, whole number >= 1 (D8)
  ingredients: Ingredient[] // order is meaningful
  steps: string[] // ordered, the array order is the step order
  tags: string[]
  createdAt: string // ISO 8601, UTC
  updatedAt: string // ISO 8601, UTC
  deletedAt: string | null // null = active, set = in trash (D10)
}
```

### Ingredients (D5)

- Only `name` is required. `quantity`, `unit` and `note` are optional.
- Free expressions such as "a pinch of salt" are entered as a name only: `{ name: "een snufje zout", quantity: null, unit: null, note: null }`.
- `unit` is free text with a length limit and is not an enum. Metric units only (D6) is enforced in the UI by suggesting metric units, not by the API.
- A recipe is scalable only when its ingredients have a numeric `quantity`. Scaling is out of scope for the MVP (R3). Ingredients without a quantity are never scaled.

### Tags (D7, D13)

- The server trims every tag and drops empty ones.
- Duplicates ignoring case are collapsed to the first spelling, so `["Winter", "winter"]` is stored as `["Winter"]`.
- Tags are plain strings on the recipe. There is no separate tag resource to manage.

### Validation limits (proposal)

| Field                     | Rule                                                 |
| ------------------------- | ---------------------------------------------------- |
| `title`                   | 1 to 200 characters after trimming                   |
| `servings`                | whole number, 1 to 1000                              |
| `prepTimeMinutes`         | null, or whole number 1 to 14400                     |
| `cookTimeMinutes`         | null, or whole number 1 to 14400                     |
| `ingredients`             | 0 to 100 items                                       |
| `ingredient.name`         | 1 to 200 characters                                  |
| `ingredient.quantity`     | null, or number greater than 0 and at most 1,000,000 |
| `ingredient.unit`, `note` | null, or 1 to 50 and 1 to 200 characters             |
| `steps`                   | 0 to 100 items, 1 to 5000 characters each            |
| `tags`                    | 0 to 30 items, 1 to 50 characters each               |

A recipe can have zero ingredients or zero steps. US1 requires only title and servings.

## API

Base path `/api`. Bodies are JSON. List endpoints return everything, with no pagination, because the MVP collection is small (about 500 recipes is the spike's reference size).

### Resources

| Method and path               | Purpose                        | Success                                                  |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- |
| `GET /api/health`             | Liveness check                 | `200 { "status": "ok" }`                                 |
| `GET /api/recipes`            | List and search active recipes | `200 { "items": RecipeSummary[] }`                       |
| `POST /api/recipes`           | Create a recipe                | `201 Recipe`                                             |
| `GET /api/recipes/:id`        | Read one recipe                | `200 Recipe`                                             |
| `PUT /api/recipes/:id`        | Replace all editable fields    | `200 Recipe`                                             |
| `DELETE /api/recipes/:id`     | Move to trash                  | `204`                                                    |
| `GET /api/trash`              | List trashed recipes           | `200 { "items": RecipeSummary[] }`                       |
| `POST /api/trash/:id/restore` | Restore from trash             | `200 Recipe`                                             |
| `DELETE /api/trash/:id`       | Permanently delete (US4)       | `204`                                                    |
| `GET /api/tags`               | Tags in use, with counts       | `200 { "items": { "name": string, "count": number }[] }` |
| `GET /api/export`             | Download all active recipes    | `200` JSON file                                          |
| `POST /api/import`            | Add recipes from an export     | `200 { "added": number }`                                |

```ts
type RecipeSummary = {
  id: string
  title: string
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  tags: string[]
  deletedAt: string | null
}
```

### Behavior

- **Create and update** take the editable fields only: `title`, `servings`, `prepTimeMinutes`, `cookTimeMinutes`, `ingredients`, `steps`, `tags`. Unknown fields are rejected. `PUT` replaces the whole recipe, so a missing optional field becomes null or empty.
- **`GET /api/recipes/:id`** returns the recipe whether it is active or trashed. The frontend uses `deletedAt` to tell the difference.
- **`PUT` on a trashed recipe** is rejected with `409 recipe_trashed`. The recipe must be restored first.
- **`DELETE /api/recipes/:id`** moves a recipe to trash and sets `deletedAt`. It is safe to repeat. A missing id returns `404`. Nothing is ever purged automatically (D10).
- **`POST /api/trash/:id/restore`** clears `deletedAt` and returns the recipe with all data intact. If the recipe is not in trash, it returns `409 not_in_trash`.
- **`DELETE /api/trash/:id`** removes a recipe for good and works only for trashed recipes. An active recipe returns `409 not_in_trash`. There is no bulk "empty trash" endpoint (D18). The frontend asks for explicit confirmation before calling it.
- **Ordering:** lists are sorted by title, ignoring case and accents. Trash is sorted by `deletedAt`, newest first. Collation for Dutch and other languages needs care (R6) and is settled in implementation.

### Search and filter (D9, D17)

`GET /api/recipes?q=<text>&tag=<name>&tag=<name>`

- `q` is split on whitespace into terms. A recipe matches when every term matches the start of a word in its title, an ingredient name or a tag.
- Matching ignores case and accents, so "creme brulee" finds "Crème brûlée".
- `tag` can repeat. A recipe must have all given tags (AND, D17). Tag comparison ignores case but not accents, so `tag=eclair` does not match "Éclair". The tag list (`GET /api/tags`) groups with the same case rule, so its counts equal the filter results.
- No `q` and no `tag` returns all active recipes.
- Trashed recipes are never returned by this endpoint.
- No match returns `200` with an empty `items` list. The frontend shows the Dutch empty-result message.

### Errors

All errors use one shape:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "English text for logs and developers",
    "fields": [{ "path": "ingredients[2].name", "code": "required" }]
  }
}
```

| Status | `code`                       | When                                                              |
| ------ | ---------------------------- | ----------------------------------------------------------------- |
| 400    | `validation_failed`          | Invalid or unknown fields. `fields` lists each problem.           |
| 400    | `invalid_json`               | The body is not valid JSON.                                       |
| 404    | `not_found`                  | No recipe with this id.                                           |
| 409    | `recipe_trashed`             | Update of a trashed recipe.                                       |
| 409    | `not_in_trash`               | Restore or permanent delete of an active recipe.                  |
| 415    | `unsupported_media_type`     | The body is not JSON (for example `application/xml`).             |
| 413    | `payload_too_large`          | Body above the limit (proposal: 5 MB for import, 1 MB elsewhere). |
| 422    | `unsupported_schema_version` | Import file has a version the server cannot read.                 |
| 500    | `internal_error`             | Unexpected failure. No details are exposed.                       |

Field `code` values: `required`, `too_short`, `too_long`, `out_of_range`, `not_integer`, `wrong_type`, `unknown_field`. The frontend owns the Dutch text for each code (US3).

## Export and import format (US7, US8, D11)

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-10-13T12:00:00Z",
  "recipes": [
    {
      "title": "Stoofvlees met friet",
      "servings": 4,
      "prepTimeMinutes": 30,
      "cookTimeMinutes": 180,
      "ingredients": [
        {
          "name": "rundsvlees",
          "quantity": 800,
          "unit": "g",
          "note": "in blokken"
        }
      ],
      "steps": ["Kruid het vlees met zout en peper."],
      "tags": ["hoofdgerecht", "belgisch"]
    }
  ]
}
```

- **Export** contains active recipes only. It has no ids, timestamps or trash state (US7).
- **`schemaVersion`** is an integer. The first version is `1`. Any change that existing readers cannot handle increases it.
- **Import** validates the whole file first, with the same rules as create. Any problem rejects the file with a clear error, and nothing is changed (US8).
- **Import is all or nothing.** All recipes are created as new, with new ids and timestamps. Existing recipes are never overwritten or deleted, and duplicates of existing titles are allowed (D11).
- **The result** reports how many recipes were added: `{ "added": 12 }`.
- Unknown extra fields in an import file are rejected, like in create.
- An import file may hold at most 5,000 recipes (proposal). More is rejected with `too_long` on `recipes`.

## Storage guidance (non-binding)

The storage layout is decided in ticket 1.1. The pre-spike used a layout that worked and is a reasonable starting point:

- Tables for recipes, ingredients, steps and tags, with a position column for ingredients and steps so order is kept.
- A trashed state as a nullable `deletedAt`.
- A full-text index over title, ingredient names and tags with an accent-removing tokenizer, built on SQLite FTS5. The index is keyed on the recipe id, not on `rowid`, which SQLite may renumber on `VACUUM`. Search text is NFC-normalized and ligatures are expanded before indexing and querying.
- Versioned schema migrations (ADR 0001).

## Frontend impact

The temporary frontend `Recipe` type (`apps/web/src/recipes/types.ts`) differs from this model and is replaced in ticket 2.1:

- `Ingredient.amount` (free text such as "2 sneetjes") becomes `quantity`, `unit` and `note`. The mock data needs converting, for example `{ amount: "2 sneetjes", name: "peperkoek" }` becomes quantity 2, unit "sneetjes".
- Optional times change from `undefined` to `null`.
- Recipes gain `createdAt`, `updatedAt` and `deletedAt`.
- The list view uses `RecipeSummary`, so it no longer needs full ingredient and step data.

## Open points

- Final limits in the validation table. They are proposals.
- Dutch collation for sorting (R6).
- Whether `unit` should offer a fixed suggestion list. This is a UI decision for ticket 2.2.
