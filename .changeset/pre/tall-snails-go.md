---
'@codama/dynamic-codecs': minor
---

Add formatters that turn decoded nodes into human-readable text using the presentation metadata of their nodes, such as units, display nodes, scales and ticks. `formatDecodedNode` formats a whole decoded tree, e.g. an account or an instruction, into a formatted node tree.

```ts
const formatted = formatDecodedNode(account, { formatAddress: address => names.get(address) ?? address });
formatted.text; // "Amount: 1.5 USDC, Owner: Alice, Config: (Fee: 25 bps)"
assertIsFormattedNode(formatted.data, 'structTypeNode');
getFormattedRows(formatted.data); // [{ identifiers: ['amount'], label: 'Amount', text: '1.5 USDC', field }, …]
```

- **Leaf formatters:** `formatInteger`, `formatFloat`, `formatFixedPoint`, `formatDateTime`, `formatDuration`, `formatString`, `formatBoolean`, `formatBytes`, `formatEnum` and `formatPublicKey` all take `(decoded, options)`. Numbers are formatted exactly, including 128-bit integers and fixed points. `formatInteger` returns `null` when the `decimals` of an amount cannot be resolved. `formatDateTime` and `formatDuration` throw `CODAMA_ERROR__INVALID_TICKS_PER_SECOND` when `ticksPerSecond` is not a positive integer. `formatUnit` is also exported.
- **`FormatOptions`:** `formatUnit` places a unit next to a value, `numberFormat` takes an `Intl.NumberFormat`, and `formatAddress` formats public keys and address units. `resolveInjectedValue(path, parents)` returns the `ValueNode` an injected value of a display node stands for, e.g. `integerValueNode('6')`. `scope` holds the provided values in scope. Values provided as literals by the enclosing instructions resolve without any of these options.
- **Formatted nodes:** `formatDecodedNode` returns the decoded tree with a `text` and a `degraded` flag on every node. Struct fields also carry `label`, `skip`, `flatten` and `flattenPrefix`, and enum variants carry `label` and `skipInnerData`. Its `FormatDecodedNodeOptions` can override the formatter of each leaf kind, and its `formatDegraded` option presents values that cannot be formatted, e.g. `` raw => `${raw} (raw)` ``. New types: `FormattedNode`, one `Formatted…Node` type per kind, `FormattedTypeNode`, `GetFormattedNodeFromKind` and `GetFormattedNodeFromDecoded`, along with the `isFormattedNode` and `assertIsFormattedNode` guards.
- **Rows:** `getFormattedRows` lays out a formatted struct as `FormattedRow`s, leaving out fields skipped `always` and replacing flattened fields with their own prefixed rows.
- **Value labels:** `getValueLabel(field, { linkables, scope })` returns the label of the first `valueLabels` entry whose value encodes to the same bytes as the decoded field value, e.g. `"All"` for `u64::MAX`. `formatDecodedNode` applies these labels as the field's `text` and its new `valueLabel` attribute. It also accepts a `linkables` option.
