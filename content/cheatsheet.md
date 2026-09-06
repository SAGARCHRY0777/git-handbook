---
title: The cheat sheet
slug: cheatsheet
module: reference
order: 90
status: live
level: print this
summary: One page — the transitions, the commands you actually use, the panic table, and the config that prevents problems.
---

# The cheat sheet

---

## 1 · The four areas

```
  working directory  --add-->  staging  --commit-->  local repo  --push-->  remote
         ^                        |                      |                     |
         |<--restore <file>-------|                      |                     |
         |<--restore --staged-----|                      |                     |
         |<---------------- reset --hard ----------------|                     |
                                                         |<------ fetch -------|
```

**Every command is a move between two of these. When confused, ask which two.**

---

## 2 · Daily

```bash
git status                      # what state am I in            <- use constantly
git status -sb                  # compact
git add <file>                  # stage one file
git add -p                      # stage HUNK BY HUNK            <- underused
git commit -m "msg"
git commit --amend --no-edit    # fold into the last commit
git log --oneline --graph --all # see the actual shape
git diff                        # working vs staged
git diff --staged               # staged vs last commit
git push
git pull --rebase               # avoid pointless merge commits
git fetch                       # ALWAYS safe -- updates cache only
```

> **`git add -p` is the most underused command in git.** It walks you through
> each change and asks whether to stage it, which is how you turn one messy
> working directory into three clean commits.

---

## 3 · Branching

```bash
git switch -c feature           # create + switch      (modern)
git switch main                 # switch              (modern)
git checkout -b feature         # same thing          (older, still fine)

git branch                      # list local
git branch -vv                  # + tracking + last commit
git branch -d feature           # delete (safe: refuses if unmerged)
git branch -D feature           # delete (force)

git merge feature
git merge --no-ff feature       # force a merge commit
git rebase main
git rebase -i HEAD~4            # squash/reword/drop -- needs a real terminal
git cherry-pick <sha>
```

> **`switch` and `restore` exist because `checkout` did too much.** `checkout`
> changed branches *and* restored files, which is why it was confusing. New code
> should use `switch` for branches and `restore` for files.

---

## 4 · The panic table

| Situation | Command |
|---|---|
| Discard edits to a file | `git restore <file>` |
| Unstage, keep edits | `git restore --staged <file>` |
| Undo last commit, keep changes staged | `git reset --soft HEAD~1` |
| Undo last commit, keep changes unstaged | `git reset HEAD~1` |
| Undo last commit, **discard changes** | `git reset --hard HEAD~1` ⚠️ |
| **Undo a pushed commit** | `git revert <sha>` |
| Fix the last commit message | `git commit --amend` |
| Park work for a moment | `git stash` → `git stash pop` |
| Stash including untracked | `git stash -u` |
| Abort a merge | `git merge --abort` |
| Abort a rebase | `git rebase --abort` |
| **Find anything you "lost"** | `git reflog` |
| Restore a deleted branch | `git reflog` → `git branch <name> <sha>` |
| Who changed this line | `git blame <file>` |
| Which commit broke it | `git bisect start` / `good` / `bad` |
| Last resort | `git fsck --lost-found` |

> **`git reflog` first, panic second.** Anything committed is recoverable for
> ~90 days. The only unrecoverable loss is work that was never committed.

---

## 5 · Remotes

```bash
git remote -v
git remote add origin <url>
git fetch origin                       # safe: updates origin/* only
git pull                               # fetch + merge
git pull --rebase                      # fetch + rebase (cleaner history)
git push -u origin main                # push and set upstream
git push --force-with-lease            # ✅ safe force
git push --force                       # ⚠️ never
git push origin --delete old-branch
```

**`origin/main` is a cache**, updated only by fetch. It can be stale.

---

## 6 · Inspecting

```bash
git log --oneline --graph --all --decorate
git log -p <file>               # history WITH diffs
git log --author="name"
git log --since="2 weeks ago"
git log -S "someString"         # commits that ADDED/REMOVED that string  <- gold
git show <sha>
git diff main..feature
git diff --stat
git blame -L 10,20 <file>
```

> **`git log -S` is the best debugging command in git.** It finds the commit
> that introduced or removed a specific string — far more useful than scrolling
> through history when you are asking "when did this line appear?"

---

## 7 · Config worth setting once

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

git config --global init.defaultBranch main
git config --global pull.rebase true          # no accidental merge commits
git config --global rerere.enabled true       # remember conflict resolutions
git config --global fetch.prune true          # drop deleted remote branches

# make the safe force-push easy to reach
git config --global alias.pushf "push --force-with-lease"
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.st "status -sb"
```

**On Windows**, line endings cause the constant `LF will be replaced by CRLF`
warnings:

```bash
git config --global core.autocrlf true        # Windows
git config --global core.autocrlf input       # macOS / Linux
```

Better still, commit a `.gitattributes` so the repo decides rather than each
machine:

```
* text=auto
*.sh text eol=lf
*.png binary
```

---

## 8 · GitHub / GitLab quick map

| Concept | GitHub | GitLab |
|---|---|---|
| Change proposal | **Pull request (PR)** | **Merge request (MR)** |
| CI config | `.github/workflows/*.yml` | `.gitlab-ci.yml` |
| CI runner unit | job in a workflow | job in a stage |
| Packages | Packages | Package Registry |
| Issue boards | Projects | Issues + Boards |
| Protected branch | Branch protection / rulesets | Protected branches |
| Code owners | `CODEOWNERS` | `CODEOWNERS` |
| Static site | GitHub Pages | GitLab Pages |
| Secrets | Actions secrets | CI/CD variables |

```bash
gh pr create --fill            # GitHub CLI
gh pr checkout 123
gh run list
glab mr create --fill          # GitLab CLI
```

---

## 9 · The habits that prevent most trouble

```
[ ] git status before and after anything unfamiliar
[ ] Commit early -- uncommitted work is the ONLY unrecoverable work
[ ] Small commits, one idea each; git add -p makes this easy
[ ] Never force-push shared branches; --force-with-lease when you must
[ ] Pull before you start, not after you finish
[ ] Branch names that say what and why: fix/login-timeout
[ ] Read the merge message before hitting enter
[ ] git log --graph occasionally, so the shape stays familiar
```
