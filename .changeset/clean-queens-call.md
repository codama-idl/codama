---
'@codama/renderers-core': minor
---

Add a `writeIdlVisitor` that writes the visited `RootNode` to a JSON file at the given path. Use it as a Codama CLI script to write the IDL back to a file after all `before` visitors have been applied.

```ts
// codama.mjs
export default {
    idl: 'interface-idl.json',
    before: [...],
    scripts: {
        idl: { from: '@codama/renderers-core#writeIdlVisitor', args: ['idl.json'] },
    },
};
```
