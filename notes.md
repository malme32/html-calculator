# notes

Working notes for the calculator. Facts below were checked against the
remote on 2026-09-27, not taken on trust.

## What this is

A single-page calculator: `index.html`, `styles.css`, `app.js` at the repo
root. No build step, no dependencies, no framework, no external assets.

## Why it is built this way

The binding requirement is that the page works when opened **straight from
the filesystem** (`file://`) as well as when served over HTTP. That rules out
anything a bundler or a module loader would need, so the implementation stays
vanilla and the three files reference each other with relative paths only.

The second decision is to keep arithmetic and DOM apart. `createCalculator()`
in `app.js` is a pure state machine over `{current, previous, operator,
overwrite}`; the DOM binding only translates clicks and `keydown` into calls
on it. That is what makes the logic testable without a browser.

`app.js` ends with a `typeof module !== 'undefined'` guard, so it exports
under CommonJS for tests and stays a plain `<script>` otherwise. Dropping the
guard would break `file://`; dropping the export would make the logic
untestable. Both halves are load-bearing.

## Branch state — the thing to know

- `main` is still at `77172e7` and contains **only `README.md`**.
- The calculator lives on `agent/chat-rebuild-the-calculator-in-that-repository-and-push-it-t-50aaa4`
  at commit `a60f7c2`.

So a fresh clone of `main` shows an empty project. The calculator is **not**
merged. An agent task branch is scoped to its own branch and is not merged
into `main` by the agent, so this needs a human merge — either the PR that
GitHub prints on push, or:

```
git push origin agent/chat-rebuild-the-calculator-in-that-repository-and-push-it-t-50aaa4:main
```

## Behaviour worth knowing before changing it

- Division by zero shows `Error`; it does not produce `Infinity`.
- Results are trimmed to twelve significant digits, so `0.1 + 0.2` reads
  `0.3` rather than leaking float noise.
- The display sizes its own font with a `--display-scale` property computed by
  `fitScale()` instead of using a length-to-font-size lookup table. An earlier
  version used the table and clipped results whose length fell between two
  defined steps. Do not reintroduce a lookup table.
- The display is `role="status" aria-live="polite"`, function keys carry
  `aria-label`, and digit keys are named by their own text.
- `Enter` and `Space` on a focused button are left to the browser, so a
  keypress does not fire the action twice.

## Running and testing

Open `index.html` directly, or serve the directory — any static server will do.

The test scripts from the build task lived in `.agent/tmp/` and were
deliberately not committed, so there is currently no test suite in the
repository. `node --check app.js` and a syntax pass over the HTML are the only
checks available without rebuilding them. If tests come back, commit them this
time: keeping the only verification outside the repository is what let the
`main` drift above go unnoticed.

## Open items

- Merge the calculator into `main` (operator action).
- Commit a test suite to the repository.
- No automated CI, and visual layout has never been checked in a real browser
  — only statically.
