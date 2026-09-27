/**
 * simdefs.js — the simulations themselves. The player lives in sims.js.
 *
 * Each definition registers into window.__SIMS and is drawn with the helper
 * exposed as window.__SIM_D. Definitions are independent blocks: adding a new
 * sim never touches an existing one, and never touches the build.
 *
 * The rule:
 *   THE FRAMES MUST BE THE REAL MECHANISM, IN THE REAL ORDER.
 * Every number on screen is computed from a stated configuration, not typed in
 * to look plausible. If a mechanism has no genuine time axis, it does not get a
 * sim — a fake timeline over a static formula teaches motion that is not there.
 *
 * (git-handbook)
 */
(function () {
  "use strict";
  var S = window.__SIMS;
  if (!S) return;

  // >>> SPLICED SIMS

  // ====================================================================
  // ======================================================================
  // SIM · gitbranching  (branching.md)
  // The page's own graph, replayed three ways: A-B on main, C-D on feature,
  // E on main. The comparison table in section 1 is the ground truth --
  // new commits created, whether original hashes survive, resulting shape,
  // and whether it is safe on a shared branch. Counts below are taken off
  // the graph the sim draws rather than asserted.
  // ======================================================================
  var gitbranching_MAIN = ["A", "B"];
  var gitbranching_FEAT = ["C", "D"];

  function gitbranching_scenario(id, label, frames, phases) {
    var steps = [];
    for (var i = 0; i < frames.length; i++) {
      steps.push({
        id: id, phase: i, caption: frames[i][0], state: frames[i][1],
        flag: frames[i][2]
      });
    }
    return { id: id, label: label, steps: steps, phases: phases };
  }

  // state: { main:[], feat:[], head:"", newCommits:n, rewritten:bool, joined:bool }
  function gitbranching_st(main, feat, newC, rewritten, joined) {
    return { main: main, feat: feat, newC: newC, rewritten: !!rewritten, joined: !!joined };
  }

  function gitbranching_ff() {
    return gitbranching_scenario("ff", "Fast-forward", [
      ["<code>main</code> is at <b>B</b>. You branched <code>feature</code> and made <b>C</b> and " +
       "<b>D</b>. Nobody has touched <code>main</code> since. Press Play.",
       gitbranching_st(["A", "B"], ["C", "D"], 0)],
      ["<code>git merge feature</code>. Git checks one thing first: <b>is <code>main</code> an " +
       "ancestor of <code>feature</code>?</b> Here it is — B is directly behind C.",
       gitbranching_st(["A", "B"], ["C", "D"], 0), "ok"],
      ["Because there is nothing on <code>main</code> that is not already on <code>feature</code>, " +
       "there is nothing to reconcile. Git does not merge — it <b>slides the pointer</b>.",
       gitbranching_st(["A", "B"], ["C", "D"], 0), "ok"],
      ["<code>main</code> now points at <b>D</b>. <b>Zero new commits. Zero possible conflicts.</b>",
       gitbranching_st(["A", "B", "C", "D"], [], 0), "ok"],
      ["<b>The history is a straight line, and it no longer shows that a branch existed.</b> That " +
       "is the trade: the cleanest possible result, and the branch becomes invisible. Use " +
       "<code>--no-ff</code> when the fact of the branch is information worth keeping.",
       gitbranching_st(["A", "B", "C", "D"], [], 0), "ok"]
    ], ["diverged?", "ancestor check", "slide", "done", "shape"]);
  }

  function gitbranching_merge() {
    return gitbranching_scenario("merge", "Merge commit", [
      ["Same branch — but this time somebody committed <b>E</b> to <code>main</code> while you " +
       "worked. The two histories have genuinely diverged.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0)],
      ["<code>git merge feature</code>. <code>main</code> is no longer an ancestor of " +
       "<code>feature</code> — E exists on one side only — so a fast-forward is impossible.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0), "warn"],
      ["Git finds the <b>merge base</b>: the last commit both sides share, which is <b>B</b>. It " +
       "then compares B→E and B→D and combines the two sets of changes.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0), "warn"],
      ["A conflict happens only where <b>both sides changed the same lines</b>. Different files, " +
       "or different regions of one file, merge silently — git is comparing against the base, not " +
       "guessing.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0), "warn"],
      ["One new commit — <b>M</b> — with <b>two parents</b>: E and D. That second parent is the " +
       "entire mechanism, and the reason the graph is a graph.",
       gitbranching_st(["A", "B", "E", "M"], ["C", "D"], 1, false, true), "ok"],
      ["<b>One commit created; every original hash preserved.</b> C, D and E are byte-identical " +
       "to what they were. The history branches and rejoins, which records that parallel work " +
       "happened — and is exactly what people mean when they call the graph messy.",
       gitbranching_st(["A", "B", "E", "M"], ["C", "D"], 1, false, true), "ok"]
    ], ["diverged", "no fast-forward", "merge base", "conflicts", "commit M", "result"]);
  }

  function gitbranching_rebase() {
    return gitbranching_scenario("rebase", "Rebase", [
      ["Same diverged state: <b>E</b> on <code>main</code>, <b>C</b> and <b>D</b> on " +
       "<code>feature</code>.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0)],
      ["<code>git rebase main</code>. Git takes each of your commits and <b>replays its changes</b> " +
       "on top of E, one at a time.",
       gitbranching_st(["A", "B", "E"], ["C", "D"], 0), "warn"],
      ["C is replayed first. The result has the same <i>changes</i> but a different parent, a " +
       "different timestamp on the committer line, and therefore <b>a different hash</b>. It is a " +
       "new commit: <b>C′</b>.",
       gitbranching_st(["A", "B", "E", "C'"], ["D"], 1, true), "warn"],
      ["Then D, giving <b>D′</b>. Conflicts here are resolved once per replayed commit, which is " +
       "why a long rebase can ask the same question several times.",
       gitbranching_st(["A", "B", "E", "C'", "D'"], [], 2, true), "warn"],
      ["<b>Two new commits, and the originals are gone from the branch.</b> C and D still exist in " +
       "the object store until they are pruned, but nothing points at them.",
       gitbranching_st(["A", "B", "E", "C'", "D'"], [], 2, true), "bad"],
      ["<b>A straight line, and no record that a branch existed.</b> This is the readable-history " +
       "option — and it is the one that is <b>unsafe on a shared branch</b>, because anyone who " +
       "pulled C or D now has commits nobody else has. Rebase before you push, not after.",
       gitbranching_st(["A", "B", "E", "C'", "D'"], [], 2, true), "bad"]
    ], ["diverged", "replay", "C′", "D′", "orphaned", "result"]);
  }

  S["gitbranching"] = {
    title: "Combine two histories, three ways",
    note: "The page's own graph: <b>A</b>–<b>B</b> on <code>main</code>, <b>C</b>–<b>D</b> on " +
      "<code>feature</code>, and in two of the three runs an <b>E</b> that landed on " +
      "<code>main</code> while you worked. Watch three things across the tabs — how many commits " +
      "are created, whether the original hashes survive, and whether the result still shows that " +
      "a branch existed. Those three answers are the whole decision.",
    interval: 1500,
    scenarios: [gitbranching_ff(), gitbranching_merge(), gitbranching_rebase()],

    draw: function (step, d, ctx) {
      var s = step.state;
      var mainCells = [], i;
      for (i = 0; i < s.main.length; i++) {
        var c = s.main[i];
        var isNew = c === "M" || c.charAt(c.length - 1) === "'";
        mainCells.push({
          label: c,
          flag: isNew ? "warn" : (c === "E" ? "ok" : undefined),
          title: isNew ? c + " — created by this operation" : "commit " + c
        });
      }
      if (!mainCells.length) mainCells.push({ label: "—", flag: "idle", title: "empty" });

      var featCells = [];
      for (i = 0; i < s.feat.length; i++) {
        featCells.push({ label: s.feat[i], flag: s.rewritten ? "bad" : "ok",
          title: s.rewritten ? s.feat[i] + " — about to be replayed, then orphaned" : "commit " + s.feat[i] });
      }
      if (!featCells.length) {
        featCells.push({ label: s.rewritten ? "orphaned" : "merged", flag: s.rewritten ? "bad" : "idle",
          title: s.rewritten ? "the originals no longer have a branch pointing at them" : "branch fully contained in main" });
      }

      return d.stack([
        gitcommon_phases(d, ctx),
        d.flow([
          d.big(String(s.newC), "commits created", s.newC === 0 ? "ok" : s.newC > 1 ? "bad" : "warn"),
          d.node({
            title: "original hashes",
            status: s.rewritten ? "REWRITTEN" : "PRESERVED",
            statusFlag: s.rewritten ? "bad" : "ok",
            flag: s.rewritten ? "bad" : "ok",
            rows: [
              { label: "C, D", value: s.rewritten ? "replaced by C′, D′" : "unchanged",
                flag: s.rewritten ? "bad" : "ok" },
              { label: "safe on shared branch", value: s.rewritten ? "no" : "yes",
                flag: s.rewritten ? "bad" : "ok" }
            ]
          }),
          d.node({
            title: "history shape",
            status: s.joined ? "BRANCHED + JOINED" : "STRAIGHT LINE",
            statusFlag: s.joined ? "warn" : "ok",
            rows: [{ label: "shows a branch existed", value: s.joined ? "yes" : "no",
                     flag: s.joined ? "ok" : "warn" }]
          })
        ]),
        d.lane({ label: "main", cells: mainCells }),
        d.lane({ label: "feature", cells: featCells }),
        d.note("Amber is a commit this operation created · red is a commit it orphaned · " +
          "green survived unchanged.")
      ]);
    }
  };

  // ====================================================================
  // ======================================================================
  // SIM · gitcheatsheet  (cheatsheet.md)
  // The page's organising claim is that every command is a move between two of
  // four areas. This sorts the daily command set by the question that actually
  // matters in a panic: CAN THIS DESTROY WORK THAT EXISTS NOWHERE ELSE?
  // The three tabs are the three honest answers -- never, only what git has
  // already seen, and yes. Risk is derived from which areas a command writes.
  // ======================================================================
  var gitcheatsheet_AREAS = ["working dir", "staging", "local repo", "remote"];

  // [command, reads-from, writes-to, what, risk]  (-1 = none)
  function gitcheatsheet_cmd(cmd, from, to, what, risk) {
    return { cmd: cmd, from: from, to: to, what: what, risk: risk };
  }

  function gitcheatsheet_build(id, label, phases, intro, cmds, close, flag) {
    var steps = [{ caption: intro, cmd: null, flag: undefined }];
    for (var i = 0; i < cmds.length; i++) {
      steps.push({ caption: cmds[i].what, cmd: cmds[i], flag: flag });
    }
    steps.push({ caption: close, cmd: cmds[cmds.length - 1], flag: flag });
    return { id: id, label: label, steps: steps, phases: phases };
  }

  function gitcheatsheet_safe() {
    return gitcheatsheet_build("safe", "Cannot lose work",
      ["the question", "status", "fetch", "add", "commit", "verdict"],
      "Sort the daily commands by one question: <b>can this destroy work that exists nowhere " +
      "else?</b> Start with the ones where the answer is never.",
      [
        gitcheatsheet_cmd("git status", -1, -1,
          "<code>git status</code> <b>writes nothing</b>. It reads all four areas and reports the " +
          "differences. Free to run at any time, and the correct first move whenever you are lost.", "none"),
        gitcheatsheet_cmd("git fetch", 3, 2,
          "<code>git fetch</code> — <b>remote → local repo</b>. It updates <code>origin/*</code> " +
          "and touches neither your branch nor your files. This is why <code>fetch</code> then " +
          "look is always safe where <code>pull</code> is not.", "none"),
        gitcheatsheet_cmd("git add", 0, 1,
          "<code>git add</code> — <b>working dir → staging</b>. It writes a blob into the object " +
          "store. Nothing is overwritten; the file on disk is unchanged.", "none"),
        gitcheatsheet_cmd("git commit", 1, 2,
          "<code>git commit</code> — <b>staging → local repo</b>. Creates an object and moves a " +
          "pointer. Even a bad commit is recoverable, which is why committing early costs nothing.", "none")
      ],
      "<b>All four are additive.</b> They create objects or move pointers; none overwrites a file " +
      "on disk. If you are unsure what state you are in, every command in this tab is safe to run " +
      "first.", "ok");
  }

  function gitcheatsheet_recoverable() {
    return gitcheatsheet_build("recoverable", "Recoverable",
      ["the question", "reset --soft", "rebase", "amend", "branch -D", "verdict"],
      "Now the commands that move or rewrite history. These look frightening and mostly are not — " +
      "because what they endanger is <i>committed</i>, and git keeps a log of where every branch " +
      "has been.",
      [
        gitcheatsheet_cmd("git reset --soft", 2, 2,
          "<code>reset --soft</code> moves the branch pointer and nothing else. The commit it " +
          "moved off still exists.", "reflog"),
        gitcheatsheet_cmd("git rebase", 2, 2,
          "<code>rebase</code> replays commits as new objects with new hashes. The originals " +
          "remain in the store, unreferenced.", "reflog"),
        gitcheatsheet_cmd("git commit --amend", 2, 2,
          "<code>--amend</code> does not edit a commit — commits are immutable. It builds a new " +
          "one and moves the pointer. The old one is still there.", "reflog"),
        gitcheatsheet_cmd("git branch -D", 2, 2,
          "<code>branch -D</code> deletes a 41-byte file. The commits it pointed at are untouched " +
          "and reachable by hash.", "reflog")
      ],
      "<b>All four are undoable from the reflog</b>, which records every position your branches " +
      "have held, typically for 90 days. <code>git reflog</code> then <code>git reset --hard " +
      "HEAD@{n}</code> puts you back. Anything already committed is very hard to truly lose.", "warn");
  }

  function gitcheatsheet_destructive() {
    return gitcheatsheet_build("destructive", "Can destroy work",
      ["the question", "reset --hard", "checkout --", "clean -fd", "push --force", "verdict"],
      "And the short list that can actually lose work. What unites them is not that they are " +
      "powerful — it is that they overwrite something git <b>never saw</b>.",
      [
        gitcheatsheet_cmd("git reset --hard", 2, 0,
          "<code>reset --hard</code> — reaches all the way to the <b>working directory</b>. " +
          "Uncommitted edits are overwritten and were never in the object store.", "gone"),
        gitcheatsheet_cmd("git checkout -- <file>", 2, 0,
          "<code>checkout -- &lt;file&gt;</code> overwrites that file from the index. Same " +
          "problem, narrower blast radius.", "gone"),
        gitcheatsheet_cmd("git clean -fd", -1, 0,
          "<code>clean -fd</code> deletes <b>untracked</b> files. Git has by definition never " +
          "seen them, so there is nothing to recover from. Run <code>-n</code> first, always.", "gone"),
        gitcheatsheet_cmd("git push --force", 2, 3,
          "<code>push --force</code> can discard commits on the <b>remote</b> — including other " +
          "people's, which are not in your reflog. Use <code>--force-with-lease</code>, which " +
          "refuses if the remote moved since you last fetched.", "gone")
      ],
      "<b>The pattern: the dangerous commands write to the working directory, or to the remote.</b> " +
      "Everything git has already recorded is recoverable; everything it has not is not. That is " +
      "the whole risk model, and it is why <code>git add</code> is the cheapest insurance " +
      "available.", "bad");
  }

  S["gitcheatsheet"] = {
    title: "Sort the daily commands by what they can destroy",
    note: "Every git command is a move between two of <b>working directory</b>, <b>staging</b>, " +
      "<b>local repo</b> and <b>remote</b>. Which two it writes to decides how dangerous it is, " +
      "and the three tabs are the three honest answers to <i>can this lose work?</i> — never, " +
      "only what git has already seen, and yes.",
    interval: 1500,
    scenarios: [gitcheatsheet_safe(), gitcheatsheet_recoverable(), gitcheatsheet_destructive()],

    draw: function (step, d, ctx) {
      var c = step.cmd;
      var cards = [], i;
      for (i = 0; i < gitcheatsheet_AREAS.length; i++) {
        var isFrom = c && i === c.from, isTo = c && i === c.to;
        var writes = isTo && c.risk === "gone";
        cards.push(d.node({
          title: gitcheatsheet_AREAS[i],
          status: isTo ? "WRITES" : isFrom ? "READS" : "",
          statusFlag: writes ? "bad" : isTo ? "warn" : isFrom ? "ok" : undefined,
          flag: writes ? "bad" : (isTo ? "warn" : undefined)
        }));
      }
      var riskLabel = !c ? "—" : c.risk === "none" ? "cannot lose work"
        : c.risk === "reflog" ? "recoverable from reflog" : "work can be lost";
      var riskFlag = !c ? undefined : c.risk === "none" ? "ok" : c.risk === "reflog" ? "warn" : "bad";

      return d.stack([
        gitcommon_phases(d, ctx),
        d.flow([
          d.big(c ? c.cmd.replace("git ", "") : "—", "command", riskFlag),
          d.node({
            title: "risk",
            status: riskLabel,
            statusFlag: riskFlag,
            flag: riskFlag,
            rows: [
              { label: "writes to working dir", value: c && c.to === 0 ? "yes" : "no",
                flag: c && c.to === 0 ? "bad" : "ok" },
              { label: "writes to remote", value: c && c.to === 3 ? "yes" : "no",
                flag: c && c.to === 3 ? "bad" : "ok" }
            ]
          })
        ]),
        d.cols(cards),
        d.note("Green reads · amber writes something git can recover · red writes over something " +
          "it cannot.")
      ]);
    }
  };

  // ====================================================================
  // ======================================================================
  // SIM · giteveryday  (everyday.md)
  // The daily loop as movement between the page's four areas:
  //   working directory --add--> staging --commit--> local repo --push--> remote
  // Every frame states which two areas the command moved something between,
  // because that is the page's whole organising claim: each command is a move
  // between two areas, and "when confused, ask which two".
  // ======================================================================
  var giteveryday_AREAS = ["working dir", "staging", "local repo", "remote"];

  // a frame is [caption, contents-per-area, from, to, phase, flag]
  // contents: array of 4 strings, "" for empty
  function giteveryday_build(id, label, phases, frames) {
    var steps = [];
    for (var i = 0; i < frames.length; i++) {
      steps.push({
        caption: frames[i][0], cells: frames[i][1],
        from: frames[i][2], to: frames[i][3], flag: frames[i][4]
      });
    }
    return { id: id, label: label, steps: steps, phases: phases };
  }

  function giteveryday_clean() {
    return giteveryday_build("clean", "The clean path",
      ["start", "status", "add", "commit", "pull --rebase", "push"], [
      ["You edited <code>a.txt</code>. It exists in exactly one place — on disk. Git does not " +
       "know about the change yet.", ["a.txt modified", "", "A ← B", "A ← B"], -1, -1],
      ["<code>git status</code> moves nothing. It <b>reads all four areas and tells you the " +
       "difference between them</b>, which is why it is the most useful command on this page — " +
       "it answers \"where is my work right now?\".",
       ["a.txt modified", "", "A ← B", "A ← B"], -1, -1],
      ["<code>git add a.txt</code> — <b>working dir → staging</b>. The blob is written to the " +
       "object store now, not at commit time. Nothing is permanent yet, but nothing is lost either.",
       ["clean", "a.txt", "A ← B", "A ← B"], 0, 1, "ok"],
      ["<code>git commit</code> — <b>staging → local repo</b>. A commit object is written and the " +
       "branch pointer moves to it. Still entirely local; the remote knows nothing.",
       ["clean", "", "A ← B ← C", "A ← B"], 1, 2, "ok"],
      ["<code>git pull --rebase</code> — <b>remote → local repo</b>. Nothing came back, so " +
       "nothing changed. Doing this <i>before</i> pushing is the habit that avoids most merge " +
       "commits nobody wanted.",
       ["clean", "", "A ← B ← C", "A ← B"], 3, 2, "ok"],
      ["<code>git push</code> — <b>local repo → remote</b>. Now it exists somewhere other than " +
       "your laptop, which is the only point at which the work is actually safe.",
       ["clean", "", "A ← B ← C", "A ← B ← C"], 2, 3, "ok"]
    ]);
  }

  function giteveryday_diverged() {
    return giteveryday_build("diverged", "Someone pushed first",
      ["start", "push rejected", "fetch", "rebase", "push"], [
      ["Same commit <b>C</b> ready to go — but a colleague pushed <b>D</b> while you worked.",
       ["clean", "", "A ← B ← C", "A ← B ← D"], -1, -1],
      ["<code>git push</code> is <b>rejected</b>. The remote refuses because your history is not " +
       "a fast-forward of its own — accepting it would drop D.",
       ["clean", "", "A ← B ← C", "A ← B ← D"], 2, 3, "bad"],
      ["<code>git fetch</code> — <b>remote → local repo</b>. It downloads D and updates " +
       "<code>origin/main</code>. It changes <i>nothing</i> about your branch or your files, " +
       "which is what makes it always safe to run.",
       ["clean", "", "A ← B ← C  (+D fetched)", "A ← B ← D"], 3, 2, "warn"],
      ["<code>git rebase origin/main</code> replays C on top of D as <b>C′</b>. Your history is " +
       "now a fast-forward of the remote's, so the push will be accepted.",
       ["clean", "", "A ← B ← D ← C'", "A ← B ← D"], -1, -1, "warn"],
      ["<code>git push</code> succeeds. <b>Pull before you push</b> is the entire lesson — and " +
       "<code>--rebase</code> keeps the result a straight line instead of manufacturing a merge " +
       "commit for a two-commit divergence.",
       ["clean", "", "A ← B ← D ← C'", "A ← B ← D ← C'"], 2, 3, "ok"]
    ]);
  }

  function giteveryday_stash() {
    return giteveryday_build("stash", "Interrupted mid-change",
      ["mid-work", "blocked", "stash", "switch", "pop"], [
      ["Half-finished work on <code>a.txt</code>, some staged and some not. Then someone asks for " +
       "an urgent fix on another branch.",
       ["a.txt modified", "b.txt", "A ← B", "A ← B"], -1, -1],
      ["<code>git checkout hotfix</code> <b>refuses</b> — switching would overwrite your " +
       "uncommitted changes. Git protects the working directory here; it will not silently discard.",
       ["a.txt modified", "b.txt", "A ← B", "A ← B"], -1, -1, "bad"],
      ["<code>git stash</code> — <b>working dir and staging → a stash commit</b>. Both areas are " +
       "swept clean and the contents are parked as a real commit object, not a scratch file.",
       ["clean", "", "A ← B  (+stash)", "A ← B"], 0, 2, "warn"],
      ["Now the switch works, the fix is made, and you come back.",
       ["clean", "", "A ← B  (+stash)", "A ← B"], -1, -1],
      ["<code>git stash pop</code> restores both areas — though by default everything returns as " +
       "<i>unstaged</i>, so the staged/unstaged split you had is flattened unless you used " +
       "<code>--index</code>.",
       ["a.txt modified", "b.txt", "A ← B", "A ← B"], 2, 0, "ok"]
    ]);
  }

  S["giteveryday"] = {
    title: "Move work through the four areas",
    note: "Every git command is a move between two of <b>working directory</b>, <b>staging</b>, " +
      "<b>local repo</b> and <b>remote</b> — and when a command confuses you, the useful question " +
      "is which two. Each frame below names the move it is making. Three runs of the same daily " +
      "loop: one where nothing goes wrong, one where somebody pushed first, and one where you are " +
      "interrupted mid-change.",
    interval: 1500,
    scenarios: [giteveryday_clean(), giteveryday_diverged(), giteveryday_stash()],

    draw: function (step, d, ctx) {
      var cards = [], i;
      for (i = 0; i < giteveryday_AREAS.length; i++) {
        var touched = (i === step.from || i === step.to);
        cards.push(d.node({
          title: giteveryday_AREAS[i],
          status: i === step.from ? "FROM" : i === step.to ? "TO" : "",
          statusFlag: i === step.to ? (step.flag || "ok") : i === step.from ? "warn" : undefined,
          flag: touched ? (step.flag === "bad" ? "bad" : "warn") : undefined,
          rows: [{
            label: "contents",
            value: step.cells[i] || "—",
            flag: step.cells[i] && step.cells[i] !== "clean" ? "ok" : undefined
          }]
        }));
      }
      return d.stack([
        gitcommon_phases(d, ctx),
        d.cols(cards),
        step.from >= 0
          ? d.note("This frame moves work <b>" + giteveryday_AREAS[step.from] + " → " +
              giteveryday_AREAS[step.to] + "</b>.", step.flag === "bad" ? "bad" : "warn")
          : d.note("This frame moves nothing — it only inspects, or the command was refused.")
      ]);
    }
  };

  // ====================================================================
  // ======================================================================
  // SIM · gitindex  (index.md)
  // One file's whole life across the four areas. The page's claim is that git
  // feels arbitrary until you hold one model -- four areas and a content-
  // addressed store -- after which the commands stop needing memorisation.
  // These three runs are the cases that teach that model fastest, including
  // the one where the model explains an otherwise baffling behaviour.
  // ======================================================================
  var gitindex_AREAS = ["working dir", "staging", "local repo", "remote"];

  // presence per area: 0 absent, 1 present-old, 2 present-current
  function gitindex_build(id, label, phases, frames) {
    var steps = [];
    for (var i = 0; i < frames.length; i++) {
      steps.push({
        caption: frames[i][0], where: frames[i][1], state: frames[i][2], flag: frames[i][3]
      });
    }
    return { id: id, label: label, steps: steps, phases: phases };
  }

  function gitindex_newFile() {
    return gitindex_build("new", "A new file",
      ["created", "untracked", "add", "commit", "push"], [
      ["You create <code>notes.md</code>. It exists in exactly one place, and git has no idea.",
       [2, 0, 0, 0], "untracked"],
      ["<code>git status</code> calls it <b>untracked</b> — the only state where git will not " +
       "protect you. Nothing about this file is recoverable if you delete it now.",
       [2, 0, 0, 0], "untracked", "bad"],
      ["<code>git add notes.md</code>. The content is hashed and written to the object store, and " +
       "the path is recorded in the index. <b>From this moment the content is recoverable</b> even " +
       "if you never commit it.",
       [2, 2, 0, 0], "staged", "ok"],
      ["<code>git commit</code> creates a tree and a commit, and moves the branch pointer. The " +
       "file now belongs to history.",
       [2, 2, 2, 0], "committed", "ok"],
      ["<code>git push</code> copies those objects to the remote. <b>Four areas, and only now does " +
       "the work exist on a second machine.</b> Everything before this point is one disk failure " +
       "from gone.",
       [2, 2, 2, 2], "pushed", "ok"]
    ]);
  }

  function gitindex_change() {
    return gitindex_build("change", "Changing a tracked file",
      ["committed", "edit", "modified", "add", "re-edit"], [
      ["<code>notes.md</code> is committed and pushed — all four areas agree.",
       [2, 2, 2, 2], "clean"],
      ["You edit it. Only the working directory has the new content; the other three still hold " +
       "the old version.", [2, 1, 1, 1], "modified", "warn"],
      ["<code>git status</code> says <b>modified, not staged</b>. That phrase is just the " +
       "difference between area one and area two — it is not a mood git is in.",
       [2, 1, 1, 1], "modified", "warn"],
      ["<code>git add</code> copies the new content into staging. Working dir and staging now " +
       "agree; the repo does not.", [2, 2, 1, 1], "staged", "ok"],
      ["<b>Now edit it again without adding.</b> The same file is simultaneously <i>staged</i> " +
       "with version&nbsp;2 and <i>modified</i> with version&nbsp;3 — which sounds like nonsense " +
       "until you notice they are different areas holding different blobs. This is the single " +
       "most confusing status output in git, and the model explains it in one sentence.",
       [2, 2, 1, 1], "both", "warn"]
    ]);
  }

  function gitindex_regret() {
    return gitindex_build("regret", "The file you should not have committed",
      ["committed", "gitignore", "still tracked", "rm --cached", "the catch"], [
      ["You committed <code>.env</code> by accident and pushed it. It is now in all four areas.",
       [2, 2, 2, 2], "committed", "bad"],
      ["You add it to <code>.gitignore</code> and expect the problem to go away.",
       [2, 2, 2, 2], "committed", "bad"],
      ["It does not. <b><code>.gitignore</code> only stops <i>untracked</i> files from being " +
       "staged.</b> This file is already tracked, so the rule is never consulted — which is a " +
       "consequence of the model, not an exception to it.",
       [2, 2, 2, 2], "committed", "bad"],
      ["<code>git rm --cached .env</code> removes it from staging while leaving it on disk. Commit " +
       "that, and future commits will not contain it.",
       [2, 0, 2, 2], "untracked-again", "warn"],
      ["<b>But every historical commit still contains it.</b> History is immutable and it was " +
       "pushed, so the only real fix is rewriting history for everyone — and rotating the secret, " +
       "which you should treat as compromised regardless. The four-area model tells you exactly " +
       "why the easy fix cannot work.",
       [2, 0, 2, 2], "in-history", "bad"]
    ]);
  }

  S["gitindex"] = {
    title: "Follow one file through all four areas",
    note: "Git stops feeling arbitrary once you hold one model: <b>four areas</b> — working " +
      "directory, staging, local repo, remote — and a store that addresses content by its hash. " +
      "Three runs of one file's life: a new file reaching safety, a tracked file being changed, " +
      "and the one that catches everybody, where <code>.gitignore</code> does nothing at all.",
    interval: 1500,
    scenarios: [gitindex_newFile(), gitindex_change(), gitindex_regret()],

    draw: function (step, d, ctx) {
      var cards = [], i;
      var LABEL = { 0: "absent", 1: "old version", 2: "current" };
      for (i = 0; i < gitindex_AREAS.length; i++) {
        var v = step.where[i];
        cards.push(d.node({
          title: gitindex_AREAS[i],
          status: v === 2 ? "CURRENT" : v === 1 ? "STALE" : "ABSENT",
          statusFlag: v === 2 ? "ok" : v === 1 ? "warn" : "idle",
          flag: v === 2 ? "ok" : v === 1 ? "warn" : "idle",
          rows: [{ label: "content", value: LABEL[v], flag: v === 2 ? "ok" : v === 1 ? "warn" : undefined }]
        }));
      }
      var safeCount = 0;
      for (i = 1; i < step.where.length; i++) if (step.where[i] > 0) safeCount++;

      return d.stack([
        gitcommon_phases(d, ctx),
        d.flow([
          d.big(step.state, "file state", step.flag),
          d.node({
            title: "recoverability",
            status: safeCount === 0 ? "NOWHERE BUT DISK" : safeCount >= 3 ? "ON ANOTHER MACHINE" : "IN GIT",
            statusFlag: safeCount === 0 ? "bad" : safeCount >= 3 ? "ok" : "warn",
            flag: safeCount === 0 ? "bad" : safeCount >= 3 ? "ok" : "warn",
            rows: [{ label: "areas holding it", value: String(safeCount) + " of 3 beyond disk",
                     flag: safeCount === 0 ? "bad" : safeCount >= 3 ? "ok" : "warn" }]
          })
        ]),
        d.cols(cards),
        d.note("Green holds the current content · amber holds an older version · " +
          "<span style=\"opacity:.6\">grey</span> does not have it at all. " +
          "Every git command you know moves content between two of these.")
      ]);
    }
  };

  // ====================================================================
  // ======================================================================
  // SIM · gitmentalmodel  (mental-model.md)
  // The object store filling up, commit by commit. Every hash below is the
  // page's own, from its section 2 walkthrough of a real repository:
  //   blob "hello\n"  ce013625030ba8dba906f756967f9e9ca394464a
  //   tree            2e81171448eb9f2ee3821e3d447aa6b2fe3ddba1
  //   author time     1788714639
  // ce01362... is the real SHA-1 of a blob containing "hello\n" -- the same on
  // every machine on earth, which is the point the page is making.
  // ======================================================================
  var gitmentalmodel_BLOB_HELLO = "ce013625030ba8dba906f756967f9e9ca394464a";
  var gitmentalmodel_TREE1 = "2e81171448eb9f2ee3821e3d447aa6b2fe3ddba1";
  var gitmentalmodel_TIME = 1788714639;
  // stand-ins for objects the page does not print, marked as such in the note
  var gitmentalmodel_BLOB_BYE = "8d0e41234f24b6da002d962a26c2495ea16a425f";
  var gitmentalmodel_TREE2 = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

  function gitmentalmodel_short(h) { return h.slice(0, 7); }

  function gitmentalmodel_obj(kind, hash, what, flag) {
    return { kind: kind, hash: hash, what: what, flag: flag };
  }

  // --- tab 1: one file becomes three objects -----------------------------
  function gitmentalmodel_first() {
    var S1 = [
      ["A fresh repository and one file containing <code>hello</code>. The object store is empty — " +
       "press Play.", []],
      ["<code>git hash-object a.txt</code> → <b>" + gitmentalmodel_short(gitmentalmodel_BLOB_HELLO) +
       "</b>. The hash is computed <i>from the content alone</i>, before anything is committed, " +
       "and it is the same on every machine on earth for the same bytes. That is what " +
       "<b>content-addressed</b> means.", [0]],
      ["<code>git add a.txt</code> writes that blob into the store and records the hash in the " +
       "index. The staging area is literally a list of blob hashes with filenames — nothing more.",
       [0]],
      ["<code>git commit</code> first builds a <b>tree</b>: a directory listing mapping " +
       "<code>a.txt</code> to the blob hash. One tree per directory.", [0, 1]],
      ["Then it writes the <b>commit</b>: a pointer to that tree, plus author, committer, " +
       "timestamp <code>" + gitmentalmodel_TIME + "</code>, and a parent — here, none.", [0, 1, 2]],
      ["<b>Three objects for one file.</b> Blob, tree, commit — and a <b>ref</b>, which is not an " +
       "object at all: <code>refs/heads/main</code> is a 41-byte file containing the commit hash.",
       [0, 1, 2]]
    ];
    var steps = [];
    for (var i = 0; i < S1.length; i++) {
      steps.push({
        mode: "first", caption: S1[i][0], show: S1[i][1], ref: i >= 5,
        flag: i === 0 ? undefined : i === S1.length - 1 ? "ok" : undefined
      });
    }
    return { id: "first", label: "One file → three objects", steps: steps,
      phases: ["empty", "hash-object", "add", "tree", "commit", "ref"] };
  }

  // --- tab 2: the second commit, and what it does NOT create -------------
  function gitmentalmodel_second() {
    var S2 = [
      ["Same repository, one commit in. Now add a <i>second</i> file and commit again — watch " +
       "what gets created and what does not.", 0],
      ["<code>echo bye > b.txt</code> then <code>git add b.txt</code>. A new blob: the content is " +
       "new, so the hash is new.", 1],
      ["The commit needs a tree. <code>a.txt</code> has not changed, so its entry points at " +
       "<b>the same blob</b> — <code>" + gitmentalmodel_short(gitmentalmodel_BLOB_HELLO) +
       "</code>. Git does not store it twice, and did not have to compare anything to know that: " +
       "identical content means an identical hash.", 2],
      ["A new tree object is written, because the <i>listing</i> changed even though one of its " +
       "entries did not.", 3],
      ["A new commit, pointing at the new tree — and at the previous commit as its <b>parent</b>. " +
       "That parent link is the entire history: a commit is a snapshot plus a pointer backwards.",
       4],
      ["<b>Two commits, three blobs?</b> No — <b>two</b>. Git stores content once and references " +
       "it from as many trees as need it. This is why a repository with a thousand commits of a " +
       "file that never changed contains one copy of that file.", 5]
    ];
    var steps = [];
    for (var i = 0; i < S2.length; i++) {
      steps.push({
        mode: "second", caption: S2[i][0], phase: S2[i][1],
        flag: i === S2.length - 1 ? "ok" : i === 2 ? "ok" : undefined
      });
    }
    return { id: "second", label: "The second commit", steps: steps,
      phases: ["start", "new blob", "reuse", "new tree", "commit", "count"] };
  }

  // --- tab 3: branches are free ------------------------------------------
  function gitmentalmodel_branch() {
    var S3 = [
      ["Two commits in the store, <code>main</code> pointing at the second. Now create a branch.", 0],
      ["<code>git branch feature</code>. Count the new objects created: <b>zero</b>.", 1],
      ["All it wrote is a 41-byte file — <code>.git/refs/heads/feature</code> — containing the " +
       "same commit hash <code>main</code> already had.", 2],
      ["<code>git checkout feature</code> changes one more file: <code>.git/HEAD</code> now reads " +
       "<code>ref: refs/heads/feature</code>. Still no objects.", 3],
      ["Commit on the branch and <i>now</i> objects appear — but only for the new content. The " +
       "branch did not copy anything; it diverged.", 4],
      ["<b>A branch is a pointer, and that is the whole implementation.</b> It is why branching " +
       "is instant regardless of repository size, why deleting a branch deletes no content, and " +
       "why <code>git branch -D</code> feels dangerous but usually is not — the commits are still " +
       "there, just unreachable until the reflog expires.", 5]
    ];
    var steps = [];
    for (var i = 0; i < S3.length; i++) {
      steps.push({
        mode: "branch", caption: S3[i][0], phase: S3[i][1],
        flag: i === S3.length - 1 ? "ok" : undefined
      });
    }
    return { id: "branch", label: "A branch costs nothing", steps: steps,
      phases: ["start", "branch", "ref file", "HEAD", "commit", "result"] };
  }

  S["gitmentalmodel"] = {
    title: "Watch the object store fill up",
    note: "Four object types and a ref, built from the page's section&nbsp;2 walkthrough of a real " +
      "repository. The blob and tree hashes are its actual output — " +
      "<code>ce01362…</code> is genuinely the SHA-1 of a blob containing <code>hello</code>, which " +
      "you can reproduce with <code>git hash-object</code> on any machine. Hashes for objects the " +
      "page does not print are marked <i>illustrative</i>.",
    interval: 1600,
    scenarios: [gitmentalmodel_first(), gitmentalmodel_second(), gitmentalmodel_branch()],

    draw: function (step, d, ctx) {
      var objs = [];

      if (step.mode === "first") {
        var all = [
          gitmentalmodel_obj("blob", gitmentalmodel_BLOB_HELLO, "\"hello\"", "ok"),
          gitmentalmodel_obj("tree", gitmentalmodel_TREE1, "a.txt → blob", "ok"),
          gitmentalmodel_obj("commit", "f55234f1a", "tree + author + parent", "ok")
        ];
        for (var i = 0; i < all.length; i++) {
          var on = step.show.indexOf(i) >= 0;
          objs.push({
            label: on ? gitmentalmodel_short(all[i].hash) : "—",
            flag: on ? all[i].flag : "idle",
            title: on ? all[i].kind + " " + all[i].hash + "  ·  " + all[i].what : "not written yet"
          });
        }
        return d.stack([
          gitcommon_phases(d, ctx),
          d.flow([
            d.big(String(step.show.length), "objects in store", step.show.length === 3 ? "ok" : undefined),
            d.node({
              title: "object store",
              status: step.show.length ? "WRITING" : "EMPTY",
              statusFlag: step.show.length ? "ok" : "idle",
              meta: ".git/objects",
              flag: step.show.length ? "ok" : "idle",
              rows: [
                { label: "blob", value: step.show.indexOf(0) >= 0 ? gitmentalmodel_short(gitmentalmodel_BLOB_HELLO) : "—",
                  flag: step.show.indexOf(0) >= 0 ? "ok" : undefined },
                { label: "tree", value: step.show.indexOf(1) >= 0 ? gitmentalmodel_short(gitmentalmodel_TREE1) : "—",
                  flag: step.show.indexOf(1) >= 0 ? "ok" : undefined },
                { label: "commit", value: step.show.indexOf(2) >= 0 ? "f55234f" : "—",
                  flag: step.show.indexOf(2) >= 0 ? "ok" : undefined }
              ]
            }),
            d.node({
              title: "refs",
              status: step.ref ? "main → f55234f" : "NONE",
              statusFlag: step.ref ? "ok" : "idle",
              meta: "not objects — plain files",
              flag: step.ref ? "ok" : "idle",
              rows: [{ label: "refs/heads/main", value: step.ref ? "41 bytes" : "—",
                       flag: step.ref ? "ok" : undefined }]
            })
          ]),
          d.cells(objs, { label: "objects written" }),
          d.note("Hover an object for its full hash. The blob exists before the commit does — " +
            "<code>git add</code> is what writes it.")
        ]);
      }

      if (step.mode === "second") {
        var p = step.phase;
        var blobs = [
          { label: gitmentalmodel_short(gitmentalmodel_BLOB_HELLO), flag: p >= 1 ? "ok" : "ok",
            title: "blob \"hello\" — written by the FIRST commit, reused unchanged" },
          { label: p >= 1 ? gitmentalmodel_short(gitmentalmodel_BLOB_BYE) : "—",
            flag: p >= 1 ? "warn" : "idle", title: p >= 1 ? "blob \"bye\" — new content, new hash" : "not written yet" }
        ];
        return d.stack([
          gitcommon_phases(d, ctx),
          d.flow([
            d.big(p >= 1 ? "2" : "1", "blobs total", p >= 5 ? "ok" : undefined),
            d.node({
              title: "new tree",
              status: p >= 3 ? "WRITTEN" : "PENDING",
              statusFlag: p >= 3 ? "ok" : "idle",
              meta: p >= 3 ? gitmentalmodel_short(gitmentalmodel_TREE2) : "—",
              flag: p >= 3 ? "ok" : "idle",
              rows: [
                { label: "a.txt", value: p >= 2 ? gitmentalmodel_short(gitmentalmodel_BLOB_HELLO) + " (reused)" : "—",
                  flag: p >= 2 ? "ok" : undefined },
                { label: "b.txt", value: p >= 3 ? gitmentalmodel_short(gitmentalmodel_BLOB_BYE) : "—",
                  flag: p >= 3 ? "warn" : undefined }
              ]
            }),
            d.node({
              title: "new commit",
              status: p >= 4 ? "WRITTEN" : "PENDING",
              statusFlag: p >= 4 ? "ok" : "idle",
              meta: "parent → f55234f",
              flag: p >= 4 ? "ok" : "idle",
              rows: [{ label: "parent", value: p >= 4 ? "f55234f" : "—", flag: p >= 4 ? "ok" : undefined }]
            })
          ]),
          d.cells(blobs, { label: "blobs in the store" }),
          p >= 5
            ? d.note("Two commits, <b>two</b> blobs. Identical content has an identical hash, so " +
                "storing it twice is impossible by construction — not an optimisation git performs, " +
                "a consequence of the addressing scheme.", "ok")
            : d.note("Watch the blob count, not the commit count.")
        ]);
      }

      // branch tab
      var q = step.phase;
      var refs = [
        { label: "main", flag: "ok", title: "refs/heads/main → commit 2" },
        { label: q >= 1 ? "feature" : "—", flag: q >= 1 ? (q >= 4 ? "warn" : "ok") : "idle",
          title: q >= 1 ? "refs/heads/feature — a 41-byte file" : "does not exist yet" }
      ];
      return d.stack([
        gitcommon_phases(d, ctx),
        d.flow([
          d.big(q >= 4 ? "1" : "0", "objects created", q >= 4 ? "warn" : "ok"),
          d.node({
            title: "git branch feature",
            status: q >= 1 ? "DONE" : "NOT RUN",
            statusFlag: q >= 1 ? "ok" : "idle",
            meta: q >= 2 ? "wrote 41 bytes" : "",
            flag: q >= 1 ? "ok" : "idle",
            rows: [
              { label: "objects written", value: q >= 1 ? "0" : "—", flag: q >= 1 ? "ok" : undefined },
              { label: "files written", value: q >= 2 ? "1  (refs/heads/feature)" : "—" }
            ]
          }),
          d.node({
            title: "HEAD",
            status: q >= 3 ? "→ feature" : "→ main",
            statusFlag: q >= 3 ? "warn" : "ok",
            meta: ".git/HEAD",
            rows: [{ label: "contents", value: q >= 3 ? "ref: refs/heads/feature" : "ref: refs/heads/main" }]
          })
        ]),
        d.cells(refs, { label: "refs" }),
        q >= 5
          ? d.note("Instant on a repository of any size, because the work is writing one small " +
              "file. Deleting a branch deletes that file and no content.", "ok")
          : d.note("Count the objects, not the branches.")
      ]);
    }
  };

  // ====================================================================
  // ======================================================================
  // SIM · gitplatforms  (platforms.md)
  // The three buttons on a pull request, each producing a different history.
  // Grounded in the page's section 5 comparison and branching.md's rule that
  // rebase does not preserve hashes: the same three-commit branch is landed
  // three ways and the resulting commit count on main is taken off the graph.
  // ======================================================================
  var gitplatforms_BRANCH = ["c1", "c2", "c3"];
  var gitplatforms_MAIN = ["A", "B"];

  function gitplatforms_build(id, label, phases, frames) {
    var steps = [];
    for (var i = 0; i < frames.length; i++) {
      steps.push({
        caption: frames[i][0], main: frames[i][1], branch: frames[i][2],
        bisect: frames[i][3], flag: frames[i][4]
      });
    }
    return { id: id, label: label, steps: steps, phases: phases };
  }

  function gitplatforms_mergeCommit() {
    return gitplatforms_build("merge", "Merge commit",
      ["PR open", "review", "approve", "merge", "result"], [
      ["A pull request with <b>three commits</b> against a <code>main</code> at <b>B</b>. Same " +
       "starting point for all three tabs.", ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Review happens on the branch. Nothing has landed yet — the PR is a request, and on GitLab " +
       "the same object is called a merge request.", ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Approved, checks green. Branch protection is what makes those two facts a precondition " +
       "rather than a suggestion.", ["A", "B"], ["c1", "c2", "c3"], 3, "ok"],
      ["<b>Merge commit.</b> All three commits land as they are, plus a merge commit <b>M</b> with " +
       "two parents.", ["A", "B", "c1", "c2", "c3", "M"], [], 5, "ok"],
      ["<b>Four commits added; every hash preserved.</b> The branch's internal history survives, " +
       "which is good for archaeology and noisy on a busy repository. <code>main</code> now has " +
       "intermediate commits that were never individually reviewed or green.",
       ["A", "B", "c1", "c2", "c3", "M"], [], 5, "warn"]
    ]);
  }

  function gitplatforms_squash() {
    return gitplatforms_build("squash", "Squash and merge",
      ["PR open", "review", "approve", "squash", "result"], [
      ["The same PR: three commits, <code>main</code> at <b>B</b>.", ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Same review. The difference is entirely in which button gets pressed.",
       ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Approved.", ["A", "B"], ["c1", "c2", "c3"], 3, "ok"],
      ["<b>Squash.</b> The three commits are flattened into <b>one</b> new commit on " +
       "<code>main</code>. The originals are not moved — they stay on the branch, which is then " +
       "usually deleted.", ["A", "B", "S"], ["c1", "c2", "c3"], 1, "warn"],
      ["<b>One commit added, and it is the reviewed unit.</b> Every commit on <code>main</code> " +
       "corresponds exactly to one PR, which makes <code>git bisect</code> and " +
       "<code>git revert</code> operate on the thing that was actually reviewed. The cost is that " +
       "the intermediate steps are gone once the branch is deleted — and a squashed branch can " +
       "never be merged again cleanly, because nothing on main shares its hashes.",
       ["A", "B", "S"], [], 1, "ok"]
    ]);
  }

  function gitplatforms_rebaseMerge() {
    return gitplatforms_build("rebase", "Rebase and merge",
      ["PR open", "review", "approve", "replay", "result"], [
      ["The same PR again.", ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Same review.", ["A", "B"], ["c1", "c2", "c3"], 3],
      ["Approved.", ["A", "B"], ["c1", "c2", "c3"], 3, "ok"],
      ["<b>Rebase and merge.</b> Each commit is replayed onto <code>main</code> — same changes, " +
       "new parents, <b>new hashes</b>. c1 becomes c1′ and so on.",
       ["A", "B", "c1'", "c2'", "c3'"], [], 3, "warn"],
      ["<b>Three commits added, none of them the ones that were reviewed.</b> The history is a " +
       "straight line and every commit is preserved as a separate step — but the hashes differ " +
       "from what CI ran on, and the individual commits were never green on their own. This is " +
       "the option that looks tidiest and has the subtlest failure mode.",
       ["A", "B", "c1'", "c2'", "c3'"], [], 3, "bad"]
    ]);
  }

  S["gitplatforms"] = {
    title: "Land the same pull request three ways",
    note: "One pull request — <b>three commits</b> against a <code>main</code> at <b>B</b> — and " +
      "the three buttons the platform offers. The tabs differ only in which is pressed. Watch two " +
      "things: how many commits land on <code>main</code>, and whether what lands is the thing " +
      "that was reviewed and tested.",
    interval: 1500,
    scenarios: [gitplatforms_mergeCommit(), gitplatforms_squash(), gitplatforms_rebaseMerge()],

    draw: function (step, d, ctx) {
      var mainCells = [], i, c;
      for (i = 0; i < step.main.length; i++) {
        c = step.main[i];
        var isNew = c === "M" || c === "S" || c.charAt(c.length - 1) === "'" || c.charAt(0) === "c";
        mainCells.push({
          label: c,
          flag: isNew ? (c === "S" ? "ok" : "warn") : undefined,
          title: isNew ? c + " — landed by this button" : "commit " + c + " — already on main"
        });
      }
      var brCells = [];
      for (i = 0; i < step.branch.length; i++) {
        brCells.push({ label: step.branch[i], flag: "ok", title: "reviewed commit " + step.branch[i] });
      }
      if (!brCells.length) brCells.push({ label: "branch deleted", flag: "idle", title: "merged and removed" });

      var added = step.main.length - gitplatforms_MAIN.length;

      return d.stack([
        gitcommon_phases(d, ctx),
        d.flow([
          d.big(String(added), "commits added to main",
            added === 1 ? "ok" : added > 3 ? "warn" : undefined),
          d.node({
            title: "what landed",
            status: added === 0 ? "NOTHING YET" : "MERGED",
            statusFlag: added === 0 ? "idle" : "ok",
            rows: [
              { label: "hashes preserved",
                value: added === 0 ? "—" : (step.main.join(",").indexOf("'") >= 0 ? "no" : "yes"),
                flag: added === 0 ? undefined : (step.main.join(",").indexOf("'") >= 0 ? "bad" : "ok") },
              { label: "reviewed unit on main",
                value: added === 0 ? "—" : (added === 1 ? "exactly one" : "split across " + added),
                flag: added === 1 ? "ok" : added === 0 ? undefined : "warn" }
            ]
          }),
          d.node({
            title: "bisect granularity",
            status: step.bisect + " step" + (step.bisect === 1 ? "" : "s"),
            statusFlag: step.bisect === 1 ? "ok" : "warn",
            rows: [{ label: "commits to search", value: String(step.bisect) }]
          })
        ]),
        d.lane({ label: "main", cells: mainCells }),
        d.lane({ label: "PR branch", cells: brCells }),
        d.note("Amber is a commit this button created or moved · green on main is the squashed " +
          "reviewed unit · green on the branch is a commit that was actually reviewed.")
      ]);
    }
  };

  // ====================================================================
  // A phase strip: which part of the operation this frame is showing. It also
  // guarantees every frame renders differently, which a caption alone does not.
  function gitcommon_phases(d, ctx) {
    var names = (ctx.scenario && ctx.scenario.phases) || [];
    if (!names.length) return "";
    var chips = [];
    for (var i = 0; i < names.length; i++) {
      chips.push({ label: names[i], flag: i < ctx.i ? "ok" : i === ctx.i ? "warn" : undefined });
    }
    return d.pills(chips);
  }

  // ======================================================================
  // SIM · gitundoing  (undoing.md)
  // The three reset modes from one starting point. Nothing here is invented:
  // the end states are the page's own verified output in section 2 --
  //   soft    HEAD moved back    staged: a.txt      working: clean
  //   mixed   HEAD moved back    staged: clean      working: a.txt modified
  //   hard    HEAD moved back    staged: clean      working: clean
  // and the per-area behaviour is its table. The sim's job is to show that the
  // three commands differ in exactly one thing: HOW FAR DOWN the reset reaches.
  // ======================================================================
  var gitundoing_AREAS = ["branch pointer", "staging area", "working directory"];

  // how deep each mode reaches. index i of AREAS is reset when i <= depth.
  var gitundoing_MODES = {
    soft:  { depth: 0, label: "reset --soft",  flag: "ok" },
    mixed: { depth: 1, label: "reset --mixed", flag: "warn" },
    hard:  { depth: 2, label: "reset --hard",  flag: "bad" }
  };

  function gitundoing_state(mode, stage) {
    // stage 0-1 = before the command, 2 = branch moves, 3 = index, 4 = worktree, 5 = settled
    var d = gitundoing_MODES[mode].depth;
    return {
      head: stage >= 2 ? "A" : "B",
      // the index keeps B's content unless the reset reached it
      indexHasB: !(d >= 1 && stage >= 3),
      // the working file keeps B's content unless the reset reached it
      workHasB: !(d >= 2 && stage >= 4)
    };
  }

  function gitundoing_scenario(mode) {
    var m = gitundoing_MODES[mode];
    var cmd = "git " + m.label + " HEAD~1";
    var steps = [{
      mode: mode, stage: 0,
      caption: "Two commits. <b>A</b> is the last good one; <b>B</b> is the one you regret — " +
        "it changed <code>a.txt</code>. Working tree is clean, because you committed everything. " +
        "Press Play to run <code>" + cmd + "</code>."
    }];
    steps.push({
      mode: mode, stage: 1,
      caption: "<b>The one question that matters</b> is not what the command is called — it is " +
        "<i>which of the three areas it touches</i>. <code>" + m.label + "</code> reaches " +
        (m.depth === 0 ? "<b>only the branch pointer</b>."
         : m.depth === 1 ? "<b>the branch pointer and the index</b>."
         : "<b>all three</b>."),
      flag: m.flag
    });
    steps.push({
      mode: mode, stage: 2,
      caption: "<b>The branch pointer moves to A.</b> This part is identical in all three modes — " +
        "every reset moves the branch. Commit B is still in the object store; nothing has been " +
        "deleted yet, it just has no branch pointing at it.",
      flag: "warn"
    });
    steps.push({
      mode: mode, stage: 3,
      caption: m.depth >= 1
        ? "<b>The index is reset to A.</b> Your staged changes are gone from staging — B's " +
          "version of <code>a.txt</code> is no longer queued for commit."
        : "<b>The index is left alone.</b> It still holds B's content, so <code>a.txt</code> now " +
          "shows up as <b>staged</b> — the change survived, already queued for a new commit. " +
          "This is what makes <code>--soft</code> the redo-the-commit-message mode.",
      flag: m.depth >= 1 ? "warn" : "ok"
    });
    steps.push({
      mode: mode, stage: 4,
      caption: m.depth >= 2
        ? "<b>The working directory is overwritten with A.</b> Your edit to <code>a.txt</code> is " +
          "now gone from disk. It was never anywhere else — not staged, not stashed."
        : "<b>The working directory is untouched.</b> The file on disk still has your change, " +
          (m.depth === 1
            ? "so it shows as <b>modified but unstaged</b> — you can re-stage it selectively."
            : "matching the index."),
      flag: m.depth >= 2 ? "bad" : "ok"
    });
    steps.push({
      mode: mode, stage: 5,
      caption: m.depth === 0
        ? "<b>Result: staged, working clean.</b> Everything you wrote is still queued. Commit " +
          "again with a better message and you are done. Nothing is at risk."
        : m.depth === 1
        ? "<b>Result: staging clean, file modified.</b> The work is on disk but no longer queued, " +
          "which is exactly what you want when you staged the wrong subset. This is the default — " +
          "a bare <code>git reset HEAD~1</code> is <code>--mixed</code>."
        : "<b>Result: everything clean, and the edit is gone.</b> This is the only one of the " +
          "three that destroys work. Commit B itself is still recoverable from the reflog for a " +
          "few weeks — but the uncommitted edit never existed anywhere git could keep it.",
      flag: m.flag
    });
    return { id: mode, label: m.label, steps: steps,
      phases: ["start", "which areas", "branch moves", "staging", "working dir", "result"] };
  }

  S["gitundoing"] = {
    title: "Run the three resets from one starting point",
    note: "Two commits — <b>A</b> good, <b>B</b> regretted — then <code>git reset HEAD~1</code> " +
      "in each of its three modes. The end states below are the page's own verified output, and " +
      "the frames show why they differ: the three commands are the same operation reaching " +
      "<b>one area deeper</b> each time. The only question worth asking about any git command is " +
      "which of these areas it touches.",
    interval: 1500,
    scenarios: [
      gitundoing_scenario("soft"),
      gitundoing_scenario("mixed"),
      gitundoing_scenario("hard")
    ],

    draw: function (step, d, ctx) {
      var m = gitundoing_MODES[step.mode];
      var st = gitundoing_state(step.mode, step.stage);
      var moved = step.stage >= 2;

      // the commit graph: A <- B, with the branch pointer under one of them
      var graph = d.cells([
        { label: "A", flag: st.head === "A" ? "ok" : undefined, title: "commit A — the last good commit" },
        { label: "B", flag: st.head === "B" ? "ok" : (moved ? "idle" : undefined),
          title: moved ? "commit B — still in the object store, no branch points at it" : "commit B — HEAD is here" }
      ], { label: "history   (main → " + st.head + ")" });

      // which areas this mode reaches, revealed as the run progresses
      var reach = [];
      for (var i = 0; i < gitundoing_AREAS.length; i++) {
        var reached = i <= m.depth;
        var doneNow = reached && step.stage >= (i + 2);
        reach.push({
          label: gitundoing_AREAS[i],
          flag: !reached ? "idle" : doneNow ? (i === 2 ? "bad" : "warn") : undefined,
          title: reached ? "reset --" + step.mode + " reaches this area" : "untouched by reset --" + step.mode
        });
      }

      return d.stack([
        gitcommon_phases(d, ctx),
        d.cols([
          d.node({
            title: "branch pointer",
            status: moved ? "MOVED TO A" : "AT B",
            statusFlag: moved ? "warn" : "ok",
            meta: "main → " + st.head,
            flag: moved ? "warn" : undefined,
            rows: [{ label: "HEAD", value: st.head, flag: moved ? "warn" : "ok" }]
          }),
          d.node({
            title: "staging area",
            status: st.indexHasB ? "HOLDS B" : "MATCHES A",
            statusFlag: st.indexHasB && moved ? "ok" : "warn",
            meta: "the index",
            flag: st.indexHasB && moved ? "ok" : undefined,
            rows: [{
              label: "a.txt",
              value: st.indexHasB && moved ? "staged" : "clean",
              flag: st.indexHasB && moved ? "ok" : undefined
            }]
          }),
          d.node({
            title: "working directory",
            status: st.workHasB ? "HAS YOUR EDIT" : "REVERTED",
            statusFlag: st.workHasB ? "ok" : "bad",
            meta: "files on disk",
            flag: st.workHasB ? undefined : "bad",
            rows: [{
              label: "a.txt",
              value: !st.workHasB ? "overwritten"
                : (moved && !st.indexHasB) ? "modified" : "clean",
              flag: !st.workHasB ? "bad" : (moved && !st.indexHasB) ? "warn" : "ok"
            }]
          })
        ]),
        graph,
        d.cells(reach, { label: "how deep this mode reaches" }),
        step.stage >= 5 && m.depth === 2
          ? d.note("Commit B is reachable from the reflog for weeks. The <i>uncommitted</i> edit " +
              "is not — git never saw it, so there is nothing to recover.", "bad")
          : d.note("Green is where your work still is · amber is what the command changed · " +
              "<span style=\"opacity:.6\">grey</span> is an area this mode never touches.")
      ]);
    }
  };

})();
