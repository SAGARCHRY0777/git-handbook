# Git Handbook

Git, GitHub and GitLab: the mental model, the state transitions, and how to get
out of trouble.

**Live site:** https://SAGARCHRY0777.github.io/git-handbook/

---

## What this is

Most git material is a command reference, and `git help` is already better at
that. This is the **model underneath** — the four areas, the object graph, and
the recovery paths — because those are what a reference cannot give you.

| Section | Contents |
|---|---|
| **How git actually works** | Blobs, trees, commits, refs — with real hashes from a real repo |
| **Everyday git** | The twelve commands that are 95% of usage |
| **Branching & merging** | Merge vs rebase, conflicts, strategies |
| **Undoing & recovery** | reset/revert/restore/checkout, and the reflog |
| **GitHub & GitLab** | PRs vs MRs, Actions vs GitLab CI, branch protection |
| **Reference** | One-page cheat sheet |

Every claim about git's behaviour was **executed against a real repository**.
The hashes and command outputs on these pages are real.

---

## Local development

```bash
npm ci
npm run build     # content/*.md -> docs/
npm run serve     # preview on http://localhost:4283
```

`docs/` is committed so GitHub Pages serves it from `main` / `/docs`. CI fails
the build if `docs/` was not rebuilt after a content change.

---

## Companion handbooks

| Repo | Covers |
|---|---|
| [dsa-handbook](https://github.com/SAGARCHRY0777/dsa-handbook) | Coding interviews |
| [system-design-handbook](https://github.com/SAGARCHRY0777/system-design-handbook) | The system design round |
| [llm-handbook](https://github.com/SAGARCHRY0777/llm-handbook) | LLM systems |
