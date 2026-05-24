#!/usr/bin/env node
const fs = require('fs');

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    const filePath = input.file_path;
    if (!filePath) process.exit(0);

    let buf;
    try {
      buf = fs.readFileSync(filePath);
    } catch {
      process.exit(0);
    }

    if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      process.stderr.write(`WARNING: UTF-8 BOM detected in ${filePath}\n`);
    }

    const str = buf.toString('utf8');
    if (/[–—]/.test(str)) {
      process.stderr.write(`WARNING: em/en-dash detected in ${filePath}\n`);
    }
  } catch {
    // ignore parse errors
  }
  process.exit(0);
});
