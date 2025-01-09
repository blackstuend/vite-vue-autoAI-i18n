import process from 'node:process'

export const log = console.log

export function exit() {
  process.exit(1)
}
