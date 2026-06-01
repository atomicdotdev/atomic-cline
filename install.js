#!/usr/bin/env node

/**
 * atomic-cline install
 *
 * Copies Atomic hook scripts into ~/Documents/Cline/Hooks/ (global hooks),
 * and symlinks skills into ~/Documents/Cline/Workflows/ so they are available
 * on demand as the /atomic-vault, /atomic-vcs, and /code-intelligence slash
 * commands referenced by the rules.
 *
 * Cline discovers hooks as executable files in the Hooks/ directory, and
 * workflows as markdown files in the Workflows/ directory (invoked via `/name`).
 *
 * Usage:
 *   npx atomic-cline            # install
 *   node install.js             # install from local checkout
 *   node install.js --silent    # postinstall
 *   node install.js --uninstall # remove hooks and skill symlinks
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const silent = process.argv.includes("--silent");
const uninstall = process.argv.includes("--uninstall");

const PKG_DIR = __dirname;
const CLINE_DIR = path.join(os.homedir(), "Documents", "Cline");
const HOOKS_TARGET = path.join(CLINE_DIR, "Hooks");
const SKILLS_TARGET = path.join(CLINE_DIR, "Workflows");
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

// Skills are shipped under skills/<name>/SKILL.md and exposed as flat
// workflow files so they resolve as the `/<name>` slash commands the rules
// reference (e.g. /atomic-vault). Symlinked so package updates propagate.
const SKILL_LINKS = [
  { src: "skills/atomic-vault/SKILL.md", dst: "atomic-vault.md" },
  { src: "skills/atomic-vcs/SKILL.md", dst: "atomic-vcs.md" },
  { src: "skills/code-intelligence/SKILL.md", dst: "code-intelligence.md" },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function isOurSymlink(dstPath) {
  try {
    if (!fs.lstatSync(dstPath).isSymbolicLink()) return false;
    return fs.readlinkSync(dstPath).startsWith(PKG_DIR);
  } catch {
    return false;
  }
}

function installHooks() {
  ensureDir(HOOKS_TARGET);

  let installed = 0;
  for (const hook of HOOKS) {
    const src = path.join(PKG_DIR, "hooks", hook);
    const dst = path.join(HOOKS_TARGET, HOOK_PREFIX + hook);

    if (!fs.existsSync(src)) {
      if (!silent) console.warn(`  skip: ${hook} (not found in package)`);
      continue;
    }

    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o755);
    installed++;
    if (!silent) console.log(`  hook: ${hook}`);
  }
  return installed;
}

function installSkills() {
  ensureDir(SKILLS_TARGET);

  let linked = 0;
  let skipped = 0;

  for (const { src, dst } of SKILL_LINKS) {
    const srcPath = path.join(PKG_DIR, src);
    const dstPath = path.join(SKILLS_TARGET, dst);

    if (!fs.existsSync(srcPath)) {
      if (!silent) console.warn(`  skip: ${src} (not found in package)`);
      continue;
    }

    // Never overwrite a user's own file at the destination.
    if (fs.existsSync(dstPath) && !isOurSymlink(dstPath)) {
      skipped++;
      if (!silent) console.log(`  keep: ${dst} (user file, not overwriting)`);
      continue;
    }

    if (fs.existsSync(dstPath) || isOurSymlink(dstPath)) {
      fs.unlinkSync(dstPath);
    }

    fs.symlinkSync(srcPath, dstPath);
    linked++;
    if (!silent) console.log(`  skill: /${dst.replace(/\.md$/, "")}`);
  }

  return { linked, skipped };
}

function doInstall() {
  const installed = installHooks();
  const { linked, skipped } = installSkills();

  if (!silent) {
    console.log();
    console.log(
      `✓ atomic-cline installed (${installed} hooks, ${linked} skills linked${
        skipped ? `, ${skipped} skipped` : ""
      })`,
    );
    console.log(`  Hooks:  ${HOOKS_TARGET}`);
    console.log(`  Skills: ${SKILLS_TARGET}`);
    console.log();
    console.log("  Enable hooks in Cline's Hooks tab (scale icon).");
    console.log();
    console.log("  To add rules to a project:");
    console.log("    mkdir -p .clinerules");
    console.log(
      `    cp ${path.join(PKG_DIR, "rules", "atomic.md")} .clinerules/atomic.md`,
    );
    console.log();
  }
}

function doUninstall() {
  let removedHooks = 0;
  for (const hook of HOOKS) {
    const dst = path.join(HOOKS_TARGET, HOOK_PREFIX + hook);
    if (fs.existsSync(dst)) {
      fs.unlinkSync(dst);
      removedHooks++;
      if (!silent) console.log(`  removed hook: ${hook}`);
    }
  }

  let removedSkills = 0;
  for (const { dst } of SKILL_LINKS) {
    const dstPath = path.join(SKILLS_TARGET, dst);
    if (isOurSymlink(dstPath)) {
      fs.unlinkSync(dstPath);
      removedSkills++;
      if (!silent) console.log(`  removed skill: /${dst.replace(/\.md$/, "")}`);
    }
  }

  if (!silent) {
    console.log();
    console.log(
      `✓ atomic-cline uninstalled (${removedHooks} hooks, ${removedSkills} skills removed)`,
    );
    console.log(
      "  Note: .clinerules/ files in projects must be removed manually.",
    );
  }
}

if (uninstall) {
  doUninstall();
} else {
  doInstall();
}
