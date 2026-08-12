---
'@codama/dynamic-codecs': minor
---

**Breaking**: Scalar enums (enums whose variants are all empty) are now encoded and decoded as discriminated unions, consistent with data enums.

| Case                       | Before             | After                |
| -------------------------- | ------------------ | -------------------- |
| Decoding a scalar variant  | `2`                | `{ __kind: 'Down' }` |
| Encoding a scalar variant  | `2` or `'down'`    | `{ __kind: 'Down' }` |
| `enumValueNode` resolution | `2`                | `{ __kind: 'Down' }` |

Wire bytes are unchanged; only the JavaScript value shape changes.
