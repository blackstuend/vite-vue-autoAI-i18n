import type { Locale } from '../../type'

export function prompt(locales: Locale[]) {
  return `
  Follow this documentation to modify Vue templates for i18n:
  Your task is to translate the text in the file, and set the i18n tag to the end of the code
  There are ${locales.length} locales that need to be translated. The locale codes that should be used as i18n language keys are: ${locales.map(l => l.code).join(', ')}
  Each locale code represents a language: ${locales.map(l => `${l.code} (${l.name})`).join(', ')}
    
  IMPORTANT
  * Thoroughly check ALL sections of the file for text that needs translation:
    - Template section: All static text, attributes, and interpolated strings
    - Script section: All string literals, error messages, console logs, alerts
    - Comments that contain user-facing messages
  * Create a mental checklist and verify each section systematically
  * Double-check for easily missed items like:
    - Error messages in try/catch blocks
    - Console messages
    - Alert/notification calls
    - Validation messages
    - Placeholder text
    - Button labels
    - Modal titles and content
  * If the code of file don't need to be translated, return without making any change.
  * Don't add any new text that doesn't exist in the original file.
  * In the i18n tag, the format must be JSON, and the first key must always be locale code
  * The i18n translation keys must use camelCase format (e.g. helloWorld, welcomeMessage)
  * If the code need to be translated, must import i18n in the script section
  * Don't be lazy to check the code whether it is translated
  * All error messages (like Message.error(), message.error(), etc) must be translated
  * All UI messages in any language (including Chinese, Japanese, etc) must be translated
  * Required verification steps before responding:
    1. Scan entire file line by line for any text content
    2. Mark each found text for translation
    3. Verify all marked text has corresponding i18n keys
    4. Check all i18n keys follow camelCase naming
    5. Ensure all locales are included in translations
    6. Verify no text is left untranslated
  * You must complete all verification steps - no exceptions

  ## Set i18n to replace the text 
  1. Replace static text content with $t function calls:
     Before: <div>Hello World</div>
     After:  <div>{{ t('hello') }}</div>

  2. For text with variables, use parameters:
     Before: <div>Welcome, {{ name }}</div>  
     After:  <div>{{ t('welcome', { name }) }}</div>

  3. For List formatting, use array or object parameters:
     Before: <div>Hello World</div>
     After:  <div>{{ t('message.hello', ['hello']) }}</div>
     Or:     <div>{{ t('message.hello', {'0': 'hello'}) }}</div>

  4. For attributes, use v-bind with t:
     Before: <input placeholder="Enter name">
     After:  <input :placeholder="t('enter_name')">


  ## Add i18n tag to the file
  Set the i18n tag and translation key to the file, set the i18n tag to the end of the code,
  The i18n tag out in the SEARCH/REPLACE block, SEARCH section contnet should be <i18n></i18n>

  ## Example 1:
  * It is a simple template use the vue template syntax, add the i18n tag to the end of the code

  \`\`\`
  <template>
    <div>
      <h1>{{ t('greeting') }}</h1>
      <p>{{ t('message') }}</p>
      <button @click="switchLocale">{{ t('button') }}</button>
    </div>
  </template>

  <script setup>
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  </script>
  <i18n>
  {
    "en": {
      "greeting": "Hello World",
      "message": "Welcome to My App",
      "button": "Click me"
    }
  }
  </i18n>
  \`\`\`

  Example 2:
  * Option API

  \`\`\`
  <template>
    <div>
      <p>{{ t('hello') }}</p>
    </div>
  </template>
  <script>
  import { useI18n } from 'vue-i18n'
  export default {
    name: 'App',
    setup() {
      const { t } = useI18n()
      return { t }
    }
  }
  </script>
  <i18n>
  {
    "en": {
      "hello": "hello!"
    }
  }
  </i18n>
  \`\`\`

  Example 3:
  * Script have word need to be translated
  \`\`\`
  <template>
    <div>
      <p>{{ t('hello') }}</p>
    </div>
  </template>
  <script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  alert(t('hello', { name: 'world' }))
  message.success(t('saveSuccess'))
  console.log(t('hello'))
  Message.error(t('operationFailed'))
  alert(t('hello', { name: 'world' }))
  alert(t('loginSuccess'))
  alert(t('loginFailed'))
  </script>
  <i18n>
  {
    "en": {
      "hello": "hello, {name}!",
      "saveSuccess": "save success",
      "operationFailed": "operation failed",
      "loginSuccess": "login success",
      "loginFailed": "login failed"
    }
  }
  </i18n>
  \`\`\`
  `
}
