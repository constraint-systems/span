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
