---
'@codama/visitors': major
---

Rework the `update*Visitor` functions for Codama v2: they match and rename nodes by exact `identifier`, reject unknown or missing targets, and repoint every reference to the nodes and members they rename.

**BREAKING CHANGES**

**`name` → `identifier`.** Every update visitor (`updateAccountsVisitor`, `updateDefinedTypesVisitor`, `updateErrorsVisitor`, `updateInstructionsVisitor` and `updateProgramsVisitor`) renames with `identifier`, including instruction accounts and data fields. Selector keys and new identifiers are used as given rather than camelCased.

```diff
  updateInstructionsVisitor({
      send: {
-         name: 'transfer',
-         accounts: { owner: { name: 'authority' } },
+         identifier: 'transfer',
+         accounts: { owner: { identifier: 'authority' } },
      },
  });
```

**Unknown keys throw.** An update containing an unrecognised key, such as v1's `name`, throws `CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS` instead of being silently ignored.

**`arguments` → path-keyed `data`.** `updateInstructionsVisitor` updates the fields of the instruction's inline `data` struct, keyed by path, and `InstructionArgumentUpdates` is replaced by `InstructionDataUpdates`. Fields behind a `definedTypeLinkNode` cannot be updated since the defined type may be shared: unwrap it first. Default values must be `ValueNode`s, so contextual defaults are expressed with an `injectedValueNode` and a matching `provides` entry.

```diff
  updateInstructionsVisitor({
      transfer: {
-         arguments: {
-             amount: { defaultValue: numberValueNode(1) },
-             bump: { defaultValue: accountBumpValueNode('vault') },
-         },
+         data: {
+             amount: { defaultValue: integerValueNode('1') },
+             'config.decimals': { identifier: 'mintDecimals' },
+             bump: { defaultValue: injectedValueNode({ key: 'bump' }) },
+         },
+         provides: { bump: accountBumpValueNode('vault') },
      },
  });
```

**`provides` merged by key.** `provides` is a record merged by identifier with the instruction's `ProvidedNode`s, where a `null` value removes an entry.

**Missing targets throw.** Updating an instruction account or a data field that does not exist throws `CODAMA_ERROR__VISITORS__INSTRUCTION_ACCOUNT_NOT_FOUND` or `CODAMA_ERROR__VISITORS__INSTRUCTION_DATA_FIELD_NOT_FOUND`. In v1, unknown arguments were silently added as extra arguments. Renaming a missing account field or defined type member throws `CODAMA_ERROR__VISITORS__ACCOUNT_FIELD_NOT_FOUND` or `CODAMA_ERROR__VISITORS__DEFINED_TYPE_MEMBER_NOT_FOUND`.

**Updates are merged per node.** All entries matching a node, such as `transfer` and `myProgram.transfer`, are merged and applied at once against the original node, and a `delete` entry wins over the others. Nodes supplied by the updates, such as default values or provided nodes, must use the new identifiers.

**Renames repoint every reference.** References are resolved through the linked nodes rather than matched by name, so links from other programs are handled and their `program` and other attributes are kept.

- Renaming a program, account, PDA, defined type or instruction renames every link pointing to it. Renaming an account also renames the PDA of the same program sharing its identifier.
- Renaming an instruction account repoints the `accountValueNode`, `accountBumpValueNode`, `accountDataValueNode`, `instructionAccountLinkNode` and `${accounts.…}` placeholders pointing to it.
- Renaming instruction data fields, account data fields or struct fields of a defined type repoints every path going through them, such as `dataValueNode`s, `accountDataValueNode`s, `fieldDiscriminatorNode`s and `${data.…}` placeholders, following defined type links and crossing account links through `.data` segments (e.g. `mint.data.decimals`).
- Renaming the variants of an enum defined type repoints the `enumValueNode`s of that type.
