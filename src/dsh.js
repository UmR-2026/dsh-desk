'use strict'

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const readline = require('readline')

// The CLI prints one readiness line after the web server settles:
//   dsh web: http://127.0.0.1:<port>
const READY_RE = /dsh web:\s*(\S+)/
const READY_TIMEOUT_MS = 120 * 1000

function isWindows() {
  return process.platform === 'win32'
}

/**
 * Resolve how to launch `dsh`.
 * Priority: DSH_BIN (explicit executable) > DSH_HOME/source/current (checkout)
 * > PATH lookup. The shell bundles no harness code, so it stays correct
 * across harness upgrades.
 */
function resolveDsh() {
  // 1. Explicit binary path.
  const bin = process.env.DSH_BIN
  if (bin && fs.existsSync(bin)) {
    return { command: bin, args: [], useShell: false }
  }

  // 2. A harness checkout at $DSH_HOME/source/current (install.sh layout).
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  const checkout = path.join(home, 'source', 'current')
  if (fs.existsSync(checkout)) {
    const builtBin = path.join(checkout, 'apps', 'cli', 'lib', 'bin.js')
    if (fs.existsSync(builtBin)) {
      return { command: process.execPath, args: [builtBin], useShell: false }
    }
    // tsx source launch, exactly as the checkout's own `pnpm run dsh` does.
    return { command: 'pnpm', args: ['--dir', checkout, 'dsh'], useShell: isWindows() }
  }

  // 3. PATH lookup. On Windows `shell: true` lets cmd.exe run the `dsh.cmd`
  // shim that npm/npx installs into node_modules/.bin.
  return { command: 'dsh', args: [], useShell: isWindows() }
}

function buildEnv() {
  const env = { ...process.env }
  if (isWindows() && !env.DSH_PERMISSION_MODE) {
    // Windows has no harness confinement backend, so the CLI's default
    // workspace-write mode cannot boot. Fall back to danger-full-access and
    // warn; users may set DSH_PERMISSION_MODE explicitly to override.
    env.DSH_PERMISSION_MODE = 'danger-full-access'
    console.warn(
      '[dsh] DSH_PERMISSION_MODE unset on Windows -> falling back to danger-full-access ' +
        '(approval prompts disabled). Set DSH_PERMISSION_MODE to override.'
    )
  }
  return env
}

/**
 * Spawn `dsh web --host 127.0.0.1 --port 0` and resolve once the readiness
 * line is observed. `--port 0` asks the OS for a free port, so a browser
 * instance and this shell can run side by side.
 */
function startServer() {
  const { command, args, useShell } = resolveDsh()
  const child = spawn(
    command,
    [...args, 'web', '--host', '127.0.0.1', '--port', '0'],
    {
      shell: useShell,
      detached: !isWindows(), // POSIX: own process group for group kill
      windowsHide: true,
      env: buildEnv(),
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (fn, value) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      fn(value)
    }

    readline
      .createInterface({ input: child.stdout })
      .on('line', (line) => {
        process.stdout.write('[dsh web] ' + line + '\n')
        const m = line.match(READY_RE)
        if (m) finish(resolve, { child, url: m[1] })
      })
    readline
      .createInterface({ input: child.stderr })
      .on('line', (line) => process.stderr.write('[dsh web][err] ' + line + '\n'))

    child.on('error', (err) => finish(reject, err))
    child.on('exit', (code, signal) => {
      finish(
        reject,
        new Error(
          `dsh web exited before ready (code=${code} signal=${signal}). ` +
            'Is `dsh` resolvable? Set DSH_BIN or install it globally.'
        )
      )
    })

    const timer = setTimeout(() => {
      finish(reject, new Error(`dsh web did not report readiness within ${READY_TIMEOUT_MS}ms`))
    }, READY_TIMEOUT_MS)
  })
}

module.exports = { resolveDsh, startServer, READY_RE }
