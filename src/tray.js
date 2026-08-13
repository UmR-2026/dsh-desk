'use strict'

const { Tray, Menu, nativeImage } = require('electron')
const path = require('path')

function createTray({ onShow, onQuit }) {
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'tray.png'))
  if (icon.isEmpty()) {
    throw new Error('assets/tray.png is missing or unreadable')
  }
  const tray = new Tray(icon)
  tray.setToolTip('DeepSeek Harness')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show DSH', click: onShow },
      { type: 'separator' },
      { label: 'Quit', click: onQuit },
    ])
  )
  tray.on('click', onShow)
  return tray
}

module.exports = { createTray }
