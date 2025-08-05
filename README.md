# Codama

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![ci][ci-image]][ci-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/codama.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/codama.svg?style=flat
[npm-url]: https://www.npmjs.com/package/codama
[ci-image]: https://img.shields.io/github/actions/workflow/status/codama-idl/codama/main.yml?logo=GitHub
[ci-url]: https://github.com/codama-idl/codama/actions/workflows/main.yml

> [!NOTE]  
> Wait, wasn't this project called Kinobi before? We've [renamed this project to **Codama**](https://github.com/codama-idl/codama/pull/234).

Codama is a tool that describes any Solana program in a standardised format called a **Codama IDL**.

A Codama IDL can be used to:

- Create clients for your programs in various languages/frameworks
- Make CLIs
- Provide additional information to explorers

![Codama header: A small double-sided mind-map with the Codama logo in the middle. On the left, we see the various ways to get a Codama IDL from your Solana programs such as "Anchor Program" and "Shank macros". On the right, we see the various utility tools that are offered for the IDL such as "Rendering client code" or "Rendering documentation".](https://github.com/user-attachments/assets/029af336-ea71-4e7f-9612-ef5bb187e3a0)

## I'm a busy Anchor developer. How do I use Codama?

If you're using [Anchor](https://www.anchor-lang.com/), Codama can be used to create a TypeScript client that works with [Solana Kit](https://github.com/anza-xyz/kit). This combination replaces the traditional `@coral-xyz/anchor` and `@solana/web3.js` packages, and can be used in both TypeScript tests, and the browser.

- The `programClient` created by Codama will be used to create instructions for your Anchor program, and decode your Anchor program's data accounts.
- [`@solana/kit`](https://github.com/anza-xyz/kit) will be used to connect to the network, send transactions, and do most tasks that aren't specific to your program.
- [`@solana/react`](https://github.com/anza-xyz/kit/tree/main/packages/react) will be used to connect to Solana wallet apps like Phantom, Solflare, etc. in React.

This Codama README shows you how to create the TypeScript client for your Anchor program, but if you're interested in the bigger picture, see QuickNode's video on [Anchor and Solana Kit](https://www.youtube.com/watch?v=2T3DOMv7iR4).

### Example Anchor Projects Using Codama

[Anchor Election app](https://github.com/quiknode-labs/anchor-election-2025)

[Anchor Swap/Escrow app](https://github.com/quiknode-labs/you-will-build-a-solana-program)

## Using Codama

### Creating a Codama IDL for your Solana Program

There are various ways to get a Codama IDL from your Solana program:

- **From an Anchor IDL**. If you are using [Anchor programs](https://github.com/coral-xyz/anchor) or [Shank macros](https://github.com/metaplex-foundation/shank), then you can get an Anchor IDL from them. You can then use the `@codama/nodes-from-anchor` package to convert that IDL into a Codama IDL as shown in the code snippet below. Note that the Anchor IDL might not offer all the information that Codama can hold, and therefore, you may want to transform your Codama IDL to provide additional information. You can learn more about this in the next section.

    ```ts
    import { createFromRoot } from 'codama';
    import { rootNodeFromAnchor } from '@codama/nodes-from-anchor';
    import anchorIdl from 'anchor-idl.json';

    const codama = createFromRoot(rootNodeFromAnchor(anchorIdl));
    ```

- **Using Codama macros**. This is not yet available, but you will soon have access to a set of Rust macros that help attach IDL information directly within your Rust code. These macros enable Codama IDLs to be generated whenever you build your programs.

- **By hand**. If your Solana program cannot be updated to use Codama macros and you don't have an Anchor IDL, you can design your Codama IDL manually. We may provide tools such as a Codama Playground to help with that in the future.

### Using the Codama IDL

Now that you have the perfect Codama IDL for your Solana program, you can benefit from all the existing Codama tooling for tasks like such as making clients in various languages, making CLIs, and registering your IDL onchain so explorers can dynamically display relevant information for your program.

> [!NOTE]  
> Some features, such as rendering CLIs, are not yet available. However, because of Codama's design, these features are only [a visitor away](#codama-architecture) from being ready. Feel free to reach out if you'd like to contribute to the Codama ecosystem!

#### Making clients for your program

Want people to start interacting with your Solana program? You can generate clients that you can then publish for your end-users. Currently, we have the following renderers available:

- `@codama/renderers-js`: Renders a JavaScript client compatible with [`@solana/kit`](https://github.com/anza-xyz/kit).
- `@codama/renderers-js-umi`: Renders a JavaScript client compatible with Metaplex's [Umi](https://github.com/metaplex-foundation/umi) framework.
- `@codama/renderers-rust`: Renders a Rust client that removes the need for publishing the program crate and offers a better developer experience.
- _And more to come._

Here's an example of how to generate JavaScript and Rust client code for your program.

```ts
import { renderJavaScriptVisitor, renderRustVisitor } from '@codama/renderers';

codama.accept(renderJavaScriptVisitor('clients/js/src/generated', { ... }));
codama.accept(renderRustVisitor('clients/rust/src/generated', { ... }));
```

### Registering your Codama IDL onchain (_Coming soon_)

Perhaps the most significant benefit of having a Codama IDL from your program is that you can share it onchain with the rest of the ecosystem. This means explorers may now use this information to provide a better experience for users of your programs. Additionally, anyone can now grab your Codama IDL, select the portion they are interested in and benefit from the same ecosystem of Codama visitors to iterate over it. For instance, an app could decide to grab the IDLs of all programs it depends on, filter out the accounts and instructions the app doesn't need, and generate a bespoke client for their app that only contains the functions the app needs.

#### Creating CLIs (_Not yet available_)

Whilst not available yet, we can imagine a set of CLI commands that can be generated from our Codama IDL (much like our clients) so that end-users can fetch decoded accounts and send instructions directly from their terminal.

#### Creating documentation (_Not yet available_)

Similarly to CLIs, we may easily generate documentation in various formats from the information held by our Codama IDL.

## Codama Architecture

The Codama IDL is designed as a tree of nodes starting with the `RootNode,` which contains a `ProgramNode` and additional data such as the Codama version used when the IDL was created. Codama provides over 60 different types of nodes that help describe nearly every aspect of your Solana programs. [You can read more about the Codama nodes here](./packages/nodes).

![A small example of a Codama IDL as a tree of nodes. It starts with a RootNode and goes down to ProgramNode, AccountNode, InstructionNode, etc.](https://github.com/codama-idl/codama/assets/3642397/9d53485d-a4f6-459a-b7eb-58faab716bc1)

Because everything is designed as a `Node`, we can transform the IDL, aggregate information, and output various utility tools using special objects that can traverse node trees known as visitors. [See this documentation to learn more about Codama visitors](./packages/visitors).

![A small example of how a visitor can transform a Codama IDL into another Codama IDL. This example illustrates the "deleteNodesVisitor" which recursively removes NumberTypeNodes from a tree of nested TypleTypeNodes.](https://github.com/codama-idl/codama/assets/3642397/f54e83d1-eade-4674-80dc-7ddc360f5f66)

## Other Resources

['Codama' tag on Solana Stack Exchange](https://solana.stackexchange.com/questions/tagged/codama)
