---
'@codama/dynamic-parsers': major
---

Return the decoded nodes of `@codama/dynamic-codecs` from every parser and identify field discriminators through v2 paths. Also add `matchesAccountData`, the `ParsableInstruction` type and a `linkables` option on every `identify*` and `parse*` function, to avoid recording the linkable nodes of the IDL on each call.

**BREAKING CHANGES**

**Parsers return decoded nodes.** `parseAccountData`, `parseEventData`, `parseInstructionData` and `parseData` now return a `DecodedAccountNode`, `DecodedEventNode` or `DecodedInstructionNode`, and `ParsedData` is removed. The plain value moves from `data` to `value`, `data` now holds the decoded nodes of the data, and `preOffset` and `postOffset` are included alongside `path`.

```diff
 const parsed = parseAccountData(root, bytes);
- parsed.data.amount;
+ parsed.value.amount;
```

**New value format.** The decoded `value` uses the value format of `getNodeValueCodec`: integers are `bigint`s, struct keys are raw field identifiers and enums are `{ __kind, __discriminator, data }` objects. The encoding of decoded plain bytes is set by the new `bytesEncoding` option.

**`ParsedInstruction` shape.** `ParsedInstruction` is now a `DecodedInstructionNode` with `accounts` and `remainingAccounts`, the latter now required. Its accounts carry the `identifier` of their instruction account instead of its `name`. `parseInstruction` accepts a third `options` argument (`bytesEncoding`, `linkables`).

```diff
- parsed.accounts[0].name;
+ parsed.accounts[0].identifier;
```

**Field discriminators use paths.** A `fieldDiscriminatorNode` points to its field through its v2 `path`, relative to the node's `data` and following linked types, e.g. `header.kind` or `entries[0].kind`. Injected default values resolve from the `provides` of the instruction. Paths that do not lead to a struct field throw `DISCRIMINATOR_FIELD_NOT_FOUND`, with the `CANNOT_RESOLVE_PATH` error as `cause` when the path cannot be followed.

**`getByteIdentificationVisitor` takes a `DiscriminatorContext`.** Its third argument is now a `DiscriminatorContext` (`codecVisitor`, `valueVisitor`, `linkables`, `scope` and `stack`) instead of `CodecAndValueVisitors`, and its `stack` option is removed.

**New options.** All parsers accept `ParseDataOptions`: the `programAddress` and `linkables` of `IdentifyDataOptions`, plus the codec options of `@codama/dynamic-codecs`, e.g. `bytesEncoding`.
