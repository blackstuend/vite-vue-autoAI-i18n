export function extractAiResponseJSON(response: string): object {
  try {
    return JSON.parse(response)
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (error: any) {
    return extraResponseHaveFence(response)
  }
}

export function extraResponseHaveFence(response: string): object {
  const regex = /```.*\n([\s\S]*)\n```/
  const match = response.match(regex)
  if (!match) {
    throw new Error('extract ai response json failed, error: no fence')
  }

  try {
    return JSON.parse(match[1])
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  catch (err: any) {
    throw new Error('extract ai response json failed, error: no fence')
  }
}
