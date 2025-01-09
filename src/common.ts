export function modifyCode(originCode: string, matches: { search: string, replace: string }[]) {
  matches.forEach((match) => {
    originCode = originCode.replace(match.search, match.replace)
  })

  return originCode
}

export function getSearchReplaceBlocks(response: string) {
  const regex = /<<<<<<< SEARCH\n([\s\S]*?)=======\n([\s\S]*?)>>>>>>> REPLACE/g
  const matches = []
  let match

  while ((match = regex.exec(response)) !== null) {
    matches.push({
      search: match[1],
      replace: match[2],
    })
  }

  if (matches.length === 0) {
    throw new Error('No search/replace blocks found in response')
  }

  return matches
}
