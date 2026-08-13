'use strict'

const { BrowserWindow, shell } = require('electron')

const isHttp = (u) => /^https?:\/\//i.test(u)

function createWindow(url, isQuitting) {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 720,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      // The GUI is a normal web app: no preload, no Node in the renderer.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Closing the window hides it (tray residency); only Quit actually closes.
  win.on('close', (e) => {
    if (!isQuitting()) {
      e.preventDefault()
      win.hide()
    }
  })

  // External links -> system browser, restricted to http(s).
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (isHttp(target)) shell.openExternal(target)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (e, target) => {
    let origin
    try {
      origin = new URL(url).origin
    } catch (_) {
      return
    }
    if (new URL(target).origin !== origin) {
      e.preventDefault()
      if (isHttp(target)) shell.openExternal(target)
    }
  })

  win.loadURL(url)
  return win
}

module.exports = { createWindow }
