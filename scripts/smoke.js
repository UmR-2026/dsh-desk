'use strict'

// Smoke test for the shell's server pipeline (no Electron window):
// spawns `dsh web --port 0`, waits for the readiness line, then kills the
// process tree. Run with `npm run smoke` to verify your dsh wiring.
const { startServer } = require('../src/dsh')
const { killTree } = require('../src/kill-tree')

async function main() {
  console.log('SMOKE: spawning dsh web ...')
  const { child, url } = await startServer()
  console.log('SMOKE_READY_URL:', url)
  console.log('SMOKE: killing server tree ...')
  killTree(child.pid, 'SIGTERM')
  await new Promise((r) => setTimeout(r, 2000))
  console.log('SMOKE_OK')
  process.exit(0)
}

main().catch((err) => {
  console.error('SMOKE_FAIL:', err && err.message)
  process.exit(1)
})
