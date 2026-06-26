#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('run-hook.js: missing script name');
  process.exit(1);
}

const scriptName = args[0];
const additionalArgs = args.slice(1);
const hookDir = __dirname;
const scriptPath = path.join(hookDir, scriptName);

if (process.platform === 'win32') {
  let bashPath = null;
  const pathsToCheck = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe'
  ];
  for (const p of pathsToCheck) {
    if (fs.existsSync(p)) {
      bashPath = p;
      break;
    }
  }

  if (!bashPath) {
    // Check if bash is in PATH
    try {
      const result = spawnSync('where', ['bash'], { encoding: 'utf8' });
      if (result.status === 0 && result.stdout) {
        // Use the first line of the where command output
        const lines = result.stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          bashPath = lines[0];
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (bashPath) {
    const run = spawnSync(bashPath, [scriptPath, ...additionalArgs], { stdio: 'inherit' });
    process.exit(run.status ?? 0);
  } else {
    // No bash found: exit silently so plugin still functions without hook injection
    process.exit(0);
  }
} else {
  // Unix/macOS: execute with bash
  const run = spawnSync('bash', [scriptPath, ...additionalArgs], { stdio: 'inherit' });
  process.exit(run.status ?? 0);
}
