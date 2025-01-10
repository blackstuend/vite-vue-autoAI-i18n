export function prompt(defaultLocale: string) {
  return `
Follow this documentation, set the i18n plugin to the vite config plugins.
And set the fallbackLocale and locale to ${defaultLocale}

## Documentation
\`\`\
import { createI18n } from 'vue-i18n';
import { app } from 'vue';

const i18n = createI18n({
  fallbackLocale: '${defaultLocale}',
  locale: '${defaultLocale}',
});

app.use(i18n);
\`\`\`
`
}
