# `PublicKeyValueNode`

A node that represents the value of a 32-bytes public key.

## Attributes

### Data

| Attribute    | Type                   | Description                                  |
| ------------ | ---------------------- | -------------------------------------------- |
| `kind`       | `"publicKeyValueNode"` | The node discriminator.                      |
| `publicKey`  | `string`               | The base58 encoded public key.               |
| `identifier` | `string`               | (Optional) An identifier for the public key. |

### Children

_This node has no children._

## Functions

### `publicKeyValueNode(publicKey, identifier?)`

Helper function that creates a `PublicKeyValueNode` object from a base58 encoded public key and an optional identifier.

```ts
const node = publicKeyValueNode('7rA1KcBdW5hKmMasQdRVBFsD6T1nLtYuR6y59TJNgevR');
```
