# Practice — How We Work on the Bakery Dashboard

Follow these rules for every change to this project.

## 1. Commit and push automatically

Do not wait for approval. As soon as a feature or change is finished and working, commit and push it without being asked. (The user changed this rule on 2026-11-24; before that, commits waited for approval.)

For each finished feature or change:

1. Print every git command in the chat before running it.
2. Stage only the files that belong to that feature.
3. Commit with a short, clear message that names the feature.
4. Push to `origin main`.
5. Confirm the push worked (`git status -sb` should show no difference from `origin/main`) and report the commit.

One feature = one commit. Do not bundle several unrelated features into a single commit. The README and `spec.md` updates (rules 2 and 3) go in the same commit as the feature.

```powershell
git add <files for this feature>
git commit -m "Add <feature name>"
git push origin main
git status -sb
```

Do not commit secrets (passwords, API keys, `.env` files).

## 2. Keep a README that describes the dashboard

Create `README.md` if it does not exist yet. After each feature, update it **in the same commit** as the feature, so the README always matches what the dashboard can do.

The README should contain:

- **Title and logo:** The Bakery Shop Sales Dashboard, with `assets/logo.jpg`.
- **Description:** one or two sentences on what the dashboard is and who it is for.
- **Features:** a bullet list of what works today. Add a new bullet (or change an existing one) for each approved feature.
- **How to run / view it:** the steps to open the dashboard.
- **Link to the spec:** point to `spec.md` for the full design.

Keep it short and written in plain language. Only list features that actually exist, not planned ones.

## 3. Keep spec.md up to date

`spec.md` is the source of truth for how the dashboard should look and behave. Whenever a change affects the design or the features, update `spec.md` to match **in the same commit** as the change. This includes:

- sizes, colors, fonts and other style choices (§3, §4, §6)
- layout and navigation (§5)
- screens, features and behavior (§7, §9)
- accessibility rules (§10), tech choices (§11), acceptance criteria (§12) and open questions (§14)

How:

1. Find the sections of `spec.md` that describe what you changed (search for the old values, such as colors or pixel sizes, so none are left behind).
2. Edit them so the spec describes the new behavior, including the wireframe in §5.1 and the checklist in §12 when they are affected.
3. Add a row to the revision history (§15) with the next version number, the date and a short list of what changed.
4. If the spec and the code disagree, fix whichever one is wrong, then make them match.

If a change truly does not affect the design or features (for example a typo fix or a refactor), the spec does not need to change.

## Checklist for each feature

- [ ] The feature works (checked in the preview)
- [ ] `README.md` description/features updated
- [ ] `spec.md` updated to match, with a new revision-history row
- [ ] Git commands printed in the chat
- [ ] Committed automatically (one feature, one commit)
- [ ] Pushed to GitHub and confirmed
