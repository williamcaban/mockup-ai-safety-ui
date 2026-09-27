# AI Safety Studio Mockup — Agent Guidance

## Goal

Keep the prototype easy for people to understand, review, and change. Favor small, cohesive modules with clear ownership over monolithic files or abstractions that hide the UI behavior.

## Frontend structure

The application lives in `frontend/` and uses React, TypeScript, Vite, and PatternFly 6.

- Keep `src/App.tsx` focused on application-level state, navigation, and composition of page views. Put page-specific markup and behavior in `src/views/`.
- Put reusable UI pieces in `src/components/`. Extract a component when it has a clear responsibility, meaningful props, or its own interaction flow (for example, a dialog, editor, or table section).
- Keep domain types in `src/types.ts`, mock records grouped by domain in `src/data/`, and framework-independent helpers in `src/utils/`.
- Keep each component responsible for one coherent area. Separate complex workflows into focused components and hooks when that makes state transitions easier to follow. Avoid both giant components and excessive one-line wrappers.
- Treat file length as a reviewability signal, not a hard limit. When a file grows beyond a few hundred lines, look for separable responsibilities before adding more code. Keep large static fixtures out of UI components.
- Prefer explicit, typed props and domain-specific types. Avoid `any`, broad casts, duplicated state, and effects where derived values or event handlers are sufficient.
- Keep related state close to the component or hook that owns the workflow. Lift it only when multiple views need to share it.

## PatternFly and accessibility

- Prefer PatternFly components and design tokens for common controls, tables, dialogs, alerts, labels, spacing, and colors. Use custom UI only when the product interaction needs behavior PatternFly does not provide directly.
- Follow the installed PatternFly version and verify component props against the project dependencies; do not guess APIs.
- Preserve keyboard operation, visible focus, accessible names, semantic headings, and appropriate live-region behavior when changing interactions.
- Keep CSS specific to the feature or shared layout it styles. `src/styles.css` is the stylesheet entry point; place new rules in the appropriate file under `src/styles/` and import it there. Avoid growing the entry file into a second monolith.
- Prefer PatternFly tokens for colors, borders, and surfaces. Keep responsive rules with the stylesheet layer they affect or in `responsive.css` when they span features.

## Maintainability and review

- Make the smallest coherent change that addresses the request. Preserve existing behavior unless the request calls for a behavior change.
- Keep imports explicit and domain-focused. Prefer importing from the owning module over adding unrelated responsibilities to a shared barrel.
- Use descriptive component, function, state, and CSS names. Keep event handlers close to their relevant controls and extract nontrivial transformations into named helpers.
- Avoid adding dependencies for functionality available in the existing stack.
- Before finishing, review the diff for accidental behavior changes, dead code, duplicated rules, and unrelated edits. Keep formatting and whitespace clean.
- Describe the resulting module boundaries and any remaining reviewability concerns in the final summary.

## Verification

Run commands from `frontend/`:

```bash
npm run build
```

Run the relevant automated tests when a test suite is configured. If there is no test script or suite, say so clearly; do not imply that tests passed. For interactive UI changes, use the available browser or UI workflow when practical and report what was checked.
