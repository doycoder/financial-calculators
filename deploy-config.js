#!/usr/bin/env node
/**
 * Replace the YOUR_DOMAIN.com placeholder across all HTML/XML/TXT files
 * with your real domain before deploying.
 *
 * Usage:
 *   node deploy-config.js example.com
 *   node deploy-config.js example.com --revert      # restore placeholder
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PLACEHOLDER = 'YOUR_DOMAIN.com';
const TARGET_EXT  = new Set(['.html', '.xml', '.txt']);

const args = process.argv.slice(2);
const revert = args.includes('--revert');
const domain = args.find(a => !a.startsWith('--'));

if (!domain && !revert) {
  console.error('Usage: node deploy-config.js <your-domain.com> [--revert]');
  console.error('Example: node deploy-config.js compoundcalc.io');
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (TARGET_EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

const root = __dirname;
const files = walk(root);
let touched = 0;

const [from, to] = revert
  ? [new RegExp(escape(domain || ''), 'g'), PLACEHOLDER]
  : [new RegExp(escape(PLACEHOLDER), 'g'), domain];

if (revert && !domain) {
  console.error('Pass the current domain when reverting: node deploy-config.js example.com --revert');
  process.exit(1);
}

function escape(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!from.test(original)) continue;
  from.lastIndex = 0;
  const updated = original.replace(from, to);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    touched++;
    console.log('  updated', path.relative(root, file));
  }
}

console.log(`\n${touched} file(s) updated. ${revert ? 'Reverted to placeholder.' : `Domain set to ${domain}.`}`);
