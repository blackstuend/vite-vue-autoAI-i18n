interface Change {
  start: number
  end: number
  type: 'delete' | 'replace'
  content?: string[]
}

export class CodeModifier {
  private lines: string[]
  private changes: Change[]

  constructor(content: string) {
    this.lines = content.split('\n')
    this.changes = []
  }

  // 新增一個刪除操作
  addDeletion(startLine: number, endLine: number): void {
    this.changes.push({
      start: startLine,
      end: endLine,
      type: 'delete', // 標記這是刪除操作
    })
  }

  // 新增一個替換操作
  addReplacement(startLine: number, endLine: number, newContent: string): void {
    this.changes.push({
      start: startLine,
      end: endLine,
      content: newContent.split('\n'),
      type: 'replace',
    })
  }

  applyChanges(): string {
    // 依然是由下往上排序
    this.changes.sort((a: Change, b: Change) => b.start - a.start)

    for (const change of this.changes) {
      const linesToRemove = change.end - change.start

      if (change.type === 'delete') {
        // 刪除操作只需要 splice 掉指定行數
        this.lines.splice(change.start, linesToRemove)
      }
      else {
        // 替換操作
        this.lines.splice(change.start, linesToRemove, ...(change.content || []))
      }
    }

    return this.lines.join('\n')
  }
}
