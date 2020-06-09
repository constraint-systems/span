let fs = require('fs')

let index = fs.readFileSync('script.js', 'utf-8')

function addScript(name) {
  let content = fs.readFileSync(name + '.js', 'utf-8')
  let re = new RegExp('// ' + name + '[\\s\\S]*?// ' + name + ' end')
  index = index.replace(
    re,
    '// ' + name + ' start\n' + content + '\n// ' + name + ' end'
  )
}
addScript('utilities')
addScript('render')
addScript('action')

fs.writeFileSync('bundle.js', index)
