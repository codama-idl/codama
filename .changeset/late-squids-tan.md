---
'@codama/cli': patch
---

Fix the `before` configuration option crashing when given a single visitor instead of an array, as documented. Also await asynchronous visitors in `codama run`, so each visitor runs after the previous one has finished, the `RootNode` they resolve to is passed on, and the command fails when one of them rejects.
