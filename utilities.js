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
