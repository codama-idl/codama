---
'@codama/dynamic-codecs': minor
---

**Breaking**: Enum codecs now honor `variant.discriminator` on the wire and decoded enums include a `__discriminator` field.

- Encoding writes `variant.discriminator ?? index` instead of always writing the variant position, fixing both directions for IDLs with custom discriminants. Wire bytes are unchanged when no custom discriminants are declared.
- Decoded objects gain `__discriminator` (e.g. `{ __kind: 'Up', __discriminator: 0 }`), making decode round-trippable for custom discriminants. Encoding accepts and ignores the field.
- `enumValueNode` resolution includes `__discriminator` as well.
