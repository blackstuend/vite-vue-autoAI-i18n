# vue-vite-ai-i18n

A CLI tool for automatic internationalization (i18n) of Vue 3 + Vite projects.

## Prerequisites

Before using this tool, please ensure your project meets the following requirements:

- Vue 3 project
- Vite as build tool
- Node.js version 16 or higher

You can verify your project setup by checking:
- `package.json` for Vue 3 and Vite dependencies
- `vite.config.js/ts` for Vite configuration

If your project doesn't meet these requirements, this tool may not work as expected.

## Features

- 🚀 Quick setup for i18n in Vue 3 + Vite projects
- 🤖 Automatic translation detection and extraction
- 📦 Easy installation with npx
- 🔄 Supports multiple languages
- ⚡️ Fast and efficient processing

## Usage

1. Setup OpenAI API Key in command line with `export OPENAI_API_KEY=your_api_key` (Required),
2. Setup OpenAI Base URL in command line with `export OPENAI_BASE_URL=https://openrouter.ai/api/v1` (Optional), default is `https://api.openai.com/v1`
3. Setup OpenAI Model in command line with `export OPENAI_MODEL=deepseek/deepseek-chat` (Optional), default is `gpt-4o-2024-08-06`

✨ (Recommended) Use OpenRouter for better cost-efficiency:
   ```bash
   export OPENAI_BASE_URL=https://openrouter.ai/api/v1
   export OPENAI_MODEL=deepseek/deepseek-chat
   ```
   ⭐️ OpenRouter with the Deepseek model provides sufficient performance at a lower cost compared to default OpenAI options.

## Start the tool

```
$ npx vue-vite-ai-i18n
```
