# @codama/renderers-js

## 1.3.4

### Patch Changes

- [#778](https://github.com/codama-idl/codama/pull/778) [`a32c424`](https://github.com/codama-idl/codama/commit/a32c42450bea12a53ccc120e5bcee1c20868f4e0) Thanks [@macalinao](https://github.com/macalinao)! - Add docs to PDA derivation functions

- Updated dependencies []:
    - @codama/errors@1.3.3
    - @codama/nodes@1.3.3
    - @codama/visitors-core@1.3.3
    - @codama/renderers-core@1.0.19

## 1.3.3

### Patch Changes

- [#739](https://github.com/codama-idl/codama/pull/739) [`992176b`](https://github.com/codama-idl/codama/commit/992176b6ea8086bbdfbfe862192669a96df4838c) Thanks [@macalinao](https://github.com/macalinao)! - Update generated JS code to be more linter/formatter friendly

- Updated dependencies [[`b912ac8`](https://github.com/codama-idl/codama/commit/b912ac89b2d041c1f783da8d6f023fdf77dbd7e7)]:
    - @codama/visitors-core@1.3.2
    - @codama/renderers-core@1.0.18
    - @codama/errors@1.3.2
    - @codama/nodes@1.3.2

## 1.3.2

### Patch Changes

- [#733](https://github.com/codama-idl/codama/pull/733) [`3194644`](https://github.com/codama-idl/codama/commit/3194644cd029a2468afb4b66096f53b69c154508) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use type cast on generated encoder and decoder functions when dealing with fixed-size data enums. This is because the `getDiscriminatedUnion(Encoder|Decoder)` functions do not propagate the fixed-size information.

- Updated dependencies [[`71caa87`](https://github.com/codama-idl/codama/commit/71caa87d7010ecfeed5fb08e79955e5a7e8c0779)]:
    - @codama/visitors-core@1.3.1
    - @codama/renderers-core@1.0.17
    - @codama/errors@1.3.1
    - @codama/nodes@1.3.1

## 1.3.1

### Patch Changes

- [#718](https://github.com/codama-idl/codama/pull/718) [`6466226`](https://github.com/codama-idl/codama/commit/6466226471340209932a073176090b262aae0b84) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use fixed size return types — e.g. `FixedSizeCodec` or `FixedSizeEncoder` — whenever possible. This avoid fixed-size codecs to be wrongly interpreted as variable-size codecs when wrapped in other codecs.

- [#715](https://github.com/codama-idl/codama/pull/715) [`9536f33`](https://github.com/codama-idl/codama/commit/9536f337370535a6b747a0128ef0c030ae65d299) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix an issue where `getNextOptionalAccount` would not get generated even if optional accounts exist on the instruction.

## 1.3.0

### Minor Changes

- [#714](https://github.com/codama-idl/codama/pull/714) [`855c094`](https://github.com/codama-idl/codama/commit/855c094e0a47ca0cc179bd2516f6dcfda1e3d552) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use `ReadonlyUint8Arrays` with `InstructionWithData` types

- [#713](https://github.com/codama-idl/codama/pull/713) [`364578e`](https://github.com/codama-idl/codama/commit/364578e45eca74fa24b452cc9ef22222da03ba39) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update `@solana/kit` dependencies and remove `I` prefixes in types

## 1.2.14

### Patch Changes

- [#609](https://github.com/codama-idl/codama/pull/609) [`fcd0661`](https://github.com/codama-idl/codama/commit/fcd066153512fdf1cd14984514d8df56170a2e98) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Decouple nodes-from-anchor from the JS renderer

## 1.2.13

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.0
    - @codama/nodes@1.3.0
    - @codama/visitors-core@1.3.0
    - @codama/nodes-from-anchor@1.1.14
    - @codama/renderers-core@1.0.16

## 1.2.12

### Patch Changes

- Updated dependencies [[`b12908d`](https://github.com/codama-idl/codama/commit/b12908d60842773c4311ea1f6fe3ea165169712a)]:
    - @codama/nodes-from-anchor@1.1.13
    - @codama/errors@1.2.13
    - @codama/nodes@1.2.13
    - @codama/visitors-core@1.2.13
    - @codama/renderers-core@1.0.15

## 1.2.11

### Patch Changes

- [#556](https://github.com/codama-idl/codama/pull/556) [`1ee6a9b`](https://github.com/codama-idl/codama/commit/1ee6a9b77f4f4f59fdbd4425b025c4b6f2143dcd) Thanks [@spabot](https://github.com/spabot)! - Escape program error messages (fix #544)

- Updated dependencies []:
    - @codama/errors@1.2.12
    - @codama/nodes@1.2.12
    - @codama/visitors-core@1.2.12
    - @codama/nodes-from-anchor@1.1.12
    - @codama/renderers-core@1.0.14

## 1.2.10

### Patch Changes

- [#512](https://github.com/codama-idl/codama/pull/512) [`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15) Thanks [@stegaBOB](https://github.com/stegaBOB)! - Marked additional node type fields as optional

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/visitors-core@1.2.11
    - @codama/nodes@1.2.11
    - @codama/renderers-core@1.0.13
    - @codama/errors@1.2.11
    - @codama/nodes-from-anchor@1.1.11

## 1.2.9

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.10
    - @codama/nodes@1.2.10
    - @codama/visitors-core@1.2.10
    - @codama/nodes-from-anchor@1.1.10
    - @codama/renderers-core@1.0.12

## 1.2.8

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.9
    - @codama/nodes@1.2.9
    - @codama/visitors-core@1.2.9
    - @codama/nodes-from-anchor@1.1.9
    - @codama/renderers-core@1.0.11

## 1.2.7

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.8
    - @codama/nodes@1.2.8
    - @codama/visitors-core@1.2.8
    - @codama/nodes-from-anchor@1.1.8
    - @codama/renderers-core@1.0.10

## 1.2.6

### Patch Changes

- [#485](https://github.com/codama-idl/codama/pull/485) [`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2) Thanks [@steveluscher](https://github.com/steveluscher)! - The JS renderer depends on `@solana/web3.js` at version 2. That library has been renamed to `@solana/kit` starting from version 2.1. Codama has been updated to use `@solana/kit@^2.1.0` instead of `@solana/web3.js`

- Updated dependencies [[`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2)]:
    - @codama/errors@1.2.7
    - @codama/nodes@1.2.7
    - @codama/nodes-from-anchor@1.1.7
    - @codama/renderers-core@1.0.9
    - @codama/visitors-core@1.2.7

## 1.2.5

### Patch Changes

- Updated dependencies [[`59125a8`](https://github.com/codama-idl/codama/commit/59125a8ad2250b6c5acf5e445fd0316d74e46649)]:
    - @codama/nodes-from-anchor@1.1.6
    - @codama/errors@1.2.6
    - @codama/nodes@1.2.6
    - @codama/visitors-core@1.2.6
    - @codama/renderers-core@1.0.8

## 1.2.4

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/nodes@1.2.5
    - @codama/visitors-core@1.2.5
    - @codama/nodes-from-anchor@1.1.5
    - @codama/renderers-core@1.0.7

## 1.2.3

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/nodes@1.2.4
    - @codama/nodes-from-anchor@1.1.4
    - @codama/renderers-core@1.0.6
    - @codama/visitors-core@1.2.4

## 1.2.2

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/nodes@1.2.3
    - @codama/nodes-from-anchor@1.1.3
    - @codama/renderers-core@1.0.5
    - @codama/visitors-core@1.2.3

## 1.2.1

### Patch Changes

- [#425](https://github.com/codama-idl/codama/pull/425) [`7bb6920`](https://github.com/codama-idl/codama/commit/7bb6920d58d268f604889d5181c2dac0300efe0f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export `renderVisitor` function of all renderers packages as `default` export.

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/nodes@1.2.2
    - @codama/visitors-core@1.2.2
    - @codama/nodes-from-anchor@1.1.2
    - @codama/renderers-core@1.0.4

## 1.2.0

### Minor Changes

- [#415](https://github.com/codama-idl/codama/pull/415) [`3b6dd96`](https://github.com/codama-idl/codama/commit/3b6dd96430e5568b33e60eb40ebea71afbaa9677) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update the `Lamports` type to match its latest definition in version `2.0.0` and onwards.

## 1.1.2

### Patch Changes

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/nodes-from-anchor@1.1.1
    - @codama/errors@1.2.1
    - @codama/nodes@1.2.1
    - @codama/renderers-core@1.0.3
    - @codama/visitors-core@1.2.1

## 1.1.1

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- Updated dependencies [[`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b), [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7), [`d956af2`](https://github.com/codama-idl/codama/commit/d956af2db05b9499e6836b765599cacb20e179b9)]:
    - @codama/nodes@1.2.0
    - @codama/nodes-from-anchor@1.1.0
    - @codama/visitors-core@1.2.0
    - @codama/errors@1.2.0
    - @codama/renderers-core@1.0.2

## 1.1.0

### Minor Changes

- [#284](https://github.com/codama-idl/codama/pull/284) [`d1bab68`](https://github.com/codama-idl/codama/commit/d1bab68c1c987df83da9684058e1f4316d557720) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix LinkNode paths for JavaScript `getTypeManifestVisitors`

### Patch Changes

- Updated dependencies [[`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90), [`81dedc1`](https://github.com/codama-idl/codama/commit/81dedc195feab40bfc3aa676a633a8340ad56e24), [`4799a7f`](https://github.com/codama-idl/codama/commit/4799a7f291677304823aa206bed64baabc20eb5b), [`1f52f00`](https://github.com/codama-idl/codama/commit/1f52f00ba2a75a783879abfbaf4397c3e04e4db4), [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c), [`e95783b`](https://github.com/codama-idl/codama/commit/e95783bf02fd12327ca5b6f1c1c4e50e189dd241)]:
    - @codama/visitors-core@1.1.0
    - @codama/nodes-from-anchor@1.0.1
    - @codama/renderers-core@1.0.1
    - @codama/errors@1.1.0
    - @codama/nodes@1.1.0

## 1.0.1

### Patch Changes

- [#245](https://github.com/codama-idl/codama/pull/245) [`e02e2ad`](https://github.com/codama-idl/codama/commit/e02e2ad9c03caacb02c4bf24d6b7d962ba3b80c6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix JS rendering issues for instruction edge cases

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/nodes@1.0.0
    - @codama/nodes-from-anchor@1.0.0
    - @codama/renderers-core@1.0.0
    - @codama/visitors-core@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

### Patch Changes

- [#224](https://github.com/codama-idl/codama/pull/224) [`345a145`](https://github.com/codama-idl/codama/commit/345a145bb9a9b181c8db9435a46d35dacbfced41) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add an optional programAddress override to instruction builders

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/visitors-core@0.22.0
    - @codama/errors@0.22.0
    - @codama/nodes@0.22.0
    - @codama/renderers-core@0.22.0
    - @codama/nodes-from-anchor@0.22.0

## 0.21.9

### Patch Changes

- [`4f6c8a9`](https://github.com/codama-idl/codama/commit/4f6c8a971e70010d246b2691ccde847f0162b981) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Add an optional programAddress override to instruction builders

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/nodes@0.21.5
    - @codama/nodes-from-anchor@0.21.3
    - @codama/renderers-core@0.21.3
    - @codama/visitors-core@0.21.5

## 0.21.8

### Patch Changes

- [#200](https://github.com/codama-idl/codama/pull/200) [`6639091`](https://github.com/codama-idl/codama/commit/6639091714ae3b5c4330f0b1f43816fea373d55f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix a bug that reuses the same `ImportMap` within different code fragments

## 0.21.7

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/nodes@0.21.4
    - @codama/visitors-core@0.21.4
    - @codama/nodes-from-anchor@0.21.2
    - @codama/renderers-core@0.21.2

## 0.21.6

### Patch Changes

- [#123](https://github.com/codama-idl/codama/pull/123) [`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6) Thanks [@dependabot](https://github.com/apps/dependabot)! - Update prettier

- Updated dependencies [[`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    - @codama/nodes-from-anchor@0.21.1
    - @codama/visitors-core@0.21.3
    - @codama/renderers-core@0.21.1
    - @codama/errors@0.21.3
    - @codama/nodes@0.21.3

## 0.21.5

### Patch Changes

- Updated dependencies [[`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2), [`f13abb0`](https://github.com/codama-idl/codama/commit/f13abb01fc4a6fc76fe4566e3f667aab92b43480)]:
    - @codama/visitors-core@0.21.2
    - @codama/nodes-from-anchor@0.21.0
    - @codama/renderers-core@0.21.0
    - @codama/errors@0.21.2
    - @codama/nodes@0.21.2

## 0.21.4

### Patch Changes

- [#168](https://github.com/codama-idl/codama/pull/168) [`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export discriminator constants for instructions and accounts

- Updated dependencies [[`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    - @codama/visitors-core@0.21.1
    - @codama/renderers-core@0.20.8
    - @codama/nodes-from-anchor@0.20.10
    - @codama/errors@0.21.1
    - @codama/nodes@0.21.1

## 0.21.3

### Patch Changes

- [#161](https://github.com/codama-idl/codama/pull/161) [`524687c`](https://github.com/codama-idl/codama/commit/524687cfe4b1a5e7a64cd133191bc1548f580d5b) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Use lamports type/encoder/decoder for SolAmountTypeNode

- [#160](https://github.com/codama-idl/codama/pull/160) [`87bab8a`](https://github.com/codama-idl/codama/commit/87bab8ad6f2e40903064be9258a741e176eeef77) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Bump to web3js rc

## 0.21.2

### Patch Changes

- [#138](https://github.com/codama-idl/codama/pull/138) [`af8ac37`](https://github.com/codama-idl/codama/commit/af8ac374192d1c1b6c834c31fa30bc72d4b7da8e) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Use ReadonlyUint8Array for identifying accounts/instructions by data

## 0.21.1

### Patch Changes

- [#127](https://github.com/codama-idl/codama/pull/127) [`62545be`](https://github.com/codama-idl/codama/commit/62545be66e44747d7fd31f186a7a3c856ea2ad9c) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add isProgramError helper

## 0.21.0

### Minor Changes

- [#110](https://github.com/codama-idl/codama/pull/110) [`2d45383`](https://github.com/codama-idl/codama/commit/2d453830621047da2a18001ab427db9b603ad025) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderers to tp4 of web3.js

- [#111](https://github.com/codama-idl/codama/pull/111) [`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

- Updated dependencies [[`2f26050`](https://github.com/codama-idl/codama/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    - @codama/visitors-core@0.21.0
    - @codama/errors@0.21.0
    - @codama/nodes@0.21.0
    - @codama/renderers-core@0.20.7
    - @codama/nodes-from-anchor@0.20.9

## 0.20.11

### Patch Changes

- [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

- [#103](https://github.com/codama-idl/codama/pull/103) [`93942cc`](https://github.com/codama-idl/codama/commit/93942ccb8cb87d4f4ede1ef3e2398e10635dbaf2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in generated code

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f), [`4979b94`](https://github.com/codama-idl/codama/commit/4979b94720465a58538ee61bb1a4a23fd5471511)]:
    - @codama/renderers-core@0.20.6
    - @codama/errors@0.20.6
    - @codama/nodes@0.20.6
    - @codama/nodes-from-anchor@0.20.8
    - @codama/visitors-core@0.20.6

## 0.20.10

### Patch Changes

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    - @codama/nodes-from-anchor@0.20.7
    - @codama/errors@0.20.5
    - @codama/nodes@0.20.5
    - @codama/visitors-core@0.20.5
    - @codama/renderers-core@0.20.5

## 0.20.9

### Patch Changes

- [#53](https://github.com/codama-idl/codama/pull/53) [`e3e4099`](https://github.com/codama-idl/codama/commit/e3e4099e33b4d1dd9bc63e9c4997dc00426c8010) Thanks [@febo](https://github.com/febo)! - Filter out type variant on imports

## 0.20.8

### Patch Changes

- [#52](https://github.com/codama-idl/codama/pull/52) [`baeaf14`](https://github.com/codama-idl/codama/commit/baeaf1495ca592f6fdad7d10e9f0bed6f81888f1) Thanks [@lithdew](https://github.com/lithdew)! - Fix rendering PDA helper functions with a default programId.

- [#48](https://github.com/codama-idl/codama/pull/48) [`0771b9d`](https://github.com/codama-idl/codama/commit/0771b9d1c6447db85887831f921dbe92a2e0adfc) Thanks [@lithdew](https://github.com/lithdew)! - Have generated TypeScript code for renderers-js support verbatimModuleSyntax

## 0.20.7

### Patch Changes

- [#46](https://github.com/codama-idl/codama/pull/46) [`bcd5eae`](https://github.com/codama-idl/codama/commit/bcd5eaedf673432106e7cc72273e36f729cc8275) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix unused args variable on sync instruction functions on JS renderer again

## 0.20.6

### Patch Changes

- [#43](https://github.com/codama-idl/codama/pull/43) [`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Allow PdaValueNode to inline their own PdaNode definition

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/nodes@0.20.4
    - @codama/errors@0.20.4
    - @codama/renderers-core@0.20.4
    - @codama/visitors-core@0.20.4

## 0.20.5

### Patch Changes

- Updated dependencies [[`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/visitors-core@0.20.3
    - @codama/errors@0.20.3
    - @codama/renderers-core@0.20.3
    - @codama/nodes@0.20.3

## 0.20.4

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/nodes@0.20.2
    - @codama/renderers-core@0.20.2
    - @codama/visitors-core@0.20.2

## 0.20.3

### Patch Changes

- [#29](https://github.com/codama-idl/codama/pull/29) [`5794385`](https://github.com/codama-idl/codama/commit/57943852a2cf3ba6552942d9787f82657d38fafb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix unused args variable on sync instruction functions

## 0.20.2

### Patch Changes

- [`2857238`](https://github.com/codama-idl/codama/commit/28572383c1f6f6968df88be61d49b41059475d94) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderer headers and pnpm

- [#24](https://github.com/codama-idl/codama/pull/24) [`b9cd6b2`](https://github.com/codama-idl/codama/commit/b9cd6b29f4e5229512a7cc3dd28a6f6074dedd98) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix "object is not extensible" in PDA helper function

## 0.20.1

### Patch Changes

- [#21](https://github.com/codama-idl/codama/pull/21) [`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

- Updated dependencies [[`0dec0c8`](https://github.com/codama-idl/codama/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    - @codama/renderers-core@0.20.1
    - @codama/errors@0.20.1
    - @codama/nodes@0.20.1
    - @codama/visitors-core@0.20.1
