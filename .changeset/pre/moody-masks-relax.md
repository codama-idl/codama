---
'@codama/dynamic-codecs': minor
---

Add `getNodeCodec` and `getNodeCodecVisitor`, which decode Codama nodes into `DecodedNode` trees instead of plain values. Each decoded node keeps the `path` of the node that decoded it, its `value` in the format of `getNodeValueCodec`, its absolute `preOffset` and `postOffset` cursor positions (transforms included) and the decoded nodes of its children, named after the attributes of their node, e.g. `fields`, `items` or `variant`. These codecs encode from `{ value }`.

```ts
const decoded = getNodeCodec([root, program, counterAccount]).decode(bytes);
decoded.value; // { authority: '9BbW…ftkT', count: 42n }
assertIsDecodedNode(decoded.data, 'structTypeNode');
decoded.data.fields[1].type; // { path: [..., countField, u64], value: 42n, preOffset: 32, postOffset: 40 }
```

- **Types:** one decoded node type per decodable node kind, e.g. `DecodedStructTypeNode` or `DecodedIntegerTypeNode`, as well as `DecodedNode<TNode>`, `DecodedTypeNode`, `DecodableNode`, `DecodedNodeInput`, `DecodedNodeCodec`, `EnumVariantValue`, `GetDecodedNode` and `GetDecodedNodeFromKind`. The value of a `DecodedPublicKeyTypeNode` is an `Address`.
- **Guards:** `isDecodedNode` and `assertIsDecodedNode` narrow a decoded node to a node kind.
- **Links** are transparent: they decode as the node they link to, and recursive types decode at any depth.
- **Paths:** `getDecodedNodeAtPath(decoded, pathString('config.fees[0]'))` finds the decoded node a path expression points to. It returns `undefined` for indices beyond the items of an array or set, and throws `CODAMA_ERROR__CANNOT_RESOLVE_PATH` for paths that do not fit the data. A `.data` segment crosses the `accountLink` of a public key into the data of the linked account, e.g. `mint.data.decimals`, using the decoded accounts returned by the `resolveAccountLink` option (`GetDecodedNodeAtPathOptions`).
