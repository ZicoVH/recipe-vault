---
name: frontend-feature
description: Guided workflow for a Recipe Vault frontend feature, with approval gates before coding and before committing.
disable-model-invocation: true
argument-hint: '[feature description]'
---

Guide the feature described here: $ARGUMENTS

If no description was given, ask for one and stop.

Follow `CLAUDE.md` for conventions and commands, and do not restate them. Do not add search, filters, forms, CRUD, persistence, API calls or a backend unless the feature explicitly requires it. Do not commit or push unless the user asks.

## 1. Understand

- Read the relevant code and the matching parts of `docs/requirements.md`. Name the story or decision IDs the feature touches (for example US2, D14).
- If the feature is outside the MVP scope or contradicts a decision, say so before going further.
- Ask only the questions you cannot answer from the code or the docs. If nothing blocks you, ask none.

## 2. Scope and acceptance criteria

- State what is in scope and what is explicitly out of scope.
- Write testable acceptance criteria, including 360 px width, Dutch copy, keyboard use and the empty or unknown-data cases that apply.
- Label assumptions as assumptions.

## 3. Plan, then stop

- Write a short plan: files to create or change, the order of small steps, any dependency change (needs separate approval), risks, and how you will verify it.
- Make no changes. End by asking for approval and **wait**. Silence, a question or a request to adjust the plan is not approval.

## 4. Implement in small steps

- Only after explicit approval. Work in small, reviewable steps that follow the plan.
- Do not expand scope. If something new comes up, stop and report it.
- Do not install dependencies unless the approved plan says so.

## 5. Verify

- Run `npm run lint`, `npm run format:check` and `npm run build` as three separate commands and report each result. Fix failures caused by your changes; report others.
- If you cannot check the rendering yourself, say so. Do not claim visual or accessibility checks that you did not run.

## 6. Review

- Run the `frontend-reviewer` subagent once, after the checks pass, and name what to review. Do not review it yourself in its place, and do not substitute another agent.
- Report its findings as Must fix, Should fix and Suggestions, with your own verification notes (the reviewer can get line numbers wrong). Do not apply fixes unless approved.

## 7. Report and stop

- Summarise what was built against the acceptance criteria, the check results, the review findings, what is not verified, and `git status`.
- Ask whether to commit. **Wait** for explicit approval, then commit only the related files with a conventional message.
