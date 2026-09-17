# Frozen v1 node-types snapshot

This directory is a **frozen static snapshot** of the Codama v1 node types, as
published at `@codama/spec@1.9.2`. It underpins `upgradeV1ToV2` in
`@codama/upgrade`: the `v1.RootNode` type it exports is the input shape that the
v1 → v2 upgrade step transforms.

## It is not generated

The `@codama-internal/spec-generators` generator is **single-major** — it only
renders the spec on its own branch (v2 on `main`). It does **not** regenerate
this snapshot, and `pnpm generate` never touches it. Treat every file here as
hand-maintained source.

## Layout mirrors `1.x` on purpose

The `generated/` subtree deliberately mirrors the layout of
`@codama/node-types/src/generated` on the `1.x` maintenance branch, including
file paths and relative imports. This is the port-forward mechanism:

> If a change ever lands on a past major's node types (e.g. a fix on the `1.x`
> branch), you can carry it forward by applying **the same patch** to the
> matching files here — `git format-patch` on `1.x`, then `git apply` in this
> directory.

In practice v1 is closed, so this should be rare. Slightly stale docblocks in
the snapshot are acceptable; old majors never change shape.

## Self-contained

Every import within this directory is relative and resolves to v1's own copies
of the hand-written siblings (`brands.ts`, `Docs.ts`, `Version.ts`), which are
v1-shaped (e.g. `Docs = Array<string>`). Nothing here imports from
`@codama/node-types`, so the snapshot is unaffected by v2 changes to the live
node types.

## Adding a future major

When cutting vN+1, freeze the then-current vN node types the same way: copy
`@codama/node-types/src/generated` (plus v-N-shaped `brands`/`Docs`/`Version`)
into `packages/upgrade/src/vN/`, and add a `upgradeVNToVN+1` step. See the repo
root `CONTRIBUTING.md`.
