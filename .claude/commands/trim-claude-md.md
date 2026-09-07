# CLAUDE.md trim

Review CLAUDE.md and propose removals. Do not edit the file — output a list
of candidate lines with a one-line reason each, and wait for my decision.

Remove:

- **Anything derivable from the repo.** Dependency inventory that package.json
  already answers, script names, file paths obvious from the tree. Keep an entry
  only if it carries reasoning the repo cannot express — why a library was chosen,
  or why an obvious alternative was rejected.
- **One-time setup hazards.** Warnings about steps that have already run and
  cannot run again.
- **Anything now false.** Check every claim describing current code against the
  actual code. A stale assertion is worse than a missing one, because it is
  trusted over the source. Report these separately as CORRECTIONS — they need
  fixing, not deleting.
- **Internal contradictions.** Two rules that cannot both be followed. Report
  these as CONFLICTS.
- **Restatements of general good practice.** Anything true of any TypeScript
  project belongs in a linter, not here.
- **Duplication.** The same rule stated in two sections.

Keep, even when it looks verbose:

- Non-obvious failure modes, especially silent ones — a misconfiguration that
  makes tests pass for the wrong reason earns every line it takes.
- Library and tooling quirks that cost time to rediscover.
- Boundaries: what not to do without asking, what must never be installed.
- Architecture decisions and the reasoning behind them.
- Anything marked as a deliberate choice against an obvious alternative.

Do not condense wording to save space. The goal is fewer items, not terser
prose — a warning compressed until it is ambiguous is worse than no warning.

For each candidate output: the line, why it should go, and REMOVE / CORRECTION /
CONFLICT. If nothing should be removed, say so and change nothing.
