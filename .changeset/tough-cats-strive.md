---
'@codama/visitors-core': minor
---

Regenerate `identityVisitor` and `mergeVisitor` from `@codama/spec` via the new `visitorsCore` generator in `@codama-internal/spec-generators`. Both visitors previously lived as ~1100 lines of hand-written per-node dispatch; the mechanical walk now lives under `src/generated/`. `src/identityVisitor.ts` is now a thin wrapper layering six semantic overrides (enum-variant empty-downgrade, hidden-prefix/suffix empty-bypass, conditional-value null-collapse, resolver empty-dependsOn collapse) via `extendVisitor`; `src/mergeVisitor.ts` ships directly from the generated tree.

Three behaviour changes shake out:

- **`enumTypeNode.size` and `pdaValueNode.programId` are now actually walked by `identityVisitor`.** The hand-written code passed both through unchanged, silently dropping any caller-applied transforms.
- **Every required-array child attribute now uniformly tolerates `undefined` at runtime.** The hand-written guard previously applied only to `programNode.events` and `programNode.constants`. Making it uniform lets `identityVisitor` safely normalise a partial IDL JSON parsed via `createFromJson`. A follow-up PR will promote the affected `programNode` children to `optionalAttribute(...)` on the spec side, after which the guard becomes naturally derivable from the spec.
- **`enumStructVariantTypeNode.discriminator` and `enumTupleVariantTypeNode.discriminator` are now preserved** when the variant survives the wrapper's empty-downgrade.
