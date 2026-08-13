'use strict'

// Boots the GLOBAL dsh (not the npx one) and confirms `dsh web` reaches the
// readiness line, then tree-kills. Run: node scripts/test-global.js
const { spawn } = require('child_process')

const GLOBAL = process.env.GLOBAL_DSH || 'C:\\Users\\UmR\\AppData\\Roaming\\npm\\dsh.cmd'
console.log('TESTING:', GLOBAL)

const c = spawn(GLOBAL, ['web', '--host', '127.0.0.1', '--port', '0'], {
  shell: true,
  windowsHide: true,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let out = ''
let done = false

function finish(ok, label) {
  if (done) return
  done = true
  clearTimeout(timer)
  console.log(label)
  console.log('--- tail ---')
  console.log(out.slice(-1500))
  try {
    spawn('taskkill', ['/pid', String(c.pid), '/T', '/F'], { windowsHide: true })
  } catch (_) {}
  setTimeout(() => process.exit(ok ? 0 : 1), 1500)
}

c.stdout.on('data', (d) => {
  out += d
  if (!done && /dsh web:\s*(\S+)/.test(out)) finish(true, 'READY_OK')
})
c.stderr.on('data', (d) => {
  out += d
})

const timer = setTimeout(() => finish(false, 'NO_READY_TIMEOUT'), 90000)
c.on('exit', (code) => {
  if (!done) finish(false, 'EXITED_EARLY code=' + code)
})
