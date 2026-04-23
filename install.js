#!/usr/bin/env node

/**
 * atomic-cline install
 *
 * Copies Atomic hook scripts into ~/Documents/Cline/Hooks/ (global hooks).
 * Cline discovers hooks as executable files in this directory.
 *
 * Usage:
 *   npx atomic-cline            # install
 *   node install.js             # install from local checkout
 *   node install.js --silent    # postinstall
 *   node install.js --uninstall # remove hooks
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const silent = process.argv.includes("--silent");
const uninstall = process.argv.includes("--uninstall");

const PKG_DIR = __dirname;
const TARGET = path.join(os.homedir(), "Documents", "Cline", "Hooks");
const HOOK_PREFIX = "atomic-";

const HOOKS = [
  "TaskStart",
  "TaskResume",
  "TaskComplete",
  "TaskCancel",
  "UserPromptSubmit",
  "PostToolUse",
  "PreToolUse",
];
function doInstall() {
  if (!fs.existsSync(TARGET)) {
    fs.mkdirSync(TARGET, { recursive: true });
  }

  let installed = 0;

  for (const hook of HOOKS) {
    const src = path.join(PKG_DIR, "hooks", hook);
    const dst = path.join(TARGET, HOOK_PREFIX + hook);

    if (!fs.existsSync(src)) {
      if (!silent) console.warn(`  skip: ${hook} (not found in package)`);
      continue;
    }

    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o755);
    installed++;
    if (!silent) console.log(`  installed: ${hook}`);
  }

  if (!silent) {
    console.log();
    console.log(`✓ atomic-cline installed (${installed} hooks)`);
    console.log(`  Target: ${TARGET}`);
    console.log();
    console.log("  Enable hooks in Cline's Hooks tab (scale icon).");
    console.log();
    console.log("  To add rules to a project:");
    console.log("    mkdir -p .clinerules");
    console.log(`    cp ${path.join(PKG_DIR, "rules", "atomic.md")} .clinerules/atomic.md`);
    console.log();
  }
}

function doUninstall() {
  let removed = 0;

  for (const hook of HOOKS) {
    const dst = path.join(TARGET, HOOK_PREFIX + hook);
    if (fs.existsSync(dst)) {
      fs.unlinkSync(dst);
      removed++;
      if (!silent) console.log(`  removed: ${hook}`);
    }
  }

  if (!silent) {
    console.log();
    console.log(`✓ atomic-cline uninstalled (${removed} hooks removed)`);
    console.log("  Note: .clinerules/ files in projects must be removed manually.");
  }
}

if (uninstall) {
  doUninstall();
} else {
  doInstall();
}
