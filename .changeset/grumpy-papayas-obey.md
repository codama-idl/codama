---
'@codama/validators': minor
---

Report instructions whose identifier is not unique among all instructions and sub-instructions of their program, at any nesting level, since instruction links and instruction account links would otherwise resolve to the wrong instruction. Duplicates within the same set of sibling instructions are still only reported once, by the existing identifier collision check.
