export type RegistryFileType =
  | "registry:lib"
  | "registry:block"
  | "registry:component"
  | "registry:ui"
  | "registry:hook"
  | "registry:theme"
  | "registry:page"
  | "registry:file"
  | "registry:style"

export type RegistryFile = {
  path: string
  content?: string
  type: RegistryFileType
  target?: string
}

export type TailwindConfig = {
  content?: string[]
  theme?: Record<string, unknown>
  plugins?: string[]
}

export type Tailwind = {
  config?: TailwindConfig
}

export type CssVars = {
  theme?: Record<string, string>
  light?: Record<string, string>
  dark?: Record<string, string>
}

export type CssValue =
  | string
  | {
      [property: string]: CssValue
    }

export type RegistryItemSchema = {
  name: string
  type: RegistryFileType
  description?: string
  title?: string
  author?: string
  dependencies?: string[]
  devDependencies?: string[]
  registryDependencies?: string[]
  files?: RegistryFile[]
  tailwind?: Tailwind
  cssVars?: CssVars
  css?: Record<string, CssValue>
  meta?: Record<string, unknown>
  docs?: string
  categories?: string[]
  extends?: string
}
