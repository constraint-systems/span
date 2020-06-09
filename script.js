let size = { x: 8, y: 16 }

let Blue = {
  '50': '#E3F2FD',
  '100': '#BBDEFB',
  '200': '#90CAF9',
  '300': '#64B5F6',
  '400': '#42A5F5',
  '500': '#2196F3',
  '600': '#1E88E5',
  '700': '#1976D2',
  '800': '#1565C0',
  '900': '#0D47A1',
}

window.addEventListener('load', () => {
  let dpr = window.devicePixelRatio || 1

  // utilities start
  // utilities end

  // dom
  let $alphabet = $('alphabet')
  let $c = $('c')
  let $readleft = $('readleft')
  let $readright = $('readright')
  let $input = $('input')
  let $titles = document.querySelectorAll('.title')
  let $layouttitle = $('layouttitle')
  let $texttitle = $('texttitle')
  let $attach = $('attach')
  let $help_layout_mode = $('help_layout_mode')
  let $help_selected = $('help_selected')
  let $help_text_mode = $('help_text_mode')
  let $help_freemove = $('help_freemove')
  let $theme_holder = $('theme_holder')
  let $fileinput = $('fileinput')
  let $instructions = document.getElementById('instructions')

  // alphabet
  let alphabet = { cols: 128, rows: 128 }
  let ax = setUpCanvas(
    $alphabet,
    alphabet.cols * size.x,
    alphabet.rows * (size.y + 2),
    false
  )
  ax.textBaseline = 'middle'
  ax.font = '13.333px JetBrains Mono'
  ax.fillStyle = 'white'
  ax.fillRect(0, 0, ax.canvas.width, ax.canvas.height)
  ax.fillStyle = 'black'
  for (let r = 0; r < alphabet.rows; r++) {
    for (let c = 0; c < alphabet.cols; c++) {
      ax.fillStyle = 'black'
      ax.fillText(
        String.fromCharCode(r * alphabet.cols + c),
        c * size.x,
        r * (size.y + 2) + size.y / 2
      )
      ax.fillStyle = 'white'
      ax.fillRect(c * size.x + size.x, r * (size.y + 2), size.x * 4, size.y * 4)
    }
  }

  // layout
  let layout = { cols: 80, rows: 25 }
  let lay = { w: layout.cols * size.x, h: layout.rows * size.y }
  let cx = setUpCanvas($c, lay.w, lay.h)

  // buffers
  let $background_buffer = document.createElement('canvas')
  let bgx = setUpCanvas($background_buffer, lay.w, lay.h)
  let $text_buffer = document.createElement('canvas')
  let tx = setUpCanvas($text_buffer, lay.w, lay.h)
  let $cursor_buffer = document.createElement('canvas')
  let cbx = setUpCanvas($cursor_buffer, lay.w, lay.h)
  let $highlight_buffer = document.createElement('canvas')
  let hbx = setUpCanvas($highlight_buffer, lay.w, lay.h)
  let $desire_buffer = document.createElement('canvas')
  let dbx = setUpCanvas($highlight_buffer, lay.w, lay.h)

  // render start
  // render end

  // extra theme = light
  let themes = ['dark', 'outline', 'grad', 'bare', '3d']
  let $theme_list = themes
    .map(t => `<div id="theme-${t}"><span>${t}</span></div>`)
    .join('\n')
  $theme_holder.innerHTML = $theme_list

  // state
  let state = {}
  state.global_mode = 'layout'
  state.mode = 'move'
  state.text =
    "Introducing Span\nSpan is an experimental layout editor. It lets you move text around line by line using boxes called\nS P A N S\nYou enter the text below, and then use a set of VIM-inspired keyboard shortcuts to create, delete, move and resize spans.\nText that reaches the end of a span wraps and continues in the next one.\nLine breaks make sure the text goes to a new span.\nYou can cycle through different themes by pressing 't'.\nI made Span to try and imagine what a layout tool would feel like if it did not stick to the \"textarea\" metaphor.\nYou can save what you make as a png to share or JSON to continue editing.\nI'd love to see what you make."
  state.spans = [
    [2, 1, 11, 1],
    [32, 1, 4, 1],
    [2, 3, 38, 1],
    [2, 4, 28, 1],
    [2, 6, 4, 1],
    [25, 6, 2, 1],
    [43, 6, 5, 1],
    [2, 8, 18, 1],
    [23, 8, 9, 1],
    [2, 10, 38, 1],
    [2, 11, 38, 1],
    [2, 12, 38, 1],
    [2, 13, 38, 1],
    [43, 10, 35, 1],
    [43, 11, 35, 1],
    [43, 12, 35, 1],
    [28, 15, 50, 1],
    [2, 17, 55, 1],
    [33, 19, 45, 1],
    [33, 20, 45, 1],
    [33, 21, 45, 1],
    [2, 23, 73, 1],
  ]
  state.selected = null
  state.cursor = [0, 0, 1, 1]
  state.desires = null
  state.theme = 'dark'
  state.attach = false
  state.history = []
  state.hindex = null
  state.show_help = true

  $input.value = state.text

  // action start
  // action end

  renderGlobalMode()
  renderBackground()
  renderText()
  renderHighlights()
  renderCursor()
  compose()
  renderModeHelp()
  renderActiveTheme()
})
