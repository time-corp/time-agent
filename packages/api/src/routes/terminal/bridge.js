#!/usr/bin/env node
// Runs in Node.js — bridges node-pty over stdin/stdout pipes for Bun.
// stdin  → JSON-lines: {"type":"input","data":"..."} | {"type":"resize","cols":N,"rows":N}
// stdout → raw PTY output bytes
const pty = require('node-pty');
const os = require('os');
const readline = require('readline');

const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : '/bin/zsh');

const p = pty.spawn(shell, [], {
  name: 'xterm-color',
  cols: parseInt(process.env.PTY_COLS || '80', 10),
  rows: parseInt(process.env.PTY_ROWS || '24', 10),
  cwd: process.env.HOME || process.cwd(),
  env: process.env,
});

p.onData((data) => process.stdout.write(data));
p.onExit(({ exitCode }) => process.exit(exitCode ?? 0));

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    if (msg.type === 'input') p.write(msg.data);
    else if (msg.type === 'resize') p.resize(msg.cols, msg.rows);
  } catch {}
});
rl.on('close', () => p.kill());
