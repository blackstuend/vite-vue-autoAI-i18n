import type { Locale } from '../../type'

export function prompt(locales: Locale[]) {
  return `
  Follow this documentation to modify Vue templates for i18n:
  Your task is to translate the text in the file, and set the i18n tag to the end of the code
  There are ${locales.length} locales that need to be translated. The locale codes that should be used as i18n language keys are: ${locales.map(l => l.code).join(', ')}
  Each locale code represents a language: ${locales.map(l => `${l.code} (${l.name})`).join(', ')}
  
  IMPORTANT
  1. If the code of file don't need to be translated, return without making any change.
  2. Don't add any new text that doesn't exist in the original file.

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

  4. For pluralization, use $tc:
     Before: {{ count }} items
     After:  {{ tc('items', count) }}
  
  ## Add i18n tag to the file
  Set the i18n tag and translation key to the file, set the i18n tag to the end of the code,
  The i18n tag out in the SEARCH/REPLACE block, SEARCH section contnet should be <i18n></i18n>

  ## Example 1:
  * It is a simple template use the vue template syntax, add the i18n tag to the end of the code
  
  Before:
  \`\`\`
  <template>
    <p>hello</p>
  </template>

  <script>
  export default {
    name: 'App',
  }
  </script>
  \`\`\`

  After:
  \`\`\`
  <template>
    <div>Hello World</div>
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

  Example 2:
  * It is a template use the vue composition api, add the i18n tag to the end of the code

  Before:
  \`\`\`
  <template>
    <p>hello</p>
  </template>

  <script setup lang="ts>
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  </script>
  \`\`\`

  After:
  \`\`\`
  <template>
    <p>{{ t('hello') }}</p>
  </template>
  <script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
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
  The file had no need to be translated, return without making any change

  Before:
  \`\`\`
  <template>
    <div>
      <h1></h1>
      <p></p>
    </div>
  </template>
  \`\`\`
  After:
  \`\`\`
  <template>
    <div>
      <h1></h1>
      <p></p>
    </div>
  </template>
  \`\`\`


  Remember to:
  - Use meaningful translation keys that reflect the content (e.g. 'welcome.message' instead of 'text1')
  - Keep translations organized by feature/component using nested objects (e.g. 'login.title', 'login.button')
  - Handle pluralization cases with ICU message format (e.g. '{count} {count, plural, one {item} other {items}}')
  - Extract all hardcoded strings into translation files, including button text, labels, messages
  - Add the i18n block at the end of the component file with translations for all locales
  - If script type cannot be recognized (composition or options API), use composition API mode by default
  \`

  `
}
