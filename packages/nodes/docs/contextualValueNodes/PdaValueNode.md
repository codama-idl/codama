# `PdaValueNode`

A node that represents a PDA value. It alone can be used to derive the PDA address.

## Attributes

### Data

| Attribute | Type             | Description             |
| --------- | ---------------- | ----------------------- |
| `kind`    | `"pdaValueNode"` | The node discriminator. |

### Children

| Attribute | Type                                                                       | Description                                                                                                                                                                                          |
| --------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pda`     | [`PdaLinkNode`](../linkNodes/PdaLinkNode.md) \| [`PdaNode`](../PdaNode.md) | The PDA definition to use. It can either be a `PdaLinkNode` — therefore pointing to an existing PDA definition on the `ProgramNode` — or a direct `PdaNode` if we want to inline the PDA definition. |
| `seeds`   | [`PdaSeedValueNode`](./PdaSeedValueNode.md)[]                              | The values of all variable seeds in the PDA.                                                                                                                                                         |

## Functions

### `pdaValueNode(pda, seeds)`

Helper function that creates a `PdaValueNode` object from a PDA definition and an array of seed values. When a `string` is provided as the `pda` definition, it is used as a `PdaLinkNode`.

```ts
const node = pdaValueNode('associatedToken', [
    pdaSeedValueNode('mint', publicKeyValueNode('G345gmp34svbGxyXuCvKVVHDbqJQ66y65vVrx7m7FmBE')),
    pdaSeedValueNode('owner', publicKeyValueNode('Nzgr9bYfMRq5768bHfXsXoPTnLWAXgQNosRBxK63jRH')),
]);
```

## Examples

### A PDA value whose seeds point to other accounts

```ts
pdaValueNode('associatedToken', [
    pdaSeedValueNode('mint', accountValueNode('mint')),
    pdaSeedValueNode('owner', accountValueNode('authority')),
]);
```

### A PDA value with an inlined PDA definition

```ts
const inlinedPdaNode = pdaNode({
    name: 'associatedToken',
    seeds: [
        variablePdaSeedNode('mint', publicKeyTypeNode()),
        constantPdaSeedNode(publicKeyTypeNode(), publicKeyValueNode('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')),
        variablePdaSeedNode('owner', publicKeyTypeNode()),
    ],
});

pdaValueNode(inlinedPdaNode, [
    pdaSeedValueNode('mint', accountValueNode('mint')),
    pdaSeedValueNode('owner', accountValueNode('authority')),
]);
```
