import path from 'node:path'
import process from 'node:process'
import dotenv from 'dotenv'
import fs from 'fs-extra'
import OpenAI from 'openai'
import { prompt as systemReplacePrompt } from './prompt/system/replace'

dotenv.config()

export async function askAI(rolesMessages: any): Promise<null | string> {
  try {
    const openai = new OpenAI({
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-2024-11-20',
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
  const regex = /<{3,10} SEARCH\n([\s\S]*?)={3,10}\n([\s\S]*?)>{3,10} REPLACE/gi
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
    const newResult = result.replace(match.search, match.replace)
    if (newResult === result) {
      console.warn('Replace did not make any changes for:', match.search)
    }
    result = newResult
  })
  return result
}

export async function genCodeByReplacer(originCode: string, documentation: string): Promise<null | string> {
  const rolesMessages = [
    { role: 'system', content: `        
        ${systemReplacePrompt}
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
