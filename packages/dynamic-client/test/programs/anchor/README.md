# Anchor test programs for `dynamic-client`

Contains custom Anchor programs for testing edge cases or anything that can't be covered by Solana native programs. Such programs give the `dynamic-client` test suite real Anchor-generated IDLs and on-chain programs to exercise the runtime instruction builder against genuine Anchor output rather than hand-written fixtures.

Currently we have `example` and `blog` programs with misc instructions.

## Tests

The tests do **not** build these programs. They load prebuilt `.so` binaries committed at `test/programs/dumps/{example,blog}.so` into `LiteSVM`, and use the committed Codama IDLs (`test/programs/idls/*.json`) and generated types (`test/programs/generated/*.ts`).

## Workflow when changing a program

Existing programs can be modified, or a new program can be added if a new test case is needed.

1. Edit/add the program under `programs/<name>/`.
2. Run `pnpm anchor:sync:build`
    - Builds the programs
    - Copies the `.so` files into `test/programs/dumps/`
    - Refreshes the artifact file (source hash + `.so` binary hash per program)
    - Regenerates the Codama IDLs
    - Regenerates the generated types
3. Commit the refreshed artifacts (`dumps/*.so`, `idls/*.json`, `anchor/artifacts/anchor-build-sync-hashes.json`).

**Required toolchain:**

- Anchor 1.0.2
- Solana CLI 3.1.14

### Program build drift mitigation

Cheap test [tests/anchor-build-sync.test.ts](./tests/anchor-build-sync.test.ts) makes sure the committed builds are in sync by comparing each program's recomputed source hash and its committed `.so` binary hash against [artifacts/anchor-build-sync-hashes.json](./artifacts/anchor-build-sync-hashes.json). It does not rebuild — refreshing the artifacts requires `pnpm anchor:sync:build`.
