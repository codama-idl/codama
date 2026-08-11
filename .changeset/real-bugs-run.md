---
'@codama/dynamic-instructions': patch
---

Render remaining accounts in the fallback display. Trailing account metas now appear in the field list under their group's display label (or a label derived from the group's value name), numbered when a group holds several accounts, and honouring the group's `skip` strategy. When an instruction declares several remaining-accounts groups, each non-final group consumes the run of metas matching its `isSigner` flag and the final group takes the rest.
