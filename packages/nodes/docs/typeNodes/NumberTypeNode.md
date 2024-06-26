# `NumberTypeNode`

A type node representing a number with a specific format and endianess.

## Attributes

### Data

| Attribute | Type                              | Description                                                                      |
| --------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `kind`    | `"numberTypeNode"`                | The node discriminator.                                                          |
| `format`  | [`NumberFormat`](#number-formats) | The format of the number (see below for more details).                           |
| `endian`  | `"le" \| "be"`                    | The endianess of the number. `"le"` for little-endian and `"be"` for big-endian. |

### Children

_This node has no children._

## Number Formats

A number can be encoded in many different ways. The following formats are supported.

### Integers

If your number is an integer, you may choose to encode it as a signed or unsigned integer using different byte lengths. We currently support encoding integers in 1, 2, 4, 8, and 16 bytes.

| Length  | Signed integer | Unsigned integer |
| ------- | -------------- | ---------------- |
| 8-bit   | `'i8'`         | `'u8'`           |
| 16-bit  | `'i16'`        | `'u16'`          |
| 32-bit  | `'i32'`        | `'u32'`          |
| 64-bit  | `'i64'`        | `'u64'`          |
| 128-bit | `'i128'`       | `'u128'`         |

### Floating Point Numbers

If your number is a floating point number, you may choose to encode it as a 32-bit or 64-bit floating point number.

| Precision | Decimal number |
| --------- | -------------- |
| 32-bit    | `'f32'`        |
| 64-bit    | `'f64'`        |

### Variable Length Integers

We also support encoding integers using variable byte lengths. Currently, we support the `shortU16` encoding which works as follows:

| Format     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shortU16` | Stores an unsigned integer using between 1 to 3 bytes depending on the value of that integer. If the provided integer is equal to or lower than `0x7f`, it will be stored as-is, using a single byte. However, if the integer is above `0x7f`, then the top bit is set and the remaining value is stored in the next bytes. Each byte follows the same pattern until the third byte. The third byte, if needed, uses all 8 bits to store the last byte of the original value. |

## Functions

### `numberTypeNode(format, endian)`

Helper function that creates a `NumberTypeNode` object from a provided format and endianess.

```ts
const littleEndianNode = numberTypeNode('u32'); // Little-endian by default.

const bigEndianNode = numberTypeNode('u32', 'be');
```

### `isSignedInteger(node)`

Checks if the provided `NumberTypeNode` represents a signed integer.

```ts
isSignedInteger(numberTypeNode('u32')); // false
isSignedInteger(numberTypeNode('i32')); // true
```

### `isUnsignedInteger(node)`

Checks if the provided `NumberTypeNode` represents an unsigned integer.

```ts
isUnsignedInteger(numberTypeNode('u32')); // true
isUnsignedInteger(numberTypeNode('i32')); // false
```

### `isInteger(node)`

Checks if the provided `NumberTypeNode` represents an integer.

```ts
isInteger(numberTypeNode('u32')); // true
isInteger(numberTypeNode('i32')); // true
isInteger(numberTypeNode('f32')); // false
```

### `isDecimal(node)`

Checks if the provided `NumberTypeNode` represents a decimal number.

```ts
isDecimal(numberTypeNode('u32')); // false
isDecimal(numberTypeNode('i32')); // false
isDecimal(numberTypeNode('f32')); // true
```

## Examples

### Encoding `u32` integers

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/4bb1ae23-c69f-4c9f-a7ec-8f971d061667)

```ts
numberTypeNode('u32');
```

| Value  | Bytes      |
| ------ | ---------- |
| 0      | `00000000` |
| 42     | `2A000000` |
| 65 535 | `FFFF0000` |

### Encoding `f32` big-endian decimal numbers

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/d9cbfd3c-b8a2-4c13-a8a8-a11e7ed5d422)

```ts
numberTypeNode('f32', 'be');
```

| Value  | Bytes      |
| ------ | ---------- |
| 1      | `3F800000` |
| -42    | `C2280000` |
| 3.1415 | `40490E56` |

### Encoding `shortU16` integers

![Diagram](https://github.com/kinobi-so/kinobi/assets/3642397/73e12166-cdaa-4fca-ae2a-67937f8b130e)

```ts
numberTypeNode('shortU16');
```

| Value  | Bytes    |
| ------ | -------- |
| 42     | `2A`     |
| 128    | `8001`   |
| 16 384 | `808001` |
