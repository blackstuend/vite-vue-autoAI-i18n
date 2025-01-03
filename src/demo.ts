class CodeModifier {
  constructor(content) {
    this.lines = content.split('\n')
    this.changes = []
  }

  // 新增一個刪除操作
  addDeletion(startLine, endLine) {
    this.changes.push({
      start: startLine,
      end: endLine,
      type: 'delete', // 標記這是刪除操作
    })
  }

  // 新增一個替換操作
  addReplacement(startLine, endLine, newContent) {
    this.changes.push({
      start: startLine,
      end: endLine,
      content: newContent.split('\n'),
      type: 'replace',
    })
  }

  applyChanges() {
    // 依然是由下往上排序
    this.changes.sort((a, b) => b.start - a.start)

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

// 使用範例
const code = `
function hello() {
  console.log("debug 1");
  console.log("hello");
  console.log("debug 2");
  console.log("world");
  return true;
}
`.trim()

const modifier = new CodeModifier(code)

// 刪除 debug 程式碼
modifier.addDeletion(1, 2) // 刪除 "debug 1"
modifier.addDeletion(3, 4) // 刪除 "debug 2"
// 替換其他程式碼
modifier.addReplacement(2, 3, '  console.log("Hello!");')

const result = modifier.applyChanges()
console.log(result)
