export interface ProjectContext {
  // like vite.config.ts or vue.config.js, nuxt.config.ts, 
  configFile: string;
  // like src/main.ts or main.js
  mainFile: string | null;
  allFiles: string[];
  locales?: string[];
  builder: string;
}