# @codama/renderers-rust

## 1.1.3

### Patch Changes

- Updated dependencies [[`71caa87`](https://github.com/codama-idl/codama/commit/71caa87d7010ecfeed5fb08e79955e5a7e8c0779)]:
    - @codama/visitors-core@1.3.1
    - @codama/renderers-core@1.0.17
    - @codama/errors@1.3.1
    - @codama/nodes@1.3.1

## 1.1.2

### Patch Changes

- [#721](https://github.com/codama-idl/codama/pull/721) [`a305a91`](https://github.com/codama-idl/codama/commit/a305a91e04d2d420ac57c31ccbb0ea98fc7f8823) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export discriminator constants for accounts and instructions

## 1.1.1

### Patch Changes

- [#713](https://github.com/codama-idl/codama/pull/713) [`364578e`](https://github.com/codama-idl/codama/commit/364578e45eca74fa24b452cc9ef22222da03ba39) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update `@solana/kit` dependencies and remove `I` prefixes in types

## 1.1.0

### Minor Changes

- [#641](https://github.com/codama-idl/codama/pull/641) [`dbeea53`](https://github.com/codama-idl/codama/commit/dbeea5302d39f1673f31397c71f3bcd94c09044b) Thanks [@sonicfromnewyoke](https://github.com/sonicfromnewyoke)! - Extract `solana-instruction` from `solana-program`

- [#647](https://github.com/codama-idl/codama/pull/647) [`dcedfb5`](https://github.com/codama-idl/codama/commit/dcedfb56c1062fbc3b00e3cba9c5f21622acad91) Thanks [@sonicfromnewyoke](https://github.com/sonicfromnewyoke)! - extract entrypoint and error from solana-program

- [#535](https://github.com/codama-idl/codama/pull/535) [`ae3ca97`](https://github.com/codama-idl/codama/commit/ae3ca97d2df4f088cd243129c5625731a45d128e) Thanks [@buffalojoec](https://github.com/buffalojoec)! - renderers-rust: extract pubkey from solana-program

- [#654](https://github.com/codama-idl/codama/pull/654) [`480026d`](https://github.com/codama-idl/codama/commit/480026d2bdd6947e6fcdf1d232fb4dfeec973e67) Thanks [@sonicfromnewyoke](https://github.com/sonicfromnewyoke)! - extract solana-cpi, solana-msg and cleanup

- [#645](https://github.com/codama-idl/codama/pull/645) [`8caf59d`](https://github.com/codama-idl/codama/commit/8caf59d3ceec3210bcbbc74322bf90651fd1fab8) Thanks [@sonicfromnewyoke](https://github.com/sonicfromnewyoke)! - extract `solana-account-info` from `solana-program` & `solana-account` from `solana-sdk`

## 1.0.22

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.3.0
    - @codama/nodes@1.3.0
    - @codama/visitors-core@1.3.0
    - @codama/renderers-core@1.0.16

## 1.0.21

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.13
    - @codama/nodes@1.2.13
    - @codama/visitors-core@1.2.13
    - @codama/renderers-core@1.0.15

## 1.0.20

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.12
    - @codama/nodes@1.2.12
    - @codama/visitors-core@1.2.12
    - @codama/renderers-core@1.0.14

## 1.0.19

### Patch Changes

- [#512](https://github.com/codama-idl/codama/pull/512) [`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15) Thanks [@stegaBOB](https://github.com/stegaBOB)! - Marked additional node type fields as optional

- Updated dependencies [[`5071455`](https://github.com/codama-idl/codama/commit/5071455b05359fc427c1d6295e7abb0e39503a15)]:
    - @codama/visitors-core@1.2.11
    - @codama/nodes@1.2.11
    - @codama/renderers-core@1.0.13
    - @codama/errors@1.2.11

## 1.0.18

### Patch Changes

- [#514](https://github.com/codama-idl/codama/pull/514) [`d5b01d6`](https://github.com/codama-idl/codama/commit/d5b01d665c890182a03e7c266f093f2950149db5) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Add `#[allow(clippy::arithmetic_side_effects)]` to the list of clippy ignores on top of various instruction methods generated by the Rust renderer."

- Updated dependencies []:
    - @codama/errors@1.2.10
    - @codama/nodes@1.2.10
    - @codama/visitors-core@1.2.10
    - @codama/renderers-core@1.0.12

## 1.0.17

### Patch Changes

- [#510](https://github.com/codama-idl/codama/pull/510) [`2b45bad`](https://github.com/codama-idl/codama/commit/2b45badbc800d862d478f19b8231daf2a88d6d56) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Patch a few compile errors in the account `fetch` API.

- Updated dependencies []:
    - @codama/errors@1.2.9
    - @codama/nodes@1.2.9
    - @codama/visitors-core@1.2.9
    - @codama/renderers-core@1.0.11

## 1.0.16

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.8
    - @codama/nodes@1.2.8
    - @codama/visitors-core@1.2.8
    - @codama/renderers-core@1.0.10

## 1.0.15

### Patch Changes

- Updated dependencies [[`7e275ab`](https://github.com/codama-idl/codama/commit/7e275ab51c6d1b20b54ea9f4976b0692a308b2d2)]:
    - @codama/errors@1.2.7
    - @codama/nodes@1.2.7
    - @codama/renderers-core@1.0.9
    - @codama/visitors-core@1.2.7

## 1.0.14

### Patch Changes

- Updated dependencies []:
    - @codama/errors@1.2.6
    - @codama/nodes@1.2.6
    - @codama/visitors-core@1.2.6
    - @codama/renderers-core@1.0.8

## 1.0.13

### Patch Changes

- [#440](https://github.com/codama-idl/codama/pull/440) [`4867be4`](https://github.com/codama-idl/codama/commit/4867be42104bb786ce8cb9de3a55ba27aa79e719) Thanks [@febo](https://github.com/febo)! - Use borsh::to_vec in rust renderer

- Updated dependencies []:
    - @codama/errors@1.2.5
    - @codama/nodes@1.2.5
    - @codama/visitors-core@1.2.5
    - @codama/renderers-core@1.0.7

## 1.0.12

### Patch Changes

- Updated dependencies [[`f0c2190`](https://github.com/codama-idl/codama/commit/f0c219076af58c098319f4ca9494a98e198d99a1)]:
    - @codama/errors@1.2.4
    - @codama/nodes@1.2.4
    - @codama/renderers-core@1.0.6
    - @codama/visitors-core@1.2.4

## 1.0.11

### Patch Changes

- Updated dependencies [[`4ceeb5e`](https://github.com/codama-idl/codama/commit/4ceeb5e6c479690fe878d25af6a5d48953adfa6a)]:
    - @codama/errors@1.2.3
    - @codama/nodes@1.2.3
    - @codama/renderers-core@1.0.5
    - @codama/visitors-core@1.2.3

## 1.0.10

### Patch Changes

- [#425](https://github.com/codama-idl/codama/pull/425) [`7bb6920`](https://github.com/codama-idl/codama/commit/7bb6920d58d268f604889d5181c2dac0300efe0f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Export `renderVisitor` function of all renderers packages as `default` export.

- Updated dependencies []:
    - @codama/errors@1.2.2
    - @codama/nodes@1.2.2
    - @codama/visitors-core@1.2.2
    - @codama/renderers-core@1.0.4

## 1.0.9

### Patch Changes

- [#401](https://github.com/codama-idl/codama/pull/401) [`18e75fe`](https://github.com/codama-idl/codama/commit/18e75fe8a6cf24110c90a073eb7685b23843c11b) Thanks [@wjthieme](https://github.com/wjthieme)! - Fix a bug where types from sharedPage where not qualified correctly in the account fetch functions

- [#348](https://github.com/codama-idl/codama/pull/348) [`f70b407`](https://github.com/codama-idl/codama/commit/f70b407594e3af00bb09d27bfe947f6c0312677a) Thanks [@Nagaprasadvr](https://github.com/Nagaprasadvr)! - Add `Debug` trait to instruction structs

## 1.0.8

### Patch Changes

- [#405](https://github.com/codama-idl/codama/pull/405) [`9f497fd`](https://github.com/codama-idl/codama/commit/9f497fd81250bbc8453390eb01a17509c6cfde09) Thanks [@wjthieme](https://github.com/wjthieme)! - bug: serde serialize/deserialize big arrays

## 1.0.7

### Patch Changes

- [#299](https://github.com/codama-idl/codama/pull/299) [`459492c`](https://github.com/codama-idl/codama/commit/459492ca474996981ba2ac414b215a9d28270482) Thanks [@wjthieme](https://github.com/wjthieme)! - Add account fetching helper functions to rust client

- Updated dependencies [[`92efaa9`](https://github.com/codama-idl/codama/commit/92efaa9261f38de10a1b691c5b25ea0ecf95360b)]:
    - @codama/errors@1.2.1
    - @codama/nodes@1.2.1
    - @codama/renderers-core@1.0.3
    - @codama/visitors-core@1.2.1

## 1.0.6

### Patch Changes

- [#380](https://github.com/codama-idl/codama/pull/380) [`eca0e76`](https://github.com/codama-idl/codama/commit/eca0e7670d65eaa772793095690d8e170c977a8f) Thanks [@buffalojoec](https://github.com/buffalojoec)! - add decode-error trait to errors

## 1.0.5

### Patch Changes

- [#334](https://github.com/codama-idl/codama/pull/334) [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Bump dependencies

- [#366](https://github.com/codama-idl/codama/pull/366) [`3014e3b`](https://github.com/codama-idl/codama/commit/3014e3b453a80ae374d987475d29579541d4bbf7) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Use trait options for instruction data

- Updated dependencies [[`a3225b0`](https://github.com/codama-idl/codama/commit/a3225b0e68e59746f911865653bb1d05c3aec22b), [`2622727`](https://github.com/codama-idl/codama/commit/2622727abf05788bf9dac51a324cfc0a1e0685a7)]:
    - @codama/nodes@1.2.0
    - @codama/visitors-core@1.2.0
    - @codama/errors@1.2.0
    - @codama/renderers-core@1.0.2

## 1.0.4

### Patch Changes

- Updated dependencies [[`c31eea8`](https://github.com/codama-idl/codama/commit/c31eea83c3f8659094324acc2b780054d72b7e90), [`81dedc1`](https://github.com/codama-idl/codama/commit/81dedc195feab40bfc3aa676a633a8340ad56e24), [`4799a7f`](https://github.com/codama-idl/codama/commit/4799a7f291677304823aa206bed64baabc20eb5b), [`1f52f00`](https://github.com/codama-idl/codama/commit/1f52f00ba2a75a783879abfbaf4397c3e04e4db4), [`ce4936c`](https://github.com/codama-idl/codama/commit/ce4936c031a2ba07f1bdb52cab8debcfec810d8c), [`e95783b`](https://github.com/codama-idl/codama/commit/e95783bf02fd12327ca5b6f1c1c4e50e189dd241)]:
    - @codama/visitors-core@1.1.0
    - @codama/renderers-core@1.0.1
    - @codama/errors@1.1.0
    - @codama/nodes@1.1.0

## 1.0.3

### Patch Changes

- [#250](https://github.com/codama-idl/codama/pull/250) [`0c96251`](https://github.com/codama-idl/codama/commit/0c962519c470d6dcc29fcb3db6195b06222fac5d) Thanks [@febo](https://github.com/febo)! - Add anchorTraits option to Rust renderer

## 1.0.2

### Patch Changes

- [#246](https://github.com/codama-idl/codama/pull/246) [`aa6dcd1`](https://github.com/codama-idl/codama/commit/aa6dcd16fbc734c2647a1a920a224dc90c4c0b18) Thanks [@febo](https://github.com/febo)! - Fix Rust rendering when account list is empty

- [#245](https://github.com/codama-idl/codama/pull/245) [`e02e2ad`](https://github.com/codama-idl/codama/commit/e02e2ad9c03caacb02c4bf24d6b7d962ba3b80c6) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix JS rendering issues for instruction edge cases

- [#242](https://github.com/codama-idl/codama/pull/242) [`d4736da`](https://github.com/codama-idl/codama/commit/d4736daef236a8c41d53fe1f999f32b9bcbfb8c9) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add options to configure how traits are rendered in Rust

## 1.0.1

### Patch Changes

- [#238](https://github.com/codama-idl/codama/pull/238) [`8dc7092`](https://github.com/codama-idl/codama/commit/8dc70921ba9f37bb8f3f654b82a3b5f3ffbc1339) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix missing semicolon in generated Rust code

## 1.0.0

### Major Changes

- [#236](https://github.com/codama-idl/codama/pull/236) [`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Publish codama v1 packages

### Patch Changes

- Updated dependencies [[`4057b0d`](https://github.com/codama-idl/codama/commit/4057b0d6bb28a207ff6d473aa117d81336a323d8)]:
    - @codama/errors@1.0.0
    - @codama/nodes@1.0.0
    - @codama/renderers-core@1.0.0
    - @codama/visitors-core@1.0.0

## 0.22.0

### Minor Changes

- [#183](https://github.com/codama-idl/codama/pull/183) [`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `InstructionLinkNode`, `InstructionAccountLinkNode` and `InstructionArgumentLinkNode`

- [#175](https://github.com/codama-idl/codama/pull/175) [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Remove `importFrom` attributes from link nodes and resolvers

    Instead, a new `linkOverrides` attribute is introduced on all renderers to redirect a link node or a resolver to a custom path or module.

### Patch Changes

- Updated dependencies [[`c8c5934`](https://github.com/codama-idl/codama/commit/c8c593466294f3ec7dca1fb828254e10aa312925), [`2b1259b`](https://github.com/codama-idl/codama/commit/2b1259b566aa439ca61c28f7ef72ff9c0817e540), [`93a318a`](https://github.com/codama-idl/codama/commit/93a318a9b7ee435eb37934b0ab390e160d50968b)]:
    - @codama/visitors-core@0.22.0
    - @codama/errors@0.22.0
    - @codama/nodes@0.22.0
    - @codama/renderers-core@0.22.0

## 0.21.8

### Patch Changes

- [#231](https://github.com/codama-idl/codama/pull/231) [`3c18cee`](https://github.com/codama-idl/codama/commit/3c18ceeffb97922db500138af85d20fce00f80b2) Thanks [@aoikurokawa](https://github.com/aoikurokawa)! - Fix typo in generated comment

## 0.21.7

### Patch Changes

- Updated dependencies [[`a6849d3`](https://github.com/codama-idl/codama/commit/a6849d36a828e2b6b703f2a86d2ea0ae6d2fa0d8)]:
    - @codama/errors@0.21.5
    - @codama/nodes@0.21.5
    - @codama/renderers-core@0.21.3
    - @codama/visitors-core@0.21.5

## 0.21.6

### Patch Changes

- Updated dependencies []:
    - @codama/errors@0.21.4
    - @codama/nodes@0.21.4
    - @codama/visitors-core@0.21.4
    - @codama/renderers-core@0.21.2

## 0.21.5

### Patch Changes

- Updated dependencies [[`59ceb1d`](https://github.com/codama-idl/codama/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    - @codama/visitors-core@0.21.3
    - @codama/renderers-core@0.21.1
    - @codama/errors@0.21.3
    - @codama/nodes@0.21.3

## 0.21.4

### Patch Changes

- Updated dependencies [[`23e3dc2`](https://github.com/codama-idl/codama/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/codama-idl/codama/commit/33de84386af661dc870b248b5301dafe1df2aba2), [`f13abb0`](https://github.com/codama-idl/codama/commit/f13abb01fc4a6fc76fe4566e3f667aab92b43480)]:
    - @codama/visitors-core@0.21.2
    - @codama/renderers-core@0.21.0
    - @codama/errors@0.21.2
    - @codama/nodes@0.21.2

## 0.21.3

### Patch Changes

- Updated dependencies [[`2e8ce36`](https://github.com/codama-idl/codama/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    - @codama/visitors-core@0.21.1
    - @codama/renderers-core@0.20.8
    - @codama/errors@0.21.1
    - @codama/nodes@0.21.1

## 0.21.2

### Patch Changes

- [#160](https://github.com/codama-idl/codama/pull/160) [`87bab8a`](https://github.com/codama-idl/codama/commit/87bab8ad6f2e40903064be9258a741e176eeef77) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Bump to web3js rc

## 0.21.1

### Patch Changes

- [#152](https://github.com/codama-idl/codama/pull/152) [`33cc3b7`](https://github.com/codama-idl/codama/commit/33cc3b7d29e60f5c0bd746f229187c1747755fbb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Support type aliases from `DefinedTypeNodes`

- [#144](https://github.com/codama-idl/codama/pull/144) [`dc04203`](https://github.com/codama-idl/codama/commit/dc04203f427502614a6300fd9b7fa7b0a7d61930) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add support for ShortU16 and ShortVec

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

## 0.20.12

### Patch Changes

- [#102](https://github.com/codama-idl/codama/pull/102) [`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in codama

- Updated dependencies [[`bcf6a23`](https://github.com/codama-idl/codama/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    - @codama/renderers-core@0.20.6
    - @codama/errors@0.20.6
    - @codama/nodes@0.20.6
    - @codama/visitors-core@0.20.6

## 0.20.11

### Patch Changes

- Updated dependencies [[`908acba`](https://github.com/codama-idl/codama/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/codama-idl/codama/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    - @codama/errors@0.20.5
    - @codama/nodes@0.20.5
    - @codama/visitors-core@0.20.5
    - @codama/renderers-core@0.20.5

## 0.20.10

### Patch Changes

- [#56](https://github.com/codama-idl/codama/pull/56) [`cde409c`](https://github.com/codama-idl/codama/commit/cde409c6132a66a27091bfb7025904e70b7689a4) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Rust Renderer: Add toolchain arg to formatter

## 0.20.9

### Patch Changes

- [#54](https://github.com/codama-idl/codama/pull/54) [`5b8186f`](https://github.com/codama-idl/codama/commit/5b8186f0231e767bba7fa02a201eb7dcb87591a3) Thanks [@febo](https://github.com/febo)! - Add support to Anchor idl build for account types

## 0.20.8

### Patch Changes

- [#50](https://github.com/codama-idl/codama/pull/50) [`6a8c6c3`](https://github.com/codama-idl/codama/commit/6a8c6c3b4c8eddbbf126b864fefab104c8758010) Thanks [@febo](https://github.com/febo)! - Add anchor traits impl for accounts

## 0.20.7

### Patch Changes

- [#45](https://github.com/codama-idl/codama/pull/45) [`378f007`](https://github.com/codama-idl/codama/commit/378f007345bda028e31cdd9d4e34ce8279257485) Thanks [@febo](https://github.com/febo)! - Add copy derive to scalar enums in Rust renderer

- Updated dependencies [[`668b550`](https://github.com/codama-idl/codama/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    - @codama/nodes@0.20.4
    - @codama/errors@0.20.4
    - @codama/renderers-core@0.20.4
    - @codama/visitors-core@0.20.4

## 0.20.6

### Patch Changes

- Updated dependencies [[`d938e04`](https://github.com/codama-idl/codama/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/codama-idl/codama/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    - @codama/visitors-core@0.20.3
    - @codama/errors@0.20.3
    - @codama/renderers-core@0.20.3
    - @codama/nodes@0.20.3

## 0.20.5

### Patch Changes

- [`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

- Updated dependencies [[`964776f`](https://github.com/codama-idl/codama/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    - @codama/errors@0.20.2
    - @codama/nodes@0.20.2
    - @codama/renderers-core@0.20.2
    - @codama/visitors-core@0.20.2

## 0.20.4

### Patch Changes

- [#27](https://github.com/codama-idl/codama/pull/27) [`46bfc2d`](https://github.com/codama-idl/codama/commit/46bfc2dd3609dc63e7d05e30dd1d196c9e8903cf) Thanks [@samuelvanderwaal](https://github.com/samuelvanderwaal)! - Make rust docs codama link clickable

- [#32](https://github.com/codama-idl/codama/pull/32) [`3645d92`](https://github.com/codama-idl/codama/commit/3645d92845db3582b801f2a32f1c36e6b478b754) Thanks [@febo](https://github.com/febo)! - Add default impl for instruction data struct in Rust renderer

- [#31](https://github.com/codama-idl/codama/pull/31) [`e0ea30c`](https://github.com/codama-idl/codama/commit/e0ea30c168bcdc1cb376cf8ca6bd4bb76778acf2) Thanks [@febo](https://github.com/febo)! - Render error codes on Rust renderer

## 0.20.3

### Patch Changes

- [#25](https://github.com/codama-idl/codama/pull/25) [`2382631`](https://github.com/codama-idl/codama/commit/238263129b61df67f010b47cd9229b2662eaccb2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix generated PDA prefix

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
