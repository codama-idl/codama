---
'@codama/validators': minor
---

Report PDA, instruction and instruction account links that point to no node of their program, e.g. `pdaLinkNode('vualt')`, as errors. Links naming a program that is not in the tree point outside of it, such as the PDA of the associated token program, so they are not checked, and neither are account and defined type links to such programs anymore.
