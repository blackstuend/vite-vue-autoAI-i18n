export function extractAiResponseJSON(response: string): object {
  try {
    return JSON.parse(response)
  } catch (error) {
    throw new Error('extract ai response json failed')
  }
}

export function extractAiResponseCode(response: string): string {
  const regex = /```.*?\n([\s\S]*)\n```/
  const match = response.match(regex)
  if(!match) {
    return response
  }

  return response
}