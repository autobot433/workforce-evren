# Put Workforce Evren on GitHub

The repository folder and ZIP contain the source you need. The original project is unchanged. Upload the **contents of `workforce-evren/`**, not its parent output folder, so `package.json` and `README.md` appear at the repository root.

## Recommended: Git

Create an empty GitHub repository named `workforce-evren`. Do not initialize it with a second README. From this project folder:

```sh
git init -b main
git add .
git commit -m "Build Workforce Evren staffing workspace"
```

Then copy the remote URL from your new GitHub repository, run `git remote add origin` with that URL, and run:

```sh
git push -u origin main
```

`.gitignore` excludes `node_modules/`, `dist/`, local databases, environment secrets, and logs. Git uploads `.github/` so the CI workflow is included. No GitHub account operation has been performed for you.

## Repository presentation

Suggested description:

> Full-stack staffing analytics workspace with explainable incentive modeling, React, TypeScript, Express, SQLite, and automated tests.

Suggested topics: `react`, `typescript`, `sqlite`, `express`, `full-stack`, `dashboard`, `portfolio-project`.

Pin the repository to your profile and use the README's demo sequence when presenting it. Do not add an unverified deployment link. This application requires its Node/SQLite server and does not run on GitHub Pages alone.

For the first demo, run `npm ci` and `npm run dev`. For a single local server, run `npm run build` followed by `npm start`. If GitHub Actions fails later because of an upstream dependency change, inspect the job output and keep the lockfile committed.
