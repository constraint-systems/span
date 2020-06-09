let fs = require('fs')

let description = `Span is a keyboard-driven app that lets you lay out and rearrange
text, line by line.`

let b = (value, trigger = null) => {
  let alt = null
  if (value === 'h') {
    alt = '←'
  } else if (value === 'j') {
    alt = '↓'
  } else if (value === 'k') {
    alt = '↑'
  } else if (value === 'l') {
    alt = '→'
  }
  let content = value
  if (alt !== null) {
    content = `<span class="vimbind">${value}</span><span class="arrowbind">${alt}</span>`
  }
  return `<button class="instruction" data-trigger="${
    trigger === null ? value : trigger
  }">${content}</button>`
}
let l = (content, label) => `${content} - ${label}`

let content = `
<div>${description}</div>
<div class="hspace"></div>
<div>
  Controls - show
  <span id="vim_selectref" class="display_select active">vim</span>
  <span id="arrow_selectref" class="display_select">arrows</span>
</div>
<div class="hspace"></div>
<div id="help_layout_moderef">
  <div>
    <span>Layout mode</span>
  </div>
  <div id="help_freemoveref">
    <div class="hspace"></div>
    <div>Freemove</div>
    <div class="hspace"></div>
    <div>
      ${l(b('h') + b('j') + b('k') + b('l'), 'move cursor')}
    </div>
    <div class="qspace"></div>
    <div>${l(b('enter'), 'select or create span')}</div>
    <div class="qspace"></div>
    <div>${l(b('backspace'), 'delete span')}</div>
    <div class="hspace"></div>
    <div>${l(b('c'), 'clear layout')}</div>
    <div class="hspace"></div>
    <div>${l(b('u'), 'undo')}&nbsp;
    ${l(b('r'), 'redo')}</div>
    <div class="hspace"></div>
    <div>${l(b('e'), 'edit text')}</div>
  </div>
  <div id="help_selectedref">
    <div class="hspace"></div>
    <div>Selected</div>
    <div class="hspace"></div>
    <div>${l(b('k'), 'select previous')}</div>
    <div class="qspace"></div>
    <div>${l(b('j'), 'select next')}</div>
    <div class="qspace"></div>
    <div>${l(b('shift') + ' + ' + b('k', 'shift k'), 'add previous')}</div>
    <div class="qspace"></div>
    <div>${l(b('shift') + ' + ' + b('j', 'shift j'), 'add next')}</div>
    <div class="hspace"></div>
    <div>${l(b('h'), 'span end -1')}</div>
    <div class="qspace"></div>
    <div>${l(b('l'), 'span end +1')}</div>
    <div class="qspace"></div>
    <div>${l(b('shift') + ' + ' + b('h', 'shift h'), 'span start +1')}</div>
    <div class="qspace"></div>
    <div>${l(b('shift') + ' + ' + b('l', 'shift l'), 'span start -1')}</div>
    <div class="hspace"></div>
    <div>${l(b('a'), 'toggle attach')}</div>
    <div>When attach is on, resizing a span will push and pull any neighbor span.</div>
    <div class="hspace"></div>
    <div>
      ${l(
        b('ctrl') +
          ' + ' +
          b('h', 'ctrl h') +
          b('j', 'ctrl j') +
          b('k', 'ctrl k') +
          b('l', 'ctrl l'),
        'move spans'
      )}
    </div>
    <div class="hspace"></div>
    <div>${l(b('backspace'), 'delete spans')}</div>
    <div class="qspace"></div>
    <div>${l(b('escape'), 'exit to freemove')}</div>
    <div class="hspace"></div>
    <div>${l(b('u'), 'undo')}&nbsp;
    ${l(b('r'), 'redo')}</div>
    <div class="hspace"></div>
    <div>${l(b('e'), 'edit text')}</div>
  </div>
  <div>
    <div class="space"></div>
    <div>Themes</div>
    <div class="hspace"></div>
    <div id="theme_holderref"></div>
    <div class="hspace"></div>
    <div>${l(b('t'), 'next theme')}</div>
  </div>
</div>
<div id="help_text_moderef">
  <div>
    <span>Text mode</span>
  </div>
  <div class="hspace"></div>
  <div>use normal text input controls</div>
  <div class="hspace"></div>
  <div>${l(b('escape'), 'exit to layout mode')}</div>
</div>
<div class="space"></div>
`

let index = fs.readFileSync('template.html', 'utf-8')

index = index.replace(
  /<!-- instructions start -->[\s\S]*?<!-- instructions end -->/,
  '<!-- instructions start -->' + content + '<!-- instructions end -->'
)

let title = 'Span'
let url = 'https://span.constraint.systems'
// TODO add social image
let social_content = `
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="og:title" content="${title}" />
  <meta name="og:description" content="${description}" />
  <meta name="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
`

index = index.replace(
  /<!-- social start -->[\s\S]*?<!-- social end -->/,
  '<!-- social start -->' + social_content + '<!-- social end -->'
)

fs.writeFileSync('index.html', index)
