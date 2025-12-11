# Codama

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![ci][ci-image]][ci-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/codama.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/codama.svg?style=flat
[npm-url]: https://www.npmjs.com/package/codama
[ci-image]: https://img.shields.io/github/actions/workflow/status/codama-idl/codama/main.yml?logo=GitHub
[ci-url]: https://github.com/codama-idl/codama/actions/workflows/main.yml

Codama is a tool that describes any Solana program in a standardised format called a **Codama IDL**.

A Codama IDL can be used to:

- ✨ Generate **program clients** in various languages and frameworks.
- 📚 Generate **documentation and tooling** for your programs.
- 🗃️ **Register your IDL** for others to discover and index.
- 🔭 Provide valuable information to **explorers and wallets**.

![Codama header: A small double-sided mind-map with the Codama logo in the middle. On the left, we see the various ways to get a Codama IDL from your Solana programs such as "Codama Macros" and "Anchor Program". On the right, we see the various utility tools that are offered for the IDL such as "Generate clients" or "Register IDL".](https://github.com/user-attachments/assets/7a2ef5fa-049e-45a8-a5fc-7c11ff46a54b)

## Table of contents

- [Getting started](#getting-started). Install and use Codama in your project.
- [Coming from Anchor](#coming-from-anchor). Have an Anchor IDL instead? Let’s make that work.
- [Codama scripts](#codama-scripts). Enrich your Codama config file with more scripts.
- [Available visitors](#available-visitors). See what’s available for you to use.
- [Getting a Codama IDL](#getting-a-codama-idl). Extract Codama IDLs from any program.
- [Codama’s architecture](#codamas-architecture). A bit more on the node/visitor design.
- [Other resources](#other-resources).

## Getting started

### Installation

To get started with Codama, simply install `codama` to your project and run the `init` command like so:

```sh
pnpm install codama
codama init
```

You will be prompted for the path of your IDL and asked to select any script presets you would like to use. This will create a Codama configuration file at the root of your project.

### Usage

You may then use the `codama run` command to execute any script defined in your configuration file.

```sh
codama run --all # Run all Codama scripts.
codama run js    # Generates a JavaScript client.
codama run rust  # Generates a Rust client.
```

## Coming from Anchor

If you are using [Anchor](https://www.anchor-lang.com/docs) or [Shank macros](https://github.com/metaplex-foundation/shank), then you should already have an **Anchor IDL**. To make it work with Codama, you simply need to provide the path to your Anchor IDL in your Codama configuration file. Codama will automatically identify this as an Anchor IDL and will convert it to a Codama IDL before executing your scripts.

```json
{
    "idl": "path/to/my/anchor/idl.json"
}
```

## Codama scripts

You can use your Codama configuration file to define any script you want by using one or more visitors that will be invoked when the script is ran.

**Visitors** are objects that will visit your Codama IDL and either perform some operation — like generating a program client — or update the IDL further — like renaming accounts. You can either use visitors from external packages or from a local file, and — in both cases — you can provide any argument the visitor may require.

For instance, the example script below will invoke three visitors:

- The first will use the `default` import from the `my-external-visitor` package and pass `42` as the first argument.
- The second will use the `withDefaults` import from the `my-external-visitor` package.
- The third will use a local visitor located next to the configuration file.

```json
{
    "scripts": {
        "my-script": [
            { "from": "my-external-visitor", "args": [42] },
            "my-external-visitor#withDefaults",
            "./my-local-visitor.js"
        ]
    }
}
```

Note that if an external visitor in your script isn’t installed locally, you will be asked to install it next time you try to run that script.

```sh
❯ codama run my-script

▲ Your script requires additional dependencies.
▲ Install command: pnpm install my-external-visitor
? Install dependencies? › (Y/n)
```

You can [learn more about the Codama CLI here](/packages/cli/README.md).

## Available visitors

The tables below aim to help you discover visitors from the Codama ecosystem that you can use in your scripts.

Feel free to PR your own visitor here for others to discover. Note that they are ordered alphabetically.

### Generates documentation

| Visitor                                                                         | Description                                                                      | Maintainer |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `@codama/renderers-demo` ([docs](https://github.com/codama-idl/renderers-demo)) | Generates simple documentation as a template to help others create new visitors. | Codama     |

### Generates program clients

| Visitor                                                                                         | Description                                                                                             | Maintainer                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `@codama/renderers-js` ([docs](https://github.com/codama-idl/renderers-js))                     | Generates a JavaScript client compatible with [Solana Kit](https://www.solanakit.com/).                 | [Anza](https://www.anza.xyz/)              |
| `@codama/renderers-js-umi` ([docs](https://github.com/codama-idl/renderers-js-umi))             | Generates a JavaScript client compatible with [the Umi framework](https://developers.metaplex.com/umi). | [Metaplex](https://www.metaplex.com/)      |
| `@codama/renderers-rust` ([docs](https://github.com/codama-idl/renderers-rust))                 | Generates a Rust client compatible with [the Solana SDK](https://github.com/anza-xyz/solana-sdk).       | [Anza](https://www.anza.xyz/)              |
| `@codama/renderers-vixen-parser` ([docs](https://github.com/codama-idl/renderers-vixen-parser)) | Generates [Yellowstone](https://github.com/rpcpool/yellowstone-grpc) account and instruction parsers.   | [Triton One](https://triton.one/)          |
| `@limechain/codama-dart` ([docs](https://github.com/limechain/codama-dart))                     | Generates a Dart client.                                                                                | [LimeChain](https://github.com/limechain/) |
| `codama-py` ([docs](https://github.com/Solana-ZH/codama-py))                                    | Generates a Python client.                                                                              | [Solar](https://github.com/Solana-ZH)      |

### Provides utility

| Visitor                                                                                                             | Description                                                                                                                                                                                                                                                                                                   | Maintainer |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `@codama/visitors#*` ([docs](https://github.com/codama-idl/codama/blob/main/packages/visitors/README.md))           | Provides a big library of utility visitors that can be used to manipulate Codama IDLs. For instance, `updateErrorsVisitor` can be used to update error messages in your IDL . [Check out the docs](https://github.com/codama-idl/codama/blob/main/packages/visitors/README.md) to see all available visitors. | Codama     |
| `@codama/visitors-core#*` ([docs](https://github.com/codama-idl/codama/blob/main/packages/visitors-core/README.md)) | Everything included in `visitors-core` is also included in `visitors`. The helpers offered in this package are slightly more advanced and can be used to help you [build your own visitors](https://github.com/codama-idl/codama/blob/main/packages/visitors-core/README.md#writing-your-own-visitor).        | Codama     |

## Getting a Codama IDL

We are currently working on a set of transparent macros that can be added to any program in order to extract a Codama IDL from it. There are still a lot more macros and scenarios for us to support but most programs can already benefit from these macros. You can then extract an IDL from the provided crate path using the Codama API like so:

```rust
use codama::Codama;

let codama = Codama::load(crate_path)?;
let idl_json = codama.get_json_idl()?;
```

We will add documentation on Codama macros when they are fully implemented but feel free to check this example that extract a Codama IDL from the [System program interface](https://github.com/lorisleiva/codama-demo-2025-08/tree/main/3-from-macros/program/src) using a [build script](https://github.com/lorisleiva/codama-demo-2025-08/blob/main/3-from-macros/program/build.rs).

## Codama's architecture

The Codama IDL is designed as a tree of nodes starting with the `RootNode` which contains a `ProgramNode` and additional data such as the Codama version used when the IDL was created. Codama provides over 60 different types of nodes that help describe nearly every aspect of your Solana programs. [You can read more about the Codama nodes here](./packages/nodes).

![A small example of a Codama IDL as a tree of nodes. It starts with a RootNode and goes down to ProgramNode, AccountNode, InstructionNode, etc.](https://github.com/codama-idl/codama/assets/3642397/9d53485d-a4f6-459a-b7eb-58faab716bc1)

Because everything is designed as a `Node`, we can transform the IDL, aggregate information, and output various utility tools using special objects that can traverse node trees known as visitors. [See this documentation to learn more about Codama visitors](./packages/visitors-core).

![A small example of how a visitor can transform a Codama IDL into another Codama IDL. This example illustrates the "deleteNodesVisitor" which recursively removes NumberTypeNodes from a tree of nested TypleTypeNodes.](https://github.com/codama-idl/codama/assets/3642397/f54e83d1-eade-4674-80dc-7ddc360f5f66)

## Other resources

- [Solana Stack Exchange](https://solana.stackexchange.com/questions/tagged/codama).
- Working with Anchor
    - [Anchor and Solana Kit tutorial](https://www.youtube.com/watch?v=2T3DOMv7iR4).
    - [Anchor Election app](https://github.com/quiknode-labs/anchor-election-2025).
    - [Anchor Swap/Escrow app](https://github.com/quiknode-labs/you-will-build-a-solana-program).
