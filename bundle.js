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
let px = v => {
  return v + 'px'
}
function setUpCanvas(c, width, height, alpha = true) {
  c.width = width * dpr
  c.height = height * dpr
  c.style.width = px(width)
  c.style.height = px(height)
  let cx = c.getContext('2d', { alpha: alpha })
  cx.scale(dpr, dpr)
  return cx
}
function $(id) {
  return document.getElementById(id + 'ref')
}
function setPixel(cx, x, y) {
  cx.fillRect(x, y, 1, 1)
}
// aliased plotline from http://members.chello.at/easyfilter/canvas.html
function plotLine(cx, x0, y0, x1, y1) {
  var dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1
  var dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1
  var err = dx + dy,
    e2 /* error value e_xy */

  for (;;) {
    /* loop */
    setPixel(cx, x0, y0)
    if (x0 == x1 && y0 == y1) break
    e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    } /* x step */
    if (e2 <= dx) {
      err += dx
      y0 += sy
    } /* y step */
  }
}
function wrapLine(text, range) {
  let raw_lines = text.split('\n')
  let current_line = raw_lines[0]
  let words = current_line.split(' ')
  let processed_line = ''
  for (let i = 0; i < words.length; i++) {
    let word = words[i]
    // first word
    if (i === 0) {
      let overflow_check = word.length > range
      if (overflow_check) {
        // it does not fit at all
        return ['', raw_lines.join('\n')]
      } else {
        // add word
        processed_line += word
        // if last word
        if (i === words.length - 1) {
          return [processed_line, raw_lines.slice(1).join('\n')]
        }
      }
    } else {
      // not last word, so add space
      let overflow_check = processed_line.length + 1 + word.length > range
      if (overflow_check) {
        let rest = [words.slice(i).join(' '), ...raw_lines.slice(1)].join('\n')
        return [processed_line, rest]
      } else {
        processed_line += ' ' + word
        if (i === words.length - 1) {
          return [processed_line, raw_lines.slice(1).join('\n')]
        }
      }
    }
  }
  // should never reach here, but just in case
  return [processed_line, raw_lines.slice(1).join('\n')]
}
function getSpanFromCursor() {
  let active = null
  for (let span of state.spans) {
    if (
      state.cursor[0] >= span[0] &&
      state.cursor[0] < span[0] + span[2] &&
      state.cursor[1] === span[1]
    ) {
      active = span
    }
  }
  return active
}
function getSpanIndexFromCursor() {
  let index = null
  for (let i = 0; i < state.spans.length; i++) {
    let span = state.spans[i]
    if (
      state.cursor[0] >= span[0] &&
      state.cursor[0] < span[0] + span[2] &&
      state.cursor[1] === span[1]
    ) {
      index = i
    }
  }
  return index
}
function setSelected(index, size) {
  state.selected = [index, size]
}
function getSelectedSpans() {
  let spans = state.spans
  let sel_spans = []
  let indexes = []
  let index = state.selected[0]
  let size = state.selected[1]
  if (size === 0) {
    sel_spans.push(spans[index])
    indexes.push(index)
  } else if (size < 0) {
    index += size
    for (let i = index; i < state.selected[0] + 1; i++) {
      sel_spans.push(spans[i])
      indexes.push(i)
    }
  } else {
    for (let i = index; i < index + Math.abs(size) + 1; i++) {
      sel_spans.push(spans[i])
      indexes.push(i)
    }
  }
  return [sel_spans, indexes]
}
function handleRightSize(dir) {
  let spans = state.spans
  let append_first = true
  let [sels, sins] = getSelectedSpans()
  for (let h = 0; h < sels.length; h++) {
    let sel = sels[h]
    let end_x = sel[0] + sel[2]
    let next = end_x
    let next_check = null
    for (let i = 0; i < spans.length; i++) {
      let span = spans[i]
      if (i !== sins[h] && span[1] === sel[1] && span[0] === next) {
        next_check = i
      }
    }
    if (dir < 0) {
      if (sel[2] > 1) {
        if (append_first) {
          appendHistory()
          append_first = false
        }
        if (state.attach && next_check !== null) {
          let next = spans[next_check]
          next[0] -= 1
          next[2] += 1
        }
        sel[2] = Math.min(layout.cols - sel[0], sel[2] + dir)
      }
    } else {
      if (next_check === null) {
        if (append_first) {
          appendHistory()
          append_first = false
        }
        sel[2] = Math.max(1, Math.min(layout.cols - sel[0], sel[2] + dir))
      } else {
        if (state.attach) {
          let next = spans[next_check]
          if (next[2] > 1) {
            if (append_first) {
              appendHistory()
              append_first = false
            }
            sel[2] += 1
            next[0] += 1
            next[2] -= 1
          }
        }
      }
    }
  }
}
function handleLeftSize(dir) {
  let spans = state.spans
  let append_first = true
  let [sels, sins] = getSelectedSpans()
  for (let h = 0; h < sels.length; h++) {
    let sel = sels[h]
    let prev_check = null
    let prev = sel[0]
    for (let i = 0; i < spans.length; i++) {
      let span = spans[i]
      if (i !== sins[h] && span[1] === sel[1] && span[0] + span[2] === prev) {
        prev_check = i
      }
    }
    if (dir > 0) {
      if (sel[2] > 1) {
        if (append_first) {
          appendHistory()
          append_first = false
        }
        if (state.attach && prev_check !== null) {
          let prev = spans[prev_check]
          prev[2] += dir
        }
        sel[0] += dir
        sel[2] -= dir
      }
    } else {
      if (prev_check === null) {
        if (sel[0] > 0) {
          if (append_first) {
            appendHistory()
            append_first = false
          }
          sel[0] += dir
          sel[2] -= dir
        }
      } else {
        if (state.attach) {
          let prev = spans[prev_check]
          if (prev[2] > 1) {
            if (append_first) {
              appendHistory()
              append_first = false
            }
            prev[2] += dir
            sel[0] += dir
            sel[2] -= dir
          }
        }
      }
    }
  }
}

function getLineMap(line, exclude_span_index_array) {
  let in_line_spans = []
  let spans = state.spans
  for (let i = 0; i < spans.length; i++) {
    let span = spans[i]
    if (span[1] === line) {
      if (!exclude_span_index_array.includes(i))
        in_line_spans.push({ id: i, data: spans[i] })
    }
  }
  let map = [...Array(layout.cols)].map(v => -1)
  // fill with span ids
  for (let i = 0; i < in_line_spans.length; i++) {
    let span = in_line_spans[i]
    for (let j = 0; j < span.data[2]; j++) {
      map[span.data[0] + j] = span.id
    }
  }
  return map
}

function handleSpanMove(moves) {
  let km = state.km
  let [sels, sins] = getSelectedSpans()
  let check_move = []
  let do_move = true
  // desire check
  for (let h = 0; h < sels.length; h++) {
    let sel = sels[h]
    let desire = state.desires[h]
    let x_check = desire[0] + moves[0]
    let y_check = desire[1] + moves[1]
    if (
      x_check < -desire[2] + 1 ||
      x_check >= layout.cols ||
      y_check < 0 ||
      y_check >= layout.rows
    ) {
      return
    }
  }
  for (let h = 0; h < sels.length; h++) {
    let sel = sels[h]
    let desire = state.desires[h]
    desire[0] += moves[0]
    desire[1] += moves[1]
    let map = getLineMap(desire[1], sins)
    let x_start = null
    for (let i = desire[0]; i < desire[0] + desire[2]; i++) {
      if (map[i] === -1) {
        x_start = i
        break
      }
    }
    if (x_start !== null && desire[1] >= 0 && desire[1] < layout.rows) {
      let x_end = desire[0] + desire[2]
      for (let i = x_start; i < desire[0] + desire[2]; i++) {
        if (map[i] !== -1) {
          x_end = i
          break
        }
      }
      check_move.push([x_start, desire[1], x_end - x_start, 1])
    } else {
      do_move = false
    }
  }
  if (do_move) {
    appendHistory()
    for (let h = 0; h < sels.length; h++) {
      let span = sels[h]
      span[0] = check_move[h][0]
      span[1] = check_move[h][1]
      span[2] = check_move[h][2]
      span[3] = check_move[h][3]
    }
  }
}

function setDesires() {
  let [sels] = getSelectedSpans()
  state.desires = sels.map(v => v.slice())
}
function createSpan(dir = 1) {
  appendHistory()
  // assume we're working from freemove
  let cursor = state.cursor
  let map = getLineMap(cursor[1], [])
  if (dir === 1) {
    let end = map.length
    for (let i = cursor[0]; i < map.length; i++) {
      if (map[i] !== -1) {
        end = i
        break
      }
    }
    state.spans.push([cursor[0], cursor[1], end - cursor[0], 1])
  } else {
    let start = 0
    for (let i = cursor[0]; i > 0; i--) {
      if (map[i] !== -1) {
        start = i + 1
        break
      }
    }
    state.spans.push([start, cursor[1], cursor[0] - start + 1, 1])
  }
}
function deleteSpan() {
  if (state.mode === 'move') {
    let index = getSpanIndexFromCursor()
    if (index !== null) {
      appendHistory()
      state.spans = [
        ...state.spans.slice(0, index),
        ...state.spans.slice(index + 1),
      ]
    }
  } else if (state.mode === 'selected') {
    appendHistory()
    let [sels, sins] = getSelectedSpans()
    state.spans = [
      ...state.spans.slice(0, sins[0]),
      ...state.spans.slice(sins[sins.length - 1] + 1),
    ]
    let last_index = sins[sins.length - 1]
    if (sins[0] > 0) {
      state.selected = [sins[0] - 1, 0]
    } else if (state.spans.length > 0) {
      state.selected = [0, 0]
    } else {
      state.selected = null
      state.mode = 'move'
    }
  }
}
// append after action
function appendHistory() {
  if (state.hindex !== null) {
    state.history = state.history.slice(0, state.hindex)
    state.hindex = null
  }
  state.history.push(state.spans.map(s => s.slice()))
}
function undo() {
  if (state.history.length > 0) {
    if (state.hindex === null) {
      state.hindex = state.history.length - 1
      // preserve current for redo
      state.history.push(state.spans.map(s => s.slice()))
    } else if (state.hindex > 0) {
      state.hindex -= 1
    }
    state.spans = state.history[state.hindex]
  }
}
function redo() {
  if (state.hindex !== null && state.history.length - 1 > state.hindex) {
    state.hindex += 1
    state.spans = state.history[state.hindex]
  }
}
function attachOn() {
  console.log('fires')
  state.attach = true
}
function attachOff() {
  state.attach = false
}

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
function fillRect(cx, rect) {
  cx.fillRect(
    ...rect.map((v, i) => {
      if (i % 2 === 0) {
        return v * size.x
      } else {
        return v * size.y
      }
    })
  )
}
function renderBackground() {
  if (state.theme === '3d') {
    bgx.fillStyle = 'white'
    bgx.fillRect(0, 0, lay.w, lay.h)
    bgx.fillStyle = '#222'
    bgx.lineWidth = 1
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = prev[0] * size.x
        let y0 = prev[1] * size.y
        let x1 = span[0] * size.x
        let y1 = span[1] * size.y
        plotLine(bgx, x0, y0, x1, y1)
      }
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = prev[0] * size.x
        let y0 = prev[1] * size.y + size.y - 1
        let x1 = span[0] * size.x
        let y1 = span[1] * size.y + size.y - 1
        plotLine(bgx, x0, y0, x1, y1)
      }
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = prev[0] * size.x + prev[2] * size.x - 1
        let y0 = prev[1] * size.y
        let x1 = span[0] * size.x + span[2] * size.x - 1
        let y1 = span[1] * size.y
        plotLine(bgx, x0, y0, x1, y1)
      }
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = prev[0] * size.x + prev[2] * size.x - 1
        let y0 = prev[1] * size.y + size.y - 1
        let x1 = span[0] * size.x + span[2] * size.x - 1
        let y1 = span[1] * size.y + size.y - 1
        plotLine(bgx, x0, y0, x1, y1)
      }
    }
    bgx.fillStyle = 'white'
    bgx.strokeStyle = '#222'
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      bgx.fillRect(
        span[0] * size.x,
        span[1] * size.y,
        span[2] * size.x,
        span[3] * size.y
      )
      bgx.strokeRect(
        span[0] * size.x + 0.5,
        span[1] * size.y + 0.5,
        span[2] * size.x - 1,
        span[3] * size.y - 1
      )
    }
  } else if (state.theme === 'dark') {
    bgx.fillStyle = '#222'
    bgx.fillRect(0, 0, lay.w, lay.h)
    bgx.fillStyle = 'white'
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      if (i !== 0) {
        let prev = state.spans[i - 1]

        let x0 = (prev[0] + prev[2]) * size.x - 1
        let y0 = prev[1] * size.y + size.y / 2 - 1
        let x1 = span[0] * size.x
        let y1 = span[1] * size.y + size.y / 2 - 1
        plotLine(bgx, x0, y0, x1, y1)
      }
    }
    bgx.fillStyle = 'white'
    for (let span of state.spans) {
      fillRect(bgx, span)
    }
  } else if (state.theme === 'light') {
    bgx.fillStyle = '#efefef'
    bgx.fillRect(0, 0, lay.w, lay.h)
    bgx.fillStyle = '#bfbfbf'
    bgx.lineWidth = 1
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = (prev[0] + prev[2]) * size.x - 1
        let y0 = prev[1] * size.y + size.y / 2 - 1
        let x1 = span[0] * size.x
        let y1 = span[1] * size.y + size.y / 2 - 1
        plotLine(bgx, x0, y0, x1, y1)
      }
    }
    bgx.fillStyle = 'white'
    for (let span of state.spans) {
      fillRect(bgx, span)
    }
  } else if (state.theme === 'outline') {
    bgx.fillStyle = '#efefef'
    bgx.fillRect(0, 0, lay.w, lay.h)
    bgx.fillStyle = '#222'
    bgx.lineWidth = 1
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      if (i !== 0) {
        let prev = state.spans[i - 1]
        let x0 = (prev[0] + prev[2]) * size.x - 1
        let y0 = prev[1] * size.y + size.y / 2 - 1
        let x1 = span[0] * size.x
        let y1 = span[1] * size.y + size.y / 2 - 1
        plotLine(bgx, x0, y0, x1, y1)
      }
    }
    bgx.strokeStyle = '#222'
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      bgx.strokeRect(
        span[0] * size.x - 0.5,
        span[1] * size.y - 0.5,
        span[2] * size.x + 1,
        span[3] * size.y + 1
      )
    }
    bgx.fillStyle = 'white'
    for (let i = 0; i < state.spans.length; i++) {
      let span = state.spans[i]
      fillRect(bgx, span)
    }
  } else if (state.theme === 'grad') {
    bgx.fillStyle = '#222'
    bgx.fillRect(0, 0, lay.w, lay.h)

    let stops = chroma.scale(['yellow', 'cyan']).colors(state.spans.length)
    let counter = 0
    for (let span of state.spans) {
      bgx.fillStyle = stops[counter]
      fillRect(bgx, span)
      counter++
    }
  } else if (state.theme === 'bare') {
    bgx.fillStyle = '#fff'
    bgx.fillRect(0, 0, lay.w, lay.h)
  }
}
function renderText() {
  tx.clearRect(0, 0, cx.canvas.width, cx.canvas.height)
  let mut_text = state.text
  if (mut_text !== undefined) {
    for (let span of state.spans) {
      let [line, text] = wrapLine(mut_text, span[2])
      let x_start = span[0] * size.x
      let line_y = span[1] * size.y
      for (let j = 0; j < line.length; j++) {
        let index = line.charCodeAt(j)
        let x = index % alphabet.cols
        let y = Math.floor(index / alphabet.cols)
        if (index !== 32) {
          tx.drawImage(
            ax.canvas,
            x * size.x * dpr,
            y * size.y * dpr,
            size.x * dpr,
            size.y * dpr,
            x_start + j * size.x,
            line_y,
            size.x,
            size.y
          )
        }
      }
      mut_text = text
    }
  }
}
function renderHighlights() {
  hbx.clearRect(0, 0, lay.w, lay.h)
  if (state.mode === 'move') {
    hbx.fillStyle = Blue['100']
    let active = getSpanFromCursor(state.cursor)
    if (active !== null) {
      fillRect(hbx, active)
    }
  } else if (state.mode === 'selected') {
    hbx.fillStyle = Blue['200']
    let [sel] = getSelectedSpans()
    for (let span of sel) {
      fillRect(hbx, span)
    }
    if (state.desires !== null) {
      dbx.strokeStyle = Blue['600']
      for (let desire of state.desires) {
        dbx.strokeRect(
          desire[0] * size.x + 0.5,
          desire[1] * size.y + 0.5,
          desire[2] * size.x - 1,
          desire[3] * size.y - 1
        )
      }
    }
    $readleft.innerHTML = 'S' + state.selected.join(':')
  }
}
function renderCursor() {
  cbx.clearRect(0, 0, lay.w, lay.h)
  if (state.mode === 'selected') {
    cbx.strokeStyle = Blue['600']
    cbx.lineWidth = 1
    cbx.strokeRect(
      state.cursor[0] * size.x + 0.5,
      state.cursor[1] * size.y + 0.5,
      size.x - 1,
      size.y - 1
    )
  } else {
    cbx.fillStyle = Blue['400']
    fillRect(cbx, state.cursor)
    $readleft.innerHTML = state.cursor.slice(0, 2).join(':')
  }
}
function renderGlobalMode() {
  for (let $title of $titles) {
    $title.className = 'title'
  }
  if (state.global_mode === 'text') {
    $texttitle.className = 'title active'
  } else {
    $layouttitle.className = 'title active'
  }
}
function compose() {
  cx.clearRect(0, 0, lay.w, lay.h)
  cx.drawImage($background_buffer, 0, 0, lay.w, lay.h)
  cx.globalCompositeOperation = 'darken'
  cx.drawImage($text_buffer, 0, 0, lay.w, lay.h)
  cx.drawImage($highlight_buffer, 0, 0, lay.w, lay.h)
  if (state.mode === 'selected') {
    cx.globalCompositeOperation = 'source-over'
  } else {
    if (getSpanFromCursor(state.cursor) === null) {
      cx.globalCompositeOperation = 'source-over'
    }
  }
  cx.drawImage($cursor_buffer, 0, 0, lay.w, lay.h)
}
function renderAttach() {
  if (state.attach) {
    $attach.className = 'active'
  } else {
    $attach.className = ''
  }
}
function renderModeHelp() {
  if (state.global_mode === 'layout') {
    $help_layout_mode.style.display = 'block'
    $help_text_mode.style.display = 'none'
    if (state.mode === 'move') {
      $help_freemove.style.display = 'block'
      $help_selected.style.display = 'none'
    } else {
      $help_freemove.style.display = 'none'
      $help_selected.style.display = 'block'
    }
  } else {
    $help_layout_mode.style.display = 'none'
    $help_text_mode.style.display = 'block'
  }
}
function renderActiveTheme() {
  let children = $theme_holder.children
  for (let i = 0; i < children.length; i++) {
    let child = children[i]
    if (child.id === 'theme-' + state.theme) {
      child.className = 'active'
    } else {
      child.className = ''
    }
  }
}
function renderHelp() {
  if (state.show_help) {
    document.body.className = 'show-help'
  } else {
    document.body.className = ''
  }
}

// render end

  // extra themes = light, 3d
  let themes = ['dark', 'outline', 'grad', 'bare']
  let $theme_list = themes
    .map(t => `<div id="theme-${t}"><span>${t}</span></div>`)
    .join('\n')
  $theme_holder.innerHTML = $theme_list

  // state
  let state = {}
  state.global_mode = 'layout'
  state.mode = 'move'
  state.text =
    'Introducing Span\nSpan is an experimental layout editor. It lets you move text around \nline by line\nusing boxes called\nspans\nYou enter the text below, and then use a set of VIM-inspired keyboard shortcuts to create, delete, move and resize spans.\nText that reaches the end of a span wraps and continues in the next one.\nLine breaks make sure the text goes to a new span.\nYou can cycle through different themes by pressing \'t\'.\nYou can save what you make as a png to share or JSON to continue editing.\nI made Span to try and imagine what a layout tool would feel like if it did not stick to the "textarea" metaphor.'
  state.spans = [
    [2, 1, 11, 1],
    [15, 1, 4, 1],
    [2, 3, 38, 1],
    [2, 4, 38, 1],
    [2, 6, 12, 1],
    [2, 8, 18, 1],
    [22, 8, 5, 1],
    [2, 10, 38, 1],
    [2, 11, 38, 1],
    [2, 12, 38, 1],
    [2, 13, 38, 1],
    [2, 14, 38, 1],
    [2, 15, 38, 1],
    [2, 16, 38, 1],
    [2, 17, 38, 1],
    [2, 19, 38, 1],
    [2, 20, 38, 1],
    [42, 16, 36, 1],
    [42, 17, 36, 1],
    [42, 18, 36, 1],
    [44, 20, 34, 1],
    [44, 21, 34, 1],
    [44, 22, 34, 1],
    [44, 23, 34, 1],
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
km = {}

function keyAction(key, e) {
  if (state.global_mode === 'layout') {
    if (key === 'w') {
      let save_object = {
        spans: state.spans,
        text: state.text,
      }
      let link = document.createElement('a')
      link.setAttribute(
        'download',
        'span-' + Math.round(new Date().getTime() / 1000) + '.json'
      )
      let data =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(save_object))
      link.setAttribute('href', data)
      link.dispatchEvent(
        new MouseEvent(`click`, {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      )
    }
    if (key === 'o') {
      // TODO open file
      function handleChange(e) {
        var reader = new FileReader()

        reader.onload = function(event) {
          appendHistory()
          var obj = JSON.parse(event.target.result)
          state.spans = obj.spans
          state.text = obj.text
          renderBackground()
          renderText()
          renderCursor()
          renderHighlights()
          compose()
        }

        reader.readAsText(event.target.files[0])
      }
      $fileinput.addEventListener('change', handleChange)
      $fileinput.dispatchEvent(
        new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        })
      )
    }
    if (key === '?') {
      state.show_help = !state.show_help
      renderHelp()
    }
    if (key === 'p') {
      let link = document.createElement('a')

      let $print = document.createElement('canvas')
      let pbx = setUpCanvas($print, lay.w, lay.h)

      pbx.clearRect(0, 0, lay.w, lay.h)
      pbx.drawImage($background_buffer, 0, 0, lay.w, lay.h)
      pbx.globalCompositeOperation = 'darken'
      pbx.drawImage($text_buffer, 0, 0, lay.w, lay.h)
      $print.toBlob(function(blob) {
        link.setAttribute(
          'download',
          'span-' + Math.round(new Date().getTime() / 1000) + '.png'
        )
        link.setAttribute('href', URL.createObjectURL(blob))
        link.dispatchEvent(
          new MouseEvent(`click`, {
            bubbles: true,
            cancelable: true,
            view: window,
          })
        )
      })
    }

    if (key === 't') {
      let theme_index = themes.indexOf(state.theme)
      let next = (theme_index + 1) % themes.length
      state.theme = themes[next]
      renderBackground()
      renderActiveTheme()
      compose()
    }
    if (key === 'e') {
      $input.focus()
    }
    if (key === 'a') {
      state.attach = !state.attach
      renderAttach()
    }
    if (key === 'u' || key === 'r') {
      if (key === 'u') {
        undo()
      } else if (key === 'r') {
        redo()
      }
      renderBackground()
      renderText()
      renderCursor()
      renderHighlights()
      compose()
    }

    // mode move
    if (state.mode === 'move') {
      let cursor = state.cursor

      // special
      if (key === 'c') {
        appendHistory()
        state.spans = []
        renderBackground()
        renderText()
        renderHighlights()
        compose()
      }

      if (key === 'enter') {
        let active = getSpanIndexFromCursor(cursor)
        if (active !== null) {
          state.mode = 'selected'
          setSelected(active, 0)
          renderHighlights()
          renderCursor()
          renderModeHelp()
          compose()
        } else {
          if (e.shiftKey) {
            createSpan(-1)
          } else {
            createSpan(1)
          }
          renderBackground()
          renderText()
          renderHighlights()
          compose()
        }
      }
      if (key === 'backspace') {
        deleteSpan()
        renderBackground()
        renderText()
        renderHighlights()
        compose()
      }

      // movement
      if (km.j) {
        cursor[1] = Math.min(cursor[1] + 1, layout.rows - 1)
      }
      if (km.k) {
        cursor[1] = Math.max(cursor[1] - 1, 0)
      }
      if (km.h) {
        cursor[0] = Math.max(cursor[0] - 1, 0)
      }
      if (km.l) {
        cursor[0] = Math.min(cursor[0] + 1, layout.cols - 1)
      }
      if (km.j || km.k || km.h || km.l) {
        renderHighlights()
        renderCursor()
        compose()
      }

      // mode selected
    } else if (state.mode === 'selected') {
      let selected = state.selected

      if (key === 'control') {
        setDesires()
        renderHighlights()
        compose()
      }
      if (key === 'escape') {
        state.mode = 'move'
        renderModeHelp()
        renderCursor()
        renderHighlights()
        compose()
      }
      if (key === 'backspace') {
        deleteSpan()
        renderBackground()
        renderText()
        renderHighlights()
        compose()
      }

      if (e.ctrlKey) {
        if (km.j || km.k || km.l || km.h) {
          let moves = [0, 0]
          if (km.j) {
            moves[1] += 1
          }
          if (km.k) {
            moves[1] -= 1
          }
          if (km.h) {
            moves[0] -= 1
          }
          if (km.l) {
            moves[0] += 1
          }
          handleSpanMove(moves)
          e.preventDefault()
          renderBackground()
          renderText()
          renderHighlights()
          compose()
        }
      } else {
        if (e.shiftKey) {
          if (km.j) {
            selected[1] = Math.min(
              state.spans.length - 1 - selected[0],
              selected[1] + 1
            )
            renderHighlights()
            compose()
          }
          if (km.k) {
            selected[1] = Math.max(-selected[0], selected[1] - 1)
            renderHighlights()
            compose()
          }
          if (km.h) {
            handleLeftSize(-1)
            renderBackground()
            renderText()
            renderHighlights()
            compose()
          }
          if (km.l) {
            handleLeftSize(1)
            renderBackground()
            renderText()
            renderHighlights()
            compose()
          }
        } else {
          if (km.j) {
            if (selected[1] === 0) {
              selected[0] = Math.min(state.spans.length - 1, selected[0] + 1)
            } else {
              selected[0] = Math.max(selected[0], selected[0] + selected[1])
              selected[1] = 0
            }
            renderHighlights()
            compose()
          }
          if (km.k) {
            if (selected[1] === 0) {
              selected[0] = Math.max(0, selected[0] - 1)
            } else {
              selected[0] = Math.min(selected[0], selected[0] + selected[1])
              selected[1] = 0
            }
            renderHighlights()
            compose()
          }
          if (km.l) {
            handleRightSize(1)
            renderBackground()
            renderText()
            renderHighlights()
            compose()
          }
          if (km.h) {
            handleRightSize(-1)
            renderBackground()
            renderText()
            renderHighlights()
            compose()
          }
        }
      }
    }
  } else {
    if (key === 'escape') {
      $input.blur()
    }
  }
}

$attach.addEventListener('click', () => {
  if (state.attach) {
    attachOff()
  } else {
    attachOn()
  }
  renderAttach()
})

function downHandler(e) {
  let key = e.key.toLowerCase()
  km[key] = true
  if (key === 'arrowdown') {
    km['j'] = true
    if (state.global_mode === 'layout') {
      e.preventDefault()
    }
  } else if (key === 'arrowup') {
    km['k'] = true
  } else if (key === 'arrowleft') {
    km['h'] = true
  } else if (key === 'arrowright') {
    km['l'] = true
  }
  if (key === 'enter') {
    // stop enter from triggering focused button
    if (state.global_mode === 'layout') {
      e.preventDefault()
    }
  }
  keyAction(e.key.toLowerCase(), e)
}
function upHandler(e) {
  let key = e.key.toLowerCase()
  km[key] = false
  if (key === 'arrowdown') {
    km['j'] = false
  } else if (key === 'arrowup') {
    km['k'] = false
  } else if (key === 'arrowleft') {
    km['h'] = false
  } else if (key === 'arrowright') {
    km['l'] = false
  }
  if (e.key.toLowerCase() === 'control') {
    state.desires = null
    renderHighlights()
    compose()
  }
}
window.addEventListener('keydown', downHandler)
window.addEventListener('keyup', upHandler)

$input.addEventListener('focus', () => {
  state.global_mode = 'text'
  renderGlobalMode()
  renderModeHelp()
})
$input.addEventListener('blur', () => {
  state.global_mode = 'layout'
  renderGlobalMode()
  renderModeHelp()
})
$input.addEventListener('input', e => {
  let raw = e.target.value
  state.text = raw
  renderText()
  compose()
})
{
  let children = $theme_holder.children
  for (let i = 0; i < children.length; i++) {
    let $child = children[i]
    $child.addEventListener('click', e => {
      state.theme = $child.id.substr(6)
      renderBackground()
      renderActiveTheme()
      compose()
    })
  }
}
{
  let $selectors = document.querySelectorAll('.display_select')
  for (let i = 0; i < $selectors.length; i++) {
    let $select = $selectors[i]
    $select.addEventListener('click', () => {
      for (let i = 0; i < $selectors.length; i++) {
        let $select = $selectors[i]
        $select.className = 'display_select'
      }
      if ($select.id === 'arrow_selectref') {
        $instructions.className = 'arrows'
      } else {
        $instructions.className = ''
      }
      $select.className = 'display_select active'
    })
  }
}
// Click helpers for instructions
let $structs = document.querySelectorAll('.instruction')
for (let i = 0; i < $structs.length; i++) {
  let $struct = $structs[i]
  $struct.addEventListener('click', function() {
    let trigger = $struct.getAttribute('data-trigger')
    let fake_event = {}
    let key
    if (trigger.includes('shift')) {
      fake_event.shiftKey = true
      key = trigger.split(' ')[1]
    } else if (trigger.includes('ctrl')) {
      fake_event.ctrlKey = true
      key = trigger.split(' ')[1]
    } else {
      key = trigger
    }
    km[key.toLowerCase()] = true
    keyAction(trigger, fake_event)
    setTimeout(() => {
      km[key.toLowerCase()] = false
    }, 100)
  })
}

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
