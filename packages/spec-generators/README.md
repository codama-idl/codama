# `@codama-internal/spec-generators`

Private workspace package. Houses the code generators that turn the
`@codama/spec` encoded specification into the source code of the public
Codama monorepo packages.

This package is **never published**. It is only invoked at development
time, via `pnpm generate` from the repository root, to regenerate
specific subtrees of the monorepo (today: `@codama/node-types/src/generated/`).

## Architecture

Each generator owns its full pipeline. It knows which spec major it
targets, which output directory it writes to, and which compatibility
knobs it needs. Generators do not take a spec as a parameter — they
import it directly from `@codama/spec`. Adding a new generator is a
matter of dropping a folder under `src/`, exposing a `generate()` from
its `index.ts`, and wiring it into the orchestrator.

The orchestrator entrypoint (`src/index.ts`) re-exports a top-level
`generate()` that runs every registered generator sequentially. The bin
script (`bin/generate.ts`) wraps it for `pnpm generate`.

## Layout

```
src/
├── index.ts        # orchestrator: re-exports a top-level generate()
└── nodeTypes/      # generator for @codama/node-types/src/generated/

bin/generate.ts     # pnpm generate entry; wraps the orchestrator

test/
└── nodeTypes/      # unit tests for the @codama/node-types generator
```

## Output cleanup

Each generator wipes its target `/generated/` folder before writing, so
stale files from a previous run never survive. Hand-written files in the
target package live as siblings of `/generated/`, never inside it.
