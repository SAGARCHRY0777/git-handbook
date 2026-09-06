/**
 * Build, check, commit, push: npm run publish -- "commit message"
 *
 * One command so publishing a note is never a four-step ritual you skip.
 * It refuses to push a broken site rather than letting a bad link ship --
 * the link check exists because broken internal links have shipped here
 * before.
 */

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const DOCS = join(ROOT, "docs");

/** Run a command, or exit with its message rather than a Node stack dump. */
function run(cmd, args) {
  try {
    return execFileSync(cmd, args, {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const detail = (err.stderr || err.stdout || err.message || "").trim();
    console.error(`\nfailed: ${cmd} ${args.join(" ")}\n${detail}`);
    process.exit(1);
  }
}

const message = process.argv[2];
if (!message) {
  console.error('usage: npm run publish -- "what changed"');
  process.exit(1);
}

// 1. build. Invoke node on the build script directly rather than going through
//    npm -- on Windows npm is a .cmd and execFileSync cannot spawn it.
console.log("building…");
console.log(run(process.execPath, [join(ROOT, "scripts", "build.mjs")]).trim());

// 2. every internal link must resolve. A vacuous pass (no pages found) is
//    treated as failure -- an empty glob silently "passing" has bitten before.
const pages = readdirSync(DOCS).filter((f) => f.endsWith(".html"));
if (pages.length === 0) {
  console.error("no pages in docs/ -- refusing to publish");
  process.exit(1);
}

const broken = new Set();
for (const page of pages) {
  const html = readFileSync(join(DOCS, page), "utf8");
  for (const m of html.matchAll(/href="([a-z0-9-]+\.html)"/g)) {
    if (!existsSync(join(DOCS, m[1]))) broken.add(`${m[1]}  (linked from ${page})`);
  }
}
if (broken.size) {
  console.error(`\n${broken.size} broken link(s) -- refusing to publish:`);
  for (const b of broken) console.error("  " + b);
  process.exit(1);
}
console.log(`link check: ${pages.length} pages, 0 broken`);

// 3. anything to commit?
const status = run("git", ["status", "--porcelain"]).trim();
if (!status) {
  console.log("nothing changed -- nothing to publish");
  process.exit(0);
}

// 4. warn about drafts, but do not block: a draft still renders, it is just
//    badged, and half-finished notes are often worth pushing anyway.
const drafts = readdirSync(join(ROOT, "content"))
  .filter((f) => f.endsWith(".md"))
  .filter((f) => /^status:\s*draft/m.test(readFileSync(join(ROOT, "content", f), "utf8")));
if (drafts.length) {
  console.log(`note: ${drafts.length} page(s) still marked draft: ${drafts.join(", ")}`);
}

// 5. commit and push
run("git", ["add", "-A"]);
run("git", ["commit", "-m", message]);
const head = run("git", ["log", "--oneline", "-1"]).trim();
run("git", ["push", "origin", "main"]);
console.log(`\npushed: ${head}`);
console.log("live in ~1 min: https://sagarchry0777.github.io/dsa-handbook/");
