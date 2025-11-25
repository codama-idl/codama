---
'@codama/renderers-core': minor
---

Make RenderMaps store fragments instead of strings. This introduces a small breaking change for renderers but allows them to aggregate all fragment pages — e.g. to figure out dependencies for the whole generated library.
