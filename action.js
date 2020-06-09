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
          'span-' +
            new Date()
              .toISOString()
              .slice(0, -4)
              .replace(/-/g, '')
              .replace(/:/g, '')
              .replace(/_/g, '')
              .replace(/\./g, '') +
            'Z' +
            '.png'
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
