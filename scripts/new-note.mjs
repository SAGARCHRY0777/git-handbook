/**
 * Scaffold a page.
 *
 *   npm run note -- 2 "Recursion tree and choice diagram"
 *       -> content/av-02-recursion-tree-and-choice-diagram.md
 *          module: recursion-notes, order: 2, source: notes
 *          A VIDEO NOTE. Your own notes, from the source.
 *
 *   npm run note -- "Segment trees" structures
 *       -> content/segment-trees.md
 *          module: structures, next order, source: handbook
 *          A HANDBOOK PAGE. Synthesised material.
 *
 * The two kinds are kept apart deliberately. Notes taken first-hand from a
 * video carry different authority from a page written up afterwards, and
 * mixing them makes it impossible to tell later which is which.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const CONTENT = join(ROOT, "content");

const KNOWN_MODULES = [
  "start", "method", "recursion", "recursion-notes", "linear", "structures",
  "graphs", "search", "dp", "solutions", "reference",
];

const argv = process.argv.slice(2);
const USAGE = `usage:
  npm run note -- <video-number> "Title"     a video note (your own notes)
  npm run note -- "Title" [module]           a handbook page

modules: ${KNOWN_MODULES.join(", ")}

examples:
  npm run note -- 2 "Recursion tree and choice diagram"
  npm run note -- "Segment trees" structures`;

if (!argv.length) {
  console.error(USAGE);
  process.exit(1);
}

// A leading integer means "video note".
const isVideoNote = /^\d+$/.test(argv[0]);
const videoNum = isVideoNote ? Number(argv[0]) : null;
const rawTitle = isVideoNote ? argv[1] : argv[0];
const rawModule = isVideoNote ? "recursion-notes" : (argv[1] || "recursion");

if (!rawTitle) {
  console.error(USAGE);
  process.exit(1);
}
if (!KNOWN_MODULES.includes(rawModule)) {
  console.error(`unknown module "${rawModule}"\n\n${USAGE}`);
  process.exit(1);
}

const baseSlug = rawTitle
  .toLowerCase()
  .replace(/[^\w\s-]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .slice(0, 60);

const slug = isVideoNote
  ? `av-${String(videoNum).padStart(2, "0")}-${baseSlug}`
  : baseSlug;

const path = join(CONTENT, `${slug}.md`);
if (existsSync(path)) {
  console.error(`${slug}.md already exists -- edit it instead of recreating it`);
  process.exit(1);
}

// Video notes are ordered by video number so the series stays in sequence even
// if you watch them out of order. Handbook pages take the next free slot.
let order = videoNum;
if (!isVideoNote) {
  let maxOrder = 0;
  for (const file of readdirSync(CONTENT).filter((f) => f.endsWith(".md"))) {
    const raw = readFileSync(join(CONTENT, file), "utf8");
    const mod = /^module:\s*(\S+)/m.exec(raw)?.[1];
    const ord = Number(/^order:\s*(\d+)/m.exec(raw)?.[1] ?? 0);
    if (mod === rawModule && ord > maxOrder) maxOrder = ord;
  }
  order = maxOrder + 1;
}

const videoTemplate = `---
title: ${videoNum}. ${rawTitle}
slug: ${slug}
module: ${rawModule}
order: ${order}
status: draft
source: notes
level: video ${videoNum}
summary: Notes from video ${videoNum} of Aditya Verma's recursion playlist -- one line on what it taught.
---

# ${videoNum}. ${rawTitle}

> **Study notes from [Aditya Verma's](https://www.youtube.com/@TheAdityaVerma)
> recursion playlist**, video ${videoNum}. The method, the framing and the
> examples are his — this page is my write-up while working through it, kept
> here so I can revise from it. **Watch the original**; these notes are no
> substitute for it.
>
> Where these disagree with the handbook's
> [recursion pages](recursion-intro.html), **these win** — those were written
> without watching anything.

**Video:** <paste the link>
**Playlist:** https://www.youtube.com/playlist?list=PL_z_8CaSLPWeT1ffjiImo0sYTcnLzo-wY

---

## What he actually said

<in his framing, not mine. if he uses a specific phrase for something, keep
his phrase -- that is the thing you will recall later>

## The idea

<two sentences. if you cannot, you have not got it yet, and that is worth
knowing now rather than in an interview>

## Diagram

\`\`\`
<the tree, or the reduction. draw it for n=2 or n=3, never n=6>
\`\`\`

## Code

\`\`\`python
# typed from understanding, not copied from the screen
\`\`\`

## Why it works

<base case, and the one step. or: the choices, and where the tree bottoms out>

## What tripped me up

<the whole value of these notes is here. write what you got wrong, because
that is what you will get wrong again>

## Problems to do

| Problem | Source | Done | Day 7 |
|---|---|---|---|
|  |  |  |  |

---

## Stop condition

I have got this when I can:

1.
2.
3.
`;

const handbookTemplate = `---
title: ${rawTitle}
slug: ${slug}
module: ${rawModule}
order: ${order}
status: draft
level:
summary: One line describing what this page covers.
---

# ${rawTitle}

> **Recognition in one line:** <when do you reach for this?>

---

## 1 · Recognition cues

| Cue | Signal |
|---|---|
|  |  |

## 2 · The template

\`\`\`python
\`\`\`

## 3 · The ladder

| # | Problem | Source | The point |
|---|---|---|---|
| 1 |  |  |  |

## 4 · Worked example

## 5 · Failure modes

| Bug | Symptom | Fix |
|---|---|---|
|  |  |  |

## 6 · Interview questions

| Question | What to say |
|---|---|
|  |  |

---

## Stop condition

You know this pattern when you can:

1.
2.
`;

writeFileSync(path, isVideoNote ? videoTemplate : handbookTemplate);

console.log(`created content/${slug}.md`);
console.log(`  kind:   ${isVideoNote ? "VIDEO NOTE (yours)" : "handbook page"}`);
console.log(`  module: ${rawModule}   order: ${order}`);
console.log("");
console.log("  1. write it");
console.log("  2. flip  status: draft  ->  status: live");
console.log(`  3. npm run publish -- "notes: ${rawTitle}"`);
