'use strict'

const { app, dialog } = require('electron')

/**
 * Auto-update for the *shell itself* (not the harness). Only active in a
 * packaged build; in dev it is a no-op. Reads the `build.publish` GitHub
 * config in package.json and checks GitHub Releases.
 */
function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log('[updater] dev mode — skipping auto-update')
    return
  }

  let autoUpdater
  try {
    ;({ autoUpdater } = require('electron-updater'))
  } catch (err) {
    console.error('[updater] electron-updater not available:', err.message)
    return
  }

  autoUpdater.logger = console
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] update available:', info.version)
  })
  autoUpdater.on('update-not-available', () => {
    console.log('[updater] up to date')
  })
  autoUpdater.on('update-downloaded', (info) => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update ready',
        message: `DSH Desktop ${info.version} downloaded. Restart now to apply?`,
        buttons: ['Restart now', 'Later'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })
  autoUpdater.on('error', (err) => {
    console.error('[updater] error:', err && err.message)
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[updater] check failed:', err && err.message)
  })
}

module.exports = { setupAutoUpdater }
