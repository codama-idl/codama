---
'@codama/validators': minor
---

Report instructions whose identifier collides with another instruction or sub-instruction of their program, at any nesting level, whether as an exact duplicate or once converted to camelCase, since instruction links would otherwise resolve to the wrong instruction and renderers would write flattened instructions to the same file. Collisions within the same set of sibling instructions are still only reported once, by the existing identifier collision check.
