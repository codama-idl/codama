# @kinobi-so/renderers-rust

## 0.21.6

### Patch Changes

-   Updated dependencies []:
    -   @kinobi-so/errors@0.21.4
    -   @kinobi-so/nodes@0.21.4
    -   @kinobi-so/visitors-core@0.21.4
    -   @kinobi-so/renderers-core@0.21.2

## 0.21.5

### Patch Changes

-   Updated dependencies [[`59ceb1d`](https://github.com/kinobi-so/kinobi/commit/59ceb1d7803307b3a1a5e23ea3267934ad87bfc6)]:
    -   @kinobi-so/visitors-core@0.21.3
    -   @kinobi-so/renderers-core@0.21.1
    -   @kinobi-so/errors@0.21.3
    -   @kinobi-so/nodes@0.21.3

## 0.21.4

### Patch Changes

-   Updated dependencies [[`23e3dc2`](https://github.com/kinobi-so/kinobi/commit/23e3dc2da6072fefc40e8205c19e44b646aa40a0), [`33de843`](https://github.com/kinobi-so/kinobi/commit/33de84386af661dc870b248b5301dafe1df2aba2), [`f13abb0`](https://github.com/kinobi-so/kinobi/commit/f13abb01fc4a6fc76fe4566e3f667aab92b43480)]:
    -   @kinobi-so/visitors-core@0.21.2
    -   @kinobi-so/renderers-core@0.21.0
    -   @kinobi-so/errors@0.21.2
    -   @kinobi-so/nodes@0.21.2

## 0.21.3

### Patch Changes

-   Updated dependencies [[`2e8ce36`](https://github.com/kinobi-so/kinobi/commit/2e8ce36af43a853673b0805c86a62672869de487)]:
    -   @kinobi-so/visitors-core@0.21.1
    -   @kinobi-so/renderers-core@0.20.8
    -   @kinobi-so/errors@0.21.1
    -   @kinobi-so/nodes@0.21.1

## 0.21.2

### Patch Changes

-   [#160](https://github.com/kinobi-so/kinobi/pull/160) [`87bab8a`](https://github.com/kinobi-so/kinobi/commit/87bab8ad6f2e40903064be9258a741e176eeef77) Thanks [@mcintyre94](https://github.com/mcintyre94)! - Bump to web3js rc

## 0.21.1

### Patch Changes

-   [#152](https://github.com/kinobi-so/kinobi/pull/152) [`33cc3b7`](https://github.com/kinobi-so/kinobi/commit/33cc3b7d29e60f5c0bd746f229187c1747755fbb) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Support type aliases from `DefinedTypeNodes`

-   [#144](https://github.com/kinobi-so/kinobi/pull/144) [`dc04203`](https://github.com/kinobi-so/kinobi/commit/dc04203f427502614a6300fd9b7fa7b0a7d61930) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add support for ShortU16 and ShortVec

## 0.21.0

### Minor Changes

-   [#110](https://github.com/kinobi-so/kinobi/pull/110) [`2d45383`](https://github.com/kinobi-so/kinobi/commit/2d453830621047da2a18001ab427db9b603ad025) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderers to tp4 of web3.js

-   [#111](https://github.com/kinobi-so/kinobi/pull/111) [`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Add `RemainderOptionTypeNode`

    A node that represents an optional item using a child `TypeNode` such that the item can either be present — i.e. `Some<T>` — or absent — i.e. `None` — depending on whether or not there are remaining bytes in the buffer.

### Patch Changes

-   Updated dependencies [[`2f26050`](https://github.com/kinobi-so/kinobi/commit/2f26050ddbcbdefcefbd853e1017a30c94442e1f)]:
    -   @kinobi-so/visitors-core@0.21.0
    -   @kinobi-so/errors@0.21.0
    -   @kinobi-so/nodes@0.21.0
    -   @kinobi-so/renderers-core@0.20.7

## 0.20.12

### Patch Changes

-   [#102](https://github.com/kinobi-so/kinobi/pull/102) [`bcf6a23`](https://github.com/kinobi-so/kinobi/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Replace \_\_DEV\_\_ with NODE_ENV is not production in Kinobi

-   Updated dependencies [[`bcf6a23`](https://github.com/kinobi-so/kinobi/commit/bcf6a23fa0e0d1f1a064ea6ddcfc9c092190a51f)]:
    -   @kinobi-so/renderers-core@0.20.6
    -   @kinobi-so/errors@0.20.6
    -   @kinobi-so/nodes@0.20.6
    -   @kinobi-so/visitors-core@0.20.6

## 0.20.11

### Patch Changes

-   Updated dependencies [[`908acba`](https://github.com/kinobi-so/kinobi/commit/908acba99cdb0b761ed79aebf6828e23fde97ef8), [`88572e8`](https://github.com/kinobi-so/kinobi/commit/88572e8eaffe09b5b8c48c4e9aebfdeb8bc149e6)]:
    -   @kinobi-so/errors@0.20.5
    -   @kinobi-so/nodes@0.20.5
    -   @kinobi-so/visitors-core@0.20.5
    -   @kinobi-so/renderers-core@0.20.5

## 0.20.10

### Patch Changes

-   [#56](https://github.com/kinobi-so/kinobi/pull/56) [`cde409c`](https://github.com/kinobi-so/kinobi/commit/cde409c6132a66a27091bfb7025904e70b7689a4) Thanks [@buffalojoec](https://github.com/buffalojoec)! - Rust Renderer: Add toolchain arg to formatter

## 0.20.9

### Patch Changes

-   [#54](https://github.com/kinobi-so/kinobi/pull/54) [`5b8186f`](https://github.com/kinobi-so/kinobi/commit/5b8186f0231e767bba7fa02a201eb7dcb87591a3) Thanks [@febo](https://github.com/febo)! - Add support to Anchor idl build for account types

## 0.20.8

### Patch Changes

-   [#50](https://github.com/kinobi-so/kinobi/pull/50) [`6a8c6c3`](https://github.com/kinobi-so/kinobi/commit/6a8c6c3b4c8eddbbf126b864fefab104c8758010) Thanks [@febo](https://github.com/febo)! - Add anchor traits impl for accounts

## 0.20.7

### Patch Changes

-   [#45](https://github.com/kinobi-so/kinobi/pull/45) [`378f007`](https://github.com/kinobi-so/kinobi/commit/378f007345bda028e31cdd9d4e34ce8279257485) Thanks [@febo](https://github.com/febo)! - Add copy derive to scalar enums in Rust renderer

-   Updated dependencies [[`668b550`](https://github.com/kinobi-so/kinobi/commit/668b550aa2172c24ddb3b8751d91e67e94a93fa4)]:
    -   @kinobi-so/nodes@0.20.4
    -   @kinobi-so/errors@0.20.4
    -   @kinobi-so/renderers-core@0.20.4
    -   @kinobi-so/visitors-core@0.20.4

## 0.20.6

### Patch Changes

-   Updated dependencies [[`d938e04`](https://github.com/kinobi-so/kinobi/commit/d938e04b8cf5765c5bb2b68916b29e892fd5ad70), [`4bc5823`](https://github.com/kinobi-so/kinobi/commit/4bc5823377824198bd5a6432d16333b2cb1d8b8c)]:
    -   @kinobi-so/visitors-core@0.20.3
    -   @kinobi-so/errors@0.20.3
    -   @kinobi-so/renderers-core@0.20.3
    -   @kinobi-so/nodes@0.20.3

## 0.20.5

### Patch Changes

-   [`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix invalid package dependencies

-   Updated dependencies [[`964776f`](https://github.com/kinobi-so/kinobi/commit/964776fe73402c236d334032821013674c3b1a5e)]:
    -   @kinobi-so/errors@0.20.2
    -   @kinobi-so/nodes@0.20.2
    -   @kinobi-so/renderers-core@0.20.2
    -   @kinobi-so/visitors-core@0.20.2

## 0.20.4

### Patch Changes

-   [#27](https://github.com/kinobi-so/kinobi/pull/27) [`46bfc2d`](https://github.com/kinobi-so/kinobi/commit/46bfc2dd3609dc63e7d05e30dd1d196c9e8903cf) Thanks [@samuelvanderwaal](https://github.com/samuelvanderwaal)! - Make rust docs kinobi link clickable

-   [#32](https://github.com/kinobi-so/kinobi/pull/32) [`3645d92`](https://github.com/kinobi-so/kinobi/commit/3645d92845db3582b801f2a32f1c36e6b478b754) Thanks [@febo](https://github.com/febo)! - Add default impl for instruction data struct in Rust renderer

-   [#31](https://github.com/kinobi-so/kinobi/pull/31) [`e0ea30c`](https://github.com/kinobi-so/kinobi/commit/e0ea30c168bcdc1cb376cf8ca6bd4bb76778acf2) Thanks [@febo](https://github.com/febo)! - Render error codes on Rust renderer

## 0.20.3

### Patch Changes

-   [#25](https://github.com/kinobi-so/kinobi/pull/25) [`2382631`](https://github.com/kinobi-so/kinobi/commit/238263129b61df67f010b47cd9229b2662eaccb2) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix generated PDA prefix

## 0.20.2

### Patch Changes

-   [`2857238`](https://github.com/kinobi-so/kinobi/commit/28572383c1f6f6968df88be61d49b41059475d94) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Update renderer headers and pnpm

-   [#24](https://github.com/kinobi-so/kinobi/pull/24) [`b9cd6b2`](https://github.com/kinobi-so/kinobi/commit/b9cd6b29f4e5229512a7cc3dd28a6f6074dedd98) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix "object is not extensible" in PDA helper function

## 0.20.1

### Patch Changes

-   [#21](https://github.com/kinobi-so/kinobi/pull/21) [`0dec0c8`](https://github.com/kinobi-so/kinobi/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0) Thanks [@lorisleiva](https://github.com/lorisleiva)! - Fix ESM and CJS exports on renderers

-   Updated dependencies [[`0dec0c8`](https://github.com/kinobi-so/kinobi/commit/0dec0c8fff5e80fafc964416058e4ddf1db2bda0)]:
    -   @kinobi-so/renderers-core@0.20.1
    -   @kinobi-so/errors@0.20.1
    -   @kinobi-so/nodes@0.20.1
    -   @kinobi-so/visitors-core@0.20.1
