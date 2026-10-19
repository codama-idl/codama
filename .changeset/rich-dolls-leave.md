---
'@codama/visitors-core': patch
---

Fix `ProvidedScope` resolving the fallback of a nested injection before the injection itself, which reported the fallback's key as missing even when the injection's own key was provided.
