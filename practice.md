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

One feature = one commit. Do not bundle several approved features into a single commit.

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

## Checklist for each feature

- [ ] The feature works (checked in the preview)
- [ ] `README.md` description/features updated
- [ ] Git commands printed in the chat
- [ ] Committed automatically (one feature, one commit)
- [ ] Pushed to GitHub and confirmed
