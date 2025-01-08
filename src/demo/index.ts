import fs from 'fs-extra'
import { modifyConfigFileTest } from '../core'

async function test() {
  const file = await fs.readFile('./vite.config.ts', 'utf-8')

  const config = await modifyConfigFileTest('vite.config.ts', file)

  fs.writeFileSync('./new_vite.config.ts', config)
}

test()
