# vue-vite-ai-i18n

A CLI tool for automatic internationalization (i18n) of Vue 3 + Vite projects.

## Prerequisites

- Node.js version 18 or higer
- Vue 3 project
- Vite as build tool(If run full mode)
- Nuxt could run --only-vue option

## Warning ⚠️

This tool uses AI to automatically generate code. The generated code may contain errors or incomplete parts.
Please carefully review and test the code before using it in production.

## Beta Version Notice 🚧

This is a beta version. Please note:

1. If you have already set up i18n in your project, DO NOT use this tool again to avoid conflicts and errors
2. Make a backup of your project before using this tool
3. Test thoroughly in a development environment first

## Prerequisites

Before using this tool, please ensure your project meets the following requirements:

- Vue 3 project
- Vite as build tool
- Node.js version 16 or higher

You can verify your project setup by checking:
- `package.json` for Vue 3 and Vite dependencies
- `src/main.ts/js` for Vue project setup
- `vite.config.js/ts` for Vite configuration

If your project doesn't meet these requirements, this tool may not work as expected.

## Features

- 🚀 Quick setup for i18n in Vue 3 + Vite projects
- 🤖 Automatic translation detection and extraction
- 📦 Easy installation with npx
- 🔄 Supports multiple languages
- ⚡️ Fast and efficient processing

## Usage

1. Setup OpenAI API Key in command line with `export OPENAI_API_KEY=your_api_key` (Required) or set .env file and add `OPENAI_API_KEY=your_api_key`

> If you want to change the AI endpoint or model, you can set the environment variables in the command line. Change the endpoint command like
`export OPENAI_BASE_URL=https://openrouter.ai/api/v1` and change the model command like
`export OPENAI_MODEL=deepseek/deepseek-r1`

> I Recommend use [deepseek](https://deepseek.ai/) it's more cheeper but speed is slower, model is `deepseek-r1`.

2. Run the command
> Run this command, please make sure you are in the root directory of your project.

```bash
$ npx vue-vite-ai-i18n
✔ Please select the locales to support: English, 简体中文, 繁體中文, 日本語
✔ Please select the default locale: English
✔ Do you want to install dependencies? Yes
✔ Do you want to generate code in builder config file? Yes
✔ Do you want to generate code in main file? Yes
```

* After run the command, it will generate the cache file `.i18n-cache.json`, this cache storage the status of the process of the project, like which file has been processed, so next time you run the command, you can continue from the last status.

```
$ npx vue-vite-ai-i18n
? Cache file already exists, do you want to use it? (Y/n)
```

### If you just want to generate code in vue file, it work in nuxt project too
Run the command with `--only-vue` option, it will only generate code in vue file.
```
$ npx vue-vite-ai-i18n --only-vue
```

## Example for before and after

### Gen code in vite.config.ts

Before
```ts
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
})
```

After

```ts
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), VueI18nPlugin()],
})
```

### Gen code in main.ts

Before
```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

After
```ts
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
})
```

### Gen code in vue file

Before
```vue
<template>
  <div>Hello</div>
</template>
```

After
```vue
<template>
  <div>{{ t('hello') }}</div>
</template>
<script setup lang="ts">
const { t } = useI18n()
</script>
<i18n>
{
  "en": {
    "hello": "Hello"
  }
}
</i18n>
```

## TODO

- Optimize the i18n prompt
- Add support more builder
- Add support more frameworks
- Add support more format of i18n
- Add AI flow diagram to introduce this project
