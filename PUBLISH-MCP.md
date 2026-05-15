# How to Publish `niko-table-mcp` to NPM

Since the MCP code and GitHub Actions are fully built and compiling correctly, you just need to wait for your `npmjs.com` account to be retrieved.

Once you have your account back, follow these exact steps to publish the MCP server to the world automatically.

## Step 1: Generate an NPM Token

1. Log in to your [npmjs.com](https://www.npmjs.com/) account.
2. Click on your profile picture in the top right and select **Access Tokens**.
3. Click **Generate New Token** and select **Automation** (this allows the CI/CD pipeline to publish packages without requiring 2FA on every push).
4. Copy the generated token string (you will only see it once).

## Step 2: Add the Token to GitHub

1. Go to your `niko-table-registry` repository on GitHub.
2. Click on the **Settings** tab.
3. In the left sidebar, scroll down to **Secrets and variables** and click **Actions**.
4. Click the green **New repository secret** button.
5. Set the Name to exactly: `NPM_TOKEN`
6. Paste your copied token into the Secret box and hit **Add secret**.

## Step 3: Trigger the Automated Release

We configured the GitHub Action to publish whenever you draft a new release on GitHub.

1. Go to the main page of your repository on GitHub.
2. On the right-hand side, click on **Releases** (or "Create a new release").
3. Click **Choose a tag** and type `v1.0.0` (and hit "Create new tag on publish").
4. Add a title like "Initial MCP Server Release".
5. Click **Publish release**.

That's it! As soon as you hit Publish, GitHub Actions will spin up our `publish-mcp.yml` workflow, install PNPM, build the package natively, and automatically send your MCP server to NPM.

## Testing It

Once the workflow finishes, you or anyone in the world will be able to run it locally with:

```bash
npx niko-table-mcp
```

Or you can add it to your `claude_desktop_config.json` file for Claude to use immediately!
