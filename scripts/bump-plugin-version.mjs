#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const validBumps = new Set(["patch", "minor", "major", "set"]);
const args = process.argv.slice(2);
const bump = args[0] ?? "patch";
const dryRun = args.includes("--dry-run");

if (!validBumps.has(bump)) {
  console.error(
    `Invalid bump type: ${bump}. Use one of: ${Array.from(validBumps).join(", ")}`,
  );
  process.exit(1);
}

const root = process.cwd();
const filesToSync = [
  "plugin.json",
  "package.json",
  ".antigravity-plugin/manifest.json",
  ".claude-plugin/manifest.json",
  ".codex-plugin/manifest.json",
  ".cursor-plugin/manifest.json",
];

function parseSemver(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    return null;
  }
  return match.slice(1).map(Number);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const pluginPath = resolve(root, "plugin.json");
const plugin = readJson(pluginPath);

if (typeof plugin.version !== "string") {
  console.error("plugin.json is missing a valid version string.");
  process.exit(1);
}

const currentParts = parseSemver(plugin.version);
if (!currentParts) {
  console.error(
    `Unsupported version format '${plugin.version}'. Expected semantic version like 1.2.3`,
  );
  process.exit(1);
}

let nextVersion = "";
if (bump === "set") {
  const targetVersion = args[1];
  if (!targetVersion || !parseSemver(targetVersion)) {
    console.error("For 'set', provide a version like: node scripts/bump-plugin-version.mjs set 1.2.3");
    process.exit(1);
  }
  nextVersion = targetVersion;
} else {
  let [major, minor, patch] = currentParts;

  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  nextVersion = `${major}.${minor}.${patch}`;
}

const changes = [];
for (const relPath of filesToSync) {
  const absPath = resolve(root, relPath);
  const json = readJson(absPath);

  if (typeof json.version !== "string") {
    console.error(`${relPath} is missing a valid version string.`);
    process.exit(1);
  }

  const previous = json.version;
  json.version = nextVersion;

  if (!dryRun) {
    writeFileSync(absPath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  }

  changes.push({ relPath, previous, next: nextVersion });
}

const modeLabel = dryRun ? "[dry-run]" : "[updated]";
console.log(`${modeLabel} version sync ${plugin.version} -> ${nextVersion}`);
for (const change of changes) {
  console.log(`${modeLabel} ${change.relPath}: ${change.previous} -> ${change.next}`);
}
