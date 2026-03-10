# Contributing

Thanks for your interest in contributing to Niko Table. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request. We also strongly recommend that you check for open issues and pull requests to see if someone else is working on something similar.

## About this repository

This repository is an Astro Starlight project.

- We use `pnpm` for development (npm also works).
- We use `prettier` for code formatting (which is automatically run on commit).
- We use **Conventional Commits** for commit messages; the changelog is generated from them.

## Structure

This repository is structured as follows:

```text
src
├── assets
├── components
├── content/docs
|   ├── components
|   ├── contributing
|   └── getting-started
└── registry/new-york
    ├── examples
    └── items
```

| Path                             | Description                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `src/assets`                     | Any logos/images for the documentation site.                                     |
| `src/components`                 | Components used to create the documentation site.                                |
| `src/content/docs/components`    | Individual documentation pages for each component.                               |
| `src/content/getting-started`    | One off guides for the getting started section of the documentation.             |
| `src/content/docs/contributing`  | Documentation for contributing to the registry.                                  |
| `src/registry/new-york/examples` | Example files used for rendering in the documentation pages for each component.  |
| `src/registry/new-york/items`    | The implementation of the component that will be installed in the users project. |

## Development

### Fork this repo

You can fork this repo by clicking the fork button in the top right corner of this page.

### Clone on your local machine

```bash
git clone git@github.com:Semkoo/niko-table-registry.git
```

### Navigate to project directory

```bash
cd niko-table-registry
```

### Create a new Branch

```bash
git checkout -b my-new-branch
```

### Install dependencies

```bash
pnpm install
# or
npm install
```

### Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

### Run the development server

```bash
pnpm dev
# or
npm run dev
```

## Building the registry locally

To test that your registry builds correctly, you can run the following command:

```bash
pnpm registry:build
# or
npm run registry:build
```

Then try installing any component from the registry in a new project using the `shadcn add` command:

```bash
npx shadcn@latest add http://localhost:4321/r/<component-name>.json
```

## Changelog

The project uses **Conventional Commits** for commit messages. The changelog is generated automatically from git history.

### Commit format

Use the following format for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**

- `feat(table): add row click handler`
- `fix(pagination): correct page index on page size change`
- `docs: update installation guide`
- `BREAKING CHANGE:` in the body or footer for breaking changes

Commit messages are validated on commit via `commitlint` (husky `commit-msg` hook).

### Generating the changelog

When cutting a release, run:

```bash
npm run changelog
```

This updates `src/components/niko-table/CHANGELOG.md` from git tags and commit messages. The docs site changelog page reads from this file.

## Requests for new components

If you have a request for a new component, please open a discussion on GitHub. We'll be happy to help you out.
