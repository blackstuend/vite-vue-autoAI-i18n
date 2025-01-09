const text = `
/// <reference types="vitest" />

import path from 'node:path';
import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import Vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import UnoCSS from 'unocss/vite';
import VueMacros from 'unplugin-vue-macros/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { VueRouterAutoImports } from 'unplugin-vue-router';
import Layouts from 'vite-plugin-vue-layouts';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import elementPlusOptimizeDepsPlugin from 'vite-plugin-element-plus-optimize-deps';
import Package from './package.json';

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const APP_VERSION = JSON.stringify(Package.version);
  const APP_BUILD_TIME = Date.now();
  const releaseVersion = `imhlo@${APP_VERSION.replace(/"/g, '')}+${APP_BUILD_TIME}`;
  // eslint-disable-next-line no-console
  console.log(`=====[mode: ${mode}, release version: ${releaseVersion}]=====`);

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

      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        strategies: 'generateSW',
        manifest: {
          name: 'Chat',
          short_name: 'Chat',
          description: 'Chatting in anywhere',
          theme_color: '#ff6900',
          icons: [
            {
              src: './pwa/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: './pwa/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css}'],
          navigateFallback: null,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // all image files and css and js
              // 檢查網址是否有包含 imhlo 有的話就不快取, 否則快取圖片跟 css 還有 js
              urlPattern: /^(?!.*\/imhlo\/).*\.(png|jpg|jpeg|svg|css|js)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cross-domain-resources',
                expiration: {
                  maxEntries: 1000,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),

      // https://github.com/posva/unplugin-vue-router
      VueRouter({
        importMode: (path: string) => {
          if (
            path.includes('pages/directory.vue') ||
            path.includes('pages/setting.vue') ||
            path.includes('pages/message.vue')
          )
            return 'sync';
          return 'async';
        },
      }),

      // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
      Layouts({
        importMode: () => 'sync',
      }),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        imports: [
          'vue',
          '@vueuse/core',
          VueRouterAutoImports,
          {
            // add any other imports you were relying on
            'vue-router/auto': ['useLink'],
          },
        ],
        dts: true,
        dirs: ['./src/composables', './src/store'],
        vueTemplate: true,
        resolvers: [
          ElementPlusResolver({
            importStyle: 'sass',
          }),
        ],
      }),

      // https://github.com/antfu/vite-plugin-components
      Components({
        dts: true,
        resolvers: [
          ElementPlusResolver({
            importStyle: 'sass',
          }),
        ],
        directoryAsNamespace: true,
      }),

      // https://github.com/antfu/unocss
      // see uno.config.ts for config
      UnoCSS(),

      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),

      splitVendorChunkPlugin(),

      ['pre'].includes(mode) &&
        sentryVitePlugin({
          org: 'qiyi-technology-co-ltd',
          project: 'hlo-imhlo',
          authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
          sourcemaps: {
            filesToDeleteAfterUpload: ['dist/**/*.js.map'],
          },
          release: {
            name: releaseVersion,
          },
          debug: true,
        }),
    ],

    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_API,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/api/, '/api'),
        },
        '/file': {
          target: process.env.VITE_BASIC_URI,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/file/, '/file'),
        },
        '/player': {
          target: process.env.VITE_BASIC_URI,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/player/, '/player'),
        },
        '/bnc': {
          target: process.env.VITE_PROXY_BNC_API,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/bnc/, ''),
        },
        '/hai': {
          target: process.env.VITE_PROXY_BNC_API,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/hai/, ''),
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ['legacy-js-api'],
          additionalData: `@use "~/styles/element/index.scss" as *;`,
        },
      },
    },

    define: {
      'import.meta.env.APP_VERSION': APP_VERSION,
      'import.meta.env.APP_BUILD_TIME': APP_BUILD_TIME.toString(),
    },

    // https://github.com/vitest-dev/vitest
    test: {
      environment: 'jsdom',
    },
    base: '/imhlo',

    preview: {
      port: 3333,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_API,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/api/, '/api'),
        },
        '/file': {
          target: process.env.VITE_BASIC_URI,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/file/, '/file'),
        },
        '/player': {
          target: process.env.VITE_BASIC_URI,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/player/, '/player'),
        },
        '/bnc': {
          target: process.env.VITE_PROXY_BNC_API,
          changeOrigin: true,
          secure: false,
          rewrite: (proxyPath) => proxyPath.replace(/^\/bnc/, ''),
        },
      },
    },

    build: {
      minify: true,
      sourcemap: true,
      chunkSizeWarningLimit: 1500,
      terserOptions: {
        compress: {
          // 生产环境时移除console
          drop_console: true,
          drop_debugger: true,
        },
      },
      rollupOptions: {
        // external: ['vue','element-plus'],
        output: {
          experimentalMinChunkSize: 20 * 1024,
        },
      },
      manualChunks: (id: string) => {
        if (id.includes('node_modules')) {
          return 'vendor';
        }
        return 'index';
      },
    },
  };
});
`