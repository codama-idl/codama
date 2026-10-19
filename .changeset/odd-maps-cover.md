---
'@codama/cli': minor
---

Add a `codama upgrade <idlPath> [outPath]` command that upgrades a Codama IDL written for an older major, e.g. a 1.x IDL for 2.x renderers, once and for all. The upgraded IDL overwrites the input file unless `outPath` is given, and IDLs already on the latest major are left untouched.

```sh
codama upgrade idl.json                   # Upgrades the IDL in place.
codama upgrade idl.json idl-upgraded.json # Writes the upgraded IDL to another file.
```

The command uses the `@codama/upgrade` package of your project, so IDLs are upgraded to the major your Codama packages expect, and offers to install it when it is missing, as the CLI already does for `@codama/nodes-from-anchor`. The CLI itself gains no dependency and no version check.
