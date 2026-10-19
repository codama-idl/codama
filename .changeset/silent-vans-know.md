---
'@codama/visitors-core': major
---

Add `ProvidedScope` to resolve `injectedValueNode`s from the `provides` of enclosing instructions, add `getInstructionDataFields`, and rework `getResolvedInstructionInputsVisitor` around instruction data fields and injected values.

- `ProvidedScope` holds the lexical frames of `providedNode`s visible at a point of the tree, one per `instructionNode` with `provides`, the innermost frame winning. `scope.resolve(node, { kinds })` replaces every injection within `node` (itself included), using fallbacks when nothing is provided, and returns `undefined` when an injection resolves to nothing. `scope.resolveOrThrow(node, { kinds })` throws `CODAMA_ERROR__INJECTED_VALUE_NOT_PROVIDED` instead. Resolved values of the wrong kind throw `CODAMA_ERROR__VISITORS__INVALID_PROVIDED_VALUE`. `scope.get(key)`, `push`, `pop` and `clone` are also available.
- `recordProvidedScopeVisitor(visitor, scope)` keeps a `ProvidedScope` in sync with a traversal, and `getProvidedScopeFromPath(path)` builds the scope of the instructions along a path.
- `getInstructionDataFields(instructionPath, linkables)` lists every struct field addressable within an instruction's `data`, with its full path (`InstructionDataField`), e.g. `amount`, `config` and `config.fee`, following defined type links.

**BREAKING CHANGES**

**`getResolvedInstructionInputsVisitor` takes a `LinkableDictionary`.** It is now its first argument, used to follow defined type links in the instruction's `data`. Its options gain `stack` (the ancestry of the visited instruction, which must contain its `programNode` for linked data to be followed) and `scope` (the `ProvidedScope` of enclosing instructions), and `includeDataArgumentValueNodes` is renamed `includeDataValueNodes`.

```diff
- visit(instruction, getResolvedInstructionInputsVisitor({ includeDataArgumentValueNodes: true }));
+ visit(instruction, getResolvedInstructionInputsVisitor(linkables, { includeDataValueNodes: true, stack }));
```

**Resolved inputs wrap their node.** `ResolvedInstructionAccount` no longer extends `InstructionAccountNode`: the account is under `node`, alongside `dependsOn`, `isPda`, `resolvedIsOptional`, `resolvedIsSigner` and a new `resolvedDefaultValue` with injections resolved. `ResolvedInstructionArgument` is replaced by `ResolvedInstructionDataField` (`node`, `path`, `dependsOn`, `resolvedDefaultValue`), for the fields of the instruction's `data`, nested fields included, addressed by their path (e.g. `config.bump`).

```diff
- resolvedInputs.map(input => input.name);
+ resolvedInputs.map(input => (isNode(input.node, 'instructionAccountNode') ? input.node.identifier : input.path));
```

**Instruction dependencies are data values.** `InstructionDependency` is now exported and is `AccountValueNode | DataValueNode` (previously `AccountValueNode | ArgumentValueNode`), and `getInstructionDependencies(input)` is replaced by `getDependencies(defaultValue)`, which takes the default value to inspect rather than an instruction or input.
