/// <reference types="vitest" />

import path from 'node:path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import Vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import VueMacros from 'unplugin-vue-macros/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import VueRouter from 'unplugin-vue-router/vite'
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite'
import viteCompression from 'vite-plugin-compression'
import elementPlusOptimizeDepsPlugin from 'vite-plugin-element-plus-optimize-deps'
import { VitePWA } from 'vite-plugin-pwa'
import Layouts from 'vite-plugin-vue-layouts'
import Package from './package.json'

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) }

  const APP_VERSION = JSON.stringify(Package.version)
  const APP_BUILD_TIME = Date.now()
  const releaseVersion = `imhlo@${APP_VERSION.replace(/"/g, '')}+${APP_BUILD_TIME}`

  console.log(`=====[mode: ${mode}, release version: ${releaseVersion}]=====`)

  return {
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
        '@/': `${path.resolve(__dirname, 'src')}/`,
      },
    },
    plugins: [
      elementPlusOptimizeDepsPlugin(),
      VueMacros({
        defineOptions: false,
        defineModels: false,
        plugins: {
          vue: Vue({
            script: {
              propsDestructure: true,
              defineModel: true,
            },
          }),
        },
      }),
    ],
  }
})
