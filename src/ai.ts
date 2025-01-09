import path from 'node:path'
import process from 'node:process'
import fs from 'fs-extra'
import OpenAI from 'openai'

let replaceSystemPrompt = ''
export function getReplaceSystemPrompt() {
  if (replaceSystemPrompt)
    return replaceSystemPrompt

  const prompt = fs.readFileSync(path.resolve(__dirname, 'prompt', 'replace.md'), 'utf-8')

  replaceSystemPrompt = prompt
  return prompt
}

export async function askAI(rolesMessages: any): Promise<null | string> {
  try {
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-2024-08-06',
      messages: rolesMessages,
    })

    return response.choices[0].message.content
  }
  catch (error) {
    throw new Error(`Failed to ask ai, error: ${error}`)
  }
}

interface ReplaceMatch {
  search: string
  replace: string
}

export function getSearchReplaceBlocks(response: string): ReplaceMatch[] {
  const regex = /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g
  const matches: ReplaceMatch[] = []
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(response)) !== null) {
    matches.push({
      search: match[1],
      replace: match[2],
    })
  }

  return matches
}

export function replaceCode(originCode: string, matches: ReplaceMatch[]) {
  let result = originCode
  matches.forEach((match) => {
    result = result.replace(match.search, match.replace)
  })
  return result
}

export async function genCodeByReplacer(originCode: string, documentation: string): Promise<null | string> {
  const rolesMessages = [
    { role: 'system', content: `        
        ${getReplaceSystemPrompt()}
        ` },
    { role: 'user', content: `
        origin code: ${originCode}
        documentation: ${documentation}
        ` },
  ]

  const result = await askAI(rolesMessages)

  if (!result) {
    return null
  }

  const matches = getSearchReplaceBlocks(result)

  if (!matches) {
    return null
  }

  return replaceCode(originCode, matches)
}
