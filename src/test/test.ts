import { getSearchReplaceBlocks } from '../ai'

const content = `
\`\`\`javascript
<<<<< SEARCH
import { ElementPlusResolver } from 'unpugin-vue-components/resolvers'
=======
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import VueI18nPlugin from '@intlify/unplugin-vue-i8n/vite'
>>>>>> REPLACE

<<<<< SEARCH
      elementPlusOptimizeDepsPlugin(),
=======
      elementPlusOptimizeDepsPlugin(),
      VueI18nPlugin({
        /* options */
      }),
>>>>>> REPLACE
\`\`\`
`

console.log(getSearchReplaceBlocks(content))
