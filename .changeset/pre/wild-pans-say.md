---
'@codama/visitors': major
---

Adapt the remaining structural visitors to Codama v2 identifiers, flat transforms and plugins, matching identifiers exactly and refusing transformations that would silently lose information.

**BREAKING CHANGES**

**Exact identifier matching.** Identifiers given to `addPdasVisitor`, `flattenStructVisitor`, `setStructDefaultValuesVisitor`, `setAccountDiscriminatorFromFieldVisitor`, `transformDefinedTypesIntoAccountsVisitor` and `unwrapDefinedTypesVisitor` are matched exactly instead of after camelCasing, since v2 identifiers keep their casing.

**camelCase collisions throw.** `addPdasVisitor` throws `CODAMA_ERROR__VISITORS__CANNOT_ADD_DUPLICATED_PDA_NAMES` when a new PDA shares a camelCase form with an existing or another new PDA of the same program. `flattenStruct` and `flattenStructVisitor` throw `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_CONFLICTING_ATTRIBUTES` when two resulting fields share a camelCase form, following the spec's casing-collision rule.

**Flattening preserves the wire format.** `flattenStruct` keeps struct fields whose struct carries `transforms` as they are, and throws `CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS` when a struct to inline carries `plugins`. The flattened struct keeps its own attributes.

**Inlining applies link transforms.** `unwrapDefinedTypesVisitor`, `unwrapTypeDefinedLinksVisitor` and `unwrapTupleEnumWithSingleStructVisitor` layer the `transforms` of the replaced link or tuple on top of the inlined type, and qualify the links inside a type inlined into another program with its original program.

**Cyclic defined types are not inlined.** `unwrapDefinedTypesVisitor` keeps defined types in a cycle made only of types to inline, such as `node = struct { next: option<link(node)> }`, along with the links to them, since inlining them would never end.

**Inline struct data required.** `setAccountDiscriminatorFromFieldVisitor` requires the account data to be an inline `structTypeNode`, since changing a linked defined type would affect every node using it. `setStructDefaultValuesVisitor` no longer has dedicated handling for instruction arguments: it updates the inline `data` struct of selected instructions like any other struct, and contextual defaults are expressed with an `injectedValueNode` and a matching `provides` entry.

**Other behaviour changes.**

- `addPdasVisitor` accepts full `PdaNodeInput`s, keeping every attribute such as `plugins`.
- `deduplicateIdenticalDefinedTypesVisitor` repoints links to the removed copies at the kept one, and only treats types as identical when every defined type they link to without an explicit program is itself deduplicated across the same programs.
- `transformDefinedTypesIntoAccountsVisitor` accepts defined types of any type, not only structs, and keeps their `docs` and `plugins`.
- `transformU8ArraysToBytesVisitor` produces a `bytesTypeNode` with a `fixedSizeTransformNode`, only converts plain `u8` items (without `unit`, `display`, `transforms` or `plugins`) and keeps the array's own `transforms` and `plugins`.
- `unwrapTupleEnumWithSingleStructVisitor` unwraps `enumVariantTypeNode`s whose data is a tuple with a single struct item or link to one, and removes the linked defined types that are no longer used.
