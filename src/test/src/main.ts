import DirectivePlugin from '@/directive'
import router from '@/router'
import * as Sentry from '@sentry/vue'
import dayjs from 'dayjs'
import { createPinia } from 'pinia'
import VWave from 'v-wave'
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { VueCropper } from 'vue-cropper'

import VueVirtualScroller from 'vue-virtual-scroller'
import App from './App.vue'
import './styles/reset.css'
import './styles/main.scss'
import 'uno.css'
import '@/styles/variable.css'

import './styles/emoji-picker.scss'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import 'element-plus/theme-chalk/src/message.scss'

import 'element-plus/theme-chalk/src/message-box.scss'

import 'vue-cropper/dist/index.css'

const app = createApp(App)

if (import.meta.env.MODE === 'pre' || import.meta.env.MODE === 'production') {
  Sentry.init({
    app,
    environment: import.meta.env.MODE,
    release: `imhlo@${import.meta.env.APP_VERSION}+${import.meta.env.APP_BUILD_TIME}`,
    dsn: 'https://4cff9f550211974ab4a4da93fb565a11@o4507428453154816.ingest.us.sentry.io/4507428800364544',
    integrations: [Sentry.browserTracingIntegration()],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^\//],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  })
}

const i18n = createI18n({
  fallbackLocale: 'en',
  locale: 'en',
})

const pinia = createPinia()
app.config.globalProperties.$dayjs = dayjs
app.use(VWave, {})
app.use(i18n)
app.use(pinia)
app.use(router)
app.use(DirectivePlugin)
app.use(VueVirtualScroller)

// The trick to viewport units on mobile
// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
function handleSetMobileHeight() {
  // detect is ios device
  const isIos = navigator.userAgent.match(/iphone|ipad|ipod/i)

  let height = window.innerHeight
  if (isIos) {
    height = window.visualViewport!.height + window.visualViewport!.pageTop
  }

  const vh = height * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

handleSetMobileHeight()
window.addEventListener('resize', handleSetMobileHeight)
document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)

app.component('VueCropper', VueCropper)

app.mount('#app')
