# Biome CI repair audit

This draft is based on `390784ff6c5b8ab69eefd2ec2749bf982de9e35f` and is separate
from the upstream-migration repair. It is not ready to merge while the five
caption errors remain. No rules or files were suppressed to obtain these counts.

| Repository-pinned Biome 2.2.0 | Before | After |
|---|---:|---:|
| Errors | 216 | 5 |
| Warnings | 85 | 13 |

The former workflow used floating `latest` and `biome ci . || true`. This draft
pins 2.2.0 and propagates its failure. Format and lint retain their separate jobs.
The existing typecheck job also runs the web unit suite. Triggers, permissions,
job conditions, native platforms and existing test commands remain intact.

## Repairs

- Render escaped JSON-LD as script children while preserving payloads and Next
  script strategies. Replace the tools' HTML string insertion with React text
  and anchors; current copy has exhaustive text/link equivalence coverage.
- Generate per-instance form/SVG IDs and update every local reference. Preserve
  the public self-hosting `#features` link explicitly at its route owner.
- Use native buttons, associated labels, iframe titles and deliberate decorative
  or named graphic semantics. Give the comparison slider a native range input.
- Use content identities (including repeated-value occurrence keys) for lists.
- Restore unconditional hook ordering in the domain dialog. Separate the
  trimmer's event subscription and URL cleanup so rerenders do not clear a
  selected video or revoke its active preview.
- Use the existing Radix ref implementation as a pinned direct dependency,
  including React 19 ref cleanup. Keep previously ignored props out of forwarded
  props, without changing `asChild`/children behavior.
- Narrow browser-extension/API/error types, retain mutation/query generic types,
  and validate indexed batch lookups. Keep direct SVG logo URLs and dimensions
  when using Next Image. Remove the private AudioPlayer module after a complete
  repository reference search found no consumers.
- Match the Slack manifest test to the intentional color change in upstream
  commit `125a858b90757da1f0e3d68cb6a69a796df45c29`. Keep all scope, redirect and
  event assertions intact; no manifest or Slack integration behavior changes.
- Replace obsolete Node 16 action references with Node 24 actions:
  [paths-filter v4](https://github.com/dorny/paths-filter/blob/v4/action.yml) and
  [setup-node v7](https://github.com/actions/setup-node/blob/v7/action.yml).
  Keep the requested Node versions and disable newly automatic package caching.
  GitHub-hosted runners meet the documented minimum runner requirement.

## Outstanding caption decision

Five errors remain in MediaFormatConverter (video/audio output), SpeedController
(video output), and TrimmingTool (input/output). These tools accept arbitrary
local user media; there is no caption source. Empty tracks, muted audio or rule
suppression would conceal the accessibility gap. The existing tools promise
browser-only processing, so uploading media for transcription would also change
the privacy contract.

Choose a real caption workflow before merging: for example, a local caption-file
workflow with validated VTT and synchronized timing for speed changes/trims, or
an explicitly approved transcription design. Captions must describe the actual
media and preserve its audible playback. This draft intentionally leaves lint
failing until that decision is implemented and tested.

## Remaining warnings

Eleven `noImgElement` warnings concern dynamic thumbnails, user GIF output,
Markdown images and illustration layouts. Migrating them needs real dimensions,
layout/loading checks and care with blob/signed URLs. Two `noExplicitAny`
warnings are in the shared polymorphic Button's element/ref bridge; its public
ref contract needs a separately verified typing change. They remain visible.

## Local validation

- Frozen pnpm 10.5.2 lockfile install (scripts disabled): pass; only the existing
  Radix compose-refs snapshot is promoted to a direct dependency.
- Next route type generation and complete `tsc -b`: pass.
- Web unit suite: 1,655 tests in 154 files pass, including 15 new rendering,
  ref lifecycle, props, alias-resolution and trim-preview regressions.
- Biome formatting/import checks: pass; full pinned lint intentionally exits
  nonzero for the five real caption errors and reports the 13 warnings above.
- actionlint 1.7.12 (shellcheck disabled): pass. `git diff --check`: pass.

No hosted run, production build or visual browser test is represented by these
local results. Hosted results must be recorded on the final PR head separately.
