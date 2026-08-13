'use strict'

const { spawn } = require('child_process')

/**
 * Terminate a process and its descendants. The dsh server is spawned
 * detached on POSIX (own process group, signalled via -pid); on Windows we
 * use taskkill /T to walk the tree.
 */
function killTree(pid, signal = 'SIGTERM') {
  if (!pid) return
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
  } else {
    try {
      process.kill(-pid, signal)
    } catch (_) {
      try {
        process.kill(pid, signal)
      } catch (_) {
        /* already gone */
      }
    }
  }
}

module.exports = { killTree }
