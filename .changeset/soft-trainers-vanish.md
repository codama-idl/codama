---
"@codama/errors": patch
"@codama/renderers-js": patch
---

The JS renderer depends on `@solana/web3.js` at version 2. That library has been renamed to `@solana/kit` starting from version 2.1. Codama has been updated to use `@solana/kit@^2.1.0` instead of `@solana/web3.js`
