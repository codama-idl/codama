---
'@codama/validators': major
---

Validate Codama v2 IDLs with new rules covering identifier collisions, contextual values, paths, interpolated intents, numeric attributes, value labels and cyclic defined types.

**BREAKING CHANGES**

**Identifier-based messages.** Items refer to identifiers instead of names, e.g. `Account has no identifier.` instead of `Account has no name.`, and the `Program has no origin.` info item is removed along with `programNode.origin`. The bump check now reads `Data field "…" cannot default to the bump of the "…" account as it may be a signer.`

**Identifier collisions.** Duplicated identifiers and distinct identifiers sharing a camelCase form are reported as errors, against the offending entry, among programs, each collection of a program, struct fields, enum variants, variable PDA seeds, and the accounts, remaining accounts, provided values and sub-instructions of an instruction. This replaces the former duplicated struct field, instruction account and instruction argument checks.

**New error-level rules.**

- Account links pointing to a missing account.
- Contextual values within instructions: `dataValueNode` paths must resolve within the instruction data, `accountValueNode`, `accountBumpValueNode` and `accountDataValueNode` accounts must be accounts of the instruction, and `accountDataValueNode`s need an account link and a path resolving within the linked account's data. Paths may cross account links through a `.data` segment (e.g. `mint.data.decimals`).
- Injected values consumed by an instruction that are neither provided nor have a fallback.
- Field discriminator paths must resolve to a struct field of their account, event or instruction data, and must not cross an account link.
- Interpolated intents of instruction displays must have valid placeholders, and their `${data.…}` and `${accounts.…}` placeholders are checked like the contextual values they stand for.
- `fixedPointTypeNode` scales must be positive integers, and `ticksPerSecond` of `dateTimeTypeNode`s and `durationTypeNode`s must be positive integers.
- Value labels on struct fields must be concrete values matching the field's type, not injected or constant values.
- Defined types in a cycle without any finite value, such as `loop = struct { next: link(loop) }`, are reported on every type of the cycle, carrying the `CODAMA_ERROR__DEFINED_TYPE_HAS_NO_FINITE_VALUE` error their codecs would throw as `cause`. Types outside a program are not checked.

**New info-level rule.** A `textNode` without plugins suggests using a plain string instead.
