/** @type {HTMLInputElement} */
const epEdit = document.querySelector('#ep')

/** @type {HTMLTextAreaElement} */
const dataEdit = document.querySelector('#data')

/** @type {HTMLButtonElement} */
const toggleButton = document.querySelector('#toggle')

/** @type {HTMLDivElement} */
const stateText = document.querySelector('#state')

/** @type {HTMLButtonElement} */
const sendButton = document.querySelector('#send')

/** @type {HTMLButtonElement} */
const clearButton = document.querySelector('#clear')

/** @type {HTMLDivElement} */
const logContainer = document.querySelector('#log')

/** @type {HTMLInputElement} */
const scrollInput = document.querySelector('#scroll')

/** @type {HTMLInputElement} */
const cleanInput = document.querySelector('#clean')

/** @type {HTMLTemplateElement} */
const {
  content: {firstElementChild: logTemplate}
} = document.querySelector('#template')

const momentFormatter = new Intl.DateTimeFormat(
  /* use user locale */
  [],
  {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',

    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',

    fractionalSecondDigits: 3
  }
)

/**
 * @param {string} type
 * @param {string} msg
 */
const appendLog = (type, msg) => {
  /* capture time first */
  const nowText = momentFormatter.format()

  /** @type {HTMLDivElement} */
  const logEntry = logTemplate.cloneNode(true)

  /** @type {HTMLDivElement} */
  const typeText = logEntry.querySelector('.type')

  /** @type {HTMLDivElement} */
  const datetimeText = logEntry.querySelector('.datetime')

  /** @type {HTMLDivElement} */
  const dataText = logEntry.querySelector('.data')

  datetimeText.textContent = nowText
  typeText.textContent = type
  dataText.textContent = msg

  logContainer.prepend(logEntry)

  if (scrollInput.checked)
    /* scroll new item into view */
    logEntry.scrollIntoView(
      {
        behavior: 'smooth',
        block: 'start'
      }
    )
}

/** @type {WebSocket | null} */
let ws

const onToggleState = () => {
  if (ws) {
    ws.close()

    /* lock toggle */
    toggleButton.disabled = true

    /* update state */
    stateText.textContent = `Closing`

    appendLog('info', `Closing`)
  } else {
    if (cleanInput.checked) {
      /* effectively remove all children */
      logContainer.replaceChildren()
    }

    try {
      ws = new WebSocket(epEdit.value)
    } catch {
      appendLog('info', `Opening Error`)

      /* fail fast */
      return
    }

    /* lock URL */
    epEdit.readOnly = true

    /* update caption */
    toggleButton.textContent = 'Cancel'

    /* update state */
    stateText.textContent = `Opening`

    appendLog('info', `Opening`)

    /* add events listener */
    ws.addEventListener('open', onOpen)
    ws.addEventListener('close', onClose)
    ws.addEventListener('message', onMessage)
    ws.addEventListener(
      'error',
      () => appendLog('event', 'Error')
    )
  }
}

const onOpen = () => {
  /* unlock submit */
  sendButton.disabled = false

  /* update caption */
  toggleButton.textContent = 'Close'

  /* update state */
  stateText.textContent = `Opened`

  appendLog('event', 'Opened')
}

/**
 * @param {MessageEvent<string | ArrayBuffer>} e
 */
const onMessage = (e) => {
  const {data} = e

  /* record log */
  appendLog('received', data)
}

const onClose = (e) => {
  ws = null

  /* lock submit */
  sendButton.disabled = true

  /* unlock URL */
  epEdit.readOnly = false

  /* unlock toggle */
  toggleButton.disabled = false

  /* update caption */
  toggleButton.textContent = 'Open'

  /* update state */
  stateText.textContent = `Closed`

  appendLog('event', `Closed, Code ${e.code}`)
}

const onSendData = () => {
  /* get data */
  const data = dataEdit.value

  ws.send(data)

  /* make a copy of what we send */
  appendLog('sent', data)
}

const onClearRecord = () => {
  /* effectively remove all children */
  logContainer.replaceChildren()

  /* add log */
  appendLog('info', 'Cleared')
}

toggleButton.addEventListener('click', onToggleState)
sendButton.addEventListener('click', onSendData)
clearButton.addEventListener('click', onClearRecord)
