'use strict'

const { app, dialog } = require('electron')
const { startServer } = require('./dsh')
const { createWindow } = require('./window')
const { createTray } = require('./tray')
const { killTree } = require('./kill-tree')
const { setupAutoUpdater } = require('./updater')

let mainWindow = null
let tray = null
let server = null
let quitting = false

// Single instance: a second launch focuses the existing window instead of
// starting a second dsh server.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(boot).catch((err) => {
    dialog.showErrorBox('DSH Desktop', 'Failed to start dsh web:\n\n' + formatError(err))
    app.quit()
  })
}

async function boot() {
  server = await startServer()
  mainWindow = createWindow(server.url, () => quitting)
  tray = createTray({
    onShow: () => showWindow(),
    onQuit: () => quit(),
  })
  setupAutoUpdater()
}

function showWindow() {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

function quit() {
  quitting = true
  app.quit()
}

app.on('before-quit', () => {
  quitting = true
})

// Keep the app (and the server) alive in the tray after the window is hidden;
// only an explicit Quit terminates the server.
app.on('window-all-closed', () => {
  /* no-op: tray residency */
})

app.on('will-quit', () => {
  if (server && server.child) killTree(server.child.pid, 'SIGTERM')
})

// macOS: re-show the window when the dock icon is clicked.
app.on('activate', () => {
  if (mainWindow) showWindow()
})

function formatError(err) {
  return (err && (err.stack || err.message)) || String(err)
}
