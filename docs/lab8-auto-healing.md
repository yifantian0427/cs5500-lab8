# Lab 8 — Auto-Healing CI/CD

## Implementation

`.github/workflows/ci.yml` runs dependency installation, type checking, lint,
repair-runner safety tests, and the existing Jest suite on main pushes, the
breaking demonstration branch, and pull requests targeting main. Jest output
is captured in `test-results.log`; the final 48 KB is passed as a base64 job
output to the conditional `auto-fix` job. No artifact service is required,
which avoids the GitHub.com-only artifact v4 dependency on GitHub Enterprise.

The repair runner uses Node's built-in fetch and the OpenAI Responses API.
It sends the failure log, reservation service, existing service tests, latest
service diff, and AGENTS.md. Structured JSON exact-match edits can change only
`src/services/reservation.service.ts`. Missing, ambiguous, empty, and malformed
edits are rejected. Typecheck, lint, safety tests, and the unchanged full Jest
suite must pass before the workflow publishes a repair branch and PR.
No generated commands execute. The workflow does not merge the patch.

AGENTS.md shaped this implementation: all source is TypeScript under src/;
no runtime dependencies were added; service business logic stays independent
of Express. Test assertions and database/transaction behavior are preserved.

## Required repository setup

1. Confirm GitHub Actions is enabled on the Northeastern Enterprise repository,
   with access to `actions/checkout@v4`, `actions/setup-node@v4`, and
   `actions/github-script@v7`, an Ubuntu runner with Node 24 support, and outbound
   access to npm, the MongoDB binary download host, and api.openai.com.
2. Add an Actions secret named `OPENAI_API_KEY` through repository Settings →
   Secrets and variables → Actions. Never put its value in source or a PR.
   Optionally set repository variable `OPENAI_MODEL` (default `gpt-4.1-mini`).
3. Enable “Allow GitHub Actions to create and approve pull requests” in the
   repository's Actions workflow permissions, if permitted by organization policy.
   This workflow requests contents and pull-requests write permissions only for
   the repair job. It never approves or merges PRs.
4. Commit/push the implementation to main and verify the baseline CI passes.

## One break-and-fix demonstration

After baseline passes and the secret is configured, from the repository root:

```sh
git switch main
git pull --ff-only
git switch -c test/breaking-reservation-change
git apply docs/lab8-breaking-change.patch
git add src/services/reservation.service.ts
git commit -m "test: introduce reservation conflict regression for Lab 8"
git push -u origin test/breaking-reservation-change
```

Open one PR from this branch into main. The injected `if (!conflict)` rejects
valid bookings with 409 and is caught by the existing tests. The failing PR
run triggers auto-fix; a push run never creates a repair PR. The generated
`fix/auto-heal-RUN_ID` PR targets the breaking branch, so its diff contains the
repair only. Fork PRs and other branches cannot access the repair job.

Create only this one demonstration. The workflow checks all existing repair
PRs targeting the demonstration branch and refuses a second one, including
when the first PR is closed. It runs auto-fix only on the first run attempt;
configure the secret before starting. A failed attempt that created no PR
can be retriggered with a new commit on the demonstration branch.

A PR created with GITHUB_TOKEN does not automatically start another Actions
run. The full suite is explicitly run before publishing the repair; inspect
that run's successful auto-fix verification steps. For another hosted check,
use the Actions UI to rerun CI after the repair is merged into the demonstration
branch, or run the checks locally. Never merge the intentionally broken PR
into main while it is failing.

## Human review and submission

The generated PR contains an audit checklist marked **pending**. A person must
inspect the actual generated diff and unchanged tests, verify date validation,
strict half-open overlap comparisons and transaction behavior, and record their
name, date, workflow link, and findings in that PR description. Automated
verification is not a substitute for this review. The repair PR may stay open;
the handout does not require merging it. Submit the repository URL to Canvas
only after exactly one generated repair PR and its real review are visible.

## Verification in this session

- TypeScript typecheck, lint, build: passed.
- Repair-runner safety tests: 2 passed.
- Existing Jest integration suite: blocked by this session's socket restriction
  (`listen EPERM` while starting mongodb-memory-server), before assertions ran.
- Intentional-break patch: checked for applicability; not committed to main.
- Live AI request, hosted workflow, generated PR, and human review: not performed.
  The Enterprise hostname could not be resolved from this session.

The implementation was prepared in a separate writable checkout because the
original `/Users/yifantian/CS 5500/cs5500-assignments` directory is read-only to
this session. Apply the accompanying implementation patch in the original
repository before running the steps above.
