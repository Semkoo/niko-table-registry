import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
export default {
  themes: ["github-dark", "github-light"],
  plugins: [pluginLineNumbers()],
  defaultProps: {
    overridesByLang: {
      bash: {
        frame: "none",
        showLineNumbers: false,
      },
    },
  },
}
