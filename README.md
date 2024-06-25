# Kinobi

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![ci][ci-image]][ci-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/kinobi.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/kinobi.svg?style=flat
[npm-url]: https://www.npmjs.com/package/kinobi
[ci-image]: https://img.shields.io/github/actions/workflow/status/kinobi-so/kinobi/main.yml?logo=GitHub
[ci-url]: https://github.com/kinobi-so/kinobi/actions/workflows/main.yml

Kinobi is a tool that describes any Solana program in a powerful standardised format known as the Kinobi IDL. This IDL can then be used to create a variety of utility such as rendering client code for your programs in various languages/frameworks, generating CLIs and providing more information to explorers.

![Kinobi header: A small double-sided mind-map with the Kinobi logo in the middle. On the left, we see the various ways to get a Kinobi IDL from your Solana programs such as "Anchor Program" and "Shank macros". On the right, we see the various utility tools that are offered for the IDL such as "Rendering client code" or "Rendering documentation".](https://github.com/kinobi-so/kinobi/assets/3642397/1e25dfba-9213-4c5b-9f4a-32be8feb4a7f)

## Nodes and visitors

The Kinobi IDL is designed as a tree of nodes starting with the `RootNode` which contains a `ProgramNode` and additional data such as the Kinobi version used when the IDL was created. Kinobi provides over 60 different types of nodes that help describe just about any aspect of your Solana programs. [You can read more about the Kinobi nodes here](./packages/nodes).

![A small example of a Kinobi IDL as a tree of nodes. It starts with a RootNode and goes down to ProgramNode, AccountNode, InstructionNode, etc.](https://github.com/kinobi-so/kinobi/assets/3642397/9d53485d-a4f6-459a-b7eb-58faab716bc1)

Because everything is designed as a `Node`, we can transform the IDL, aggregate information and output various utility tools using special objects that can traverse node trees known as visitors. [See this documentation to learn more about Kinobi visitors](./packages/visitors).

![A small example of how a visitor can transform a Kinobi IDL into another Kinobi IDL. This example illustrates the "deleteNodesVisitor" which recursively removes NumberTypeNodes from a tree of nested TypleTypeNodes.](https://github.com/kinobi-so/kinobi/assets/3642397/f54e83d1-eade-4674-80dc-7ddc360f5f66)

## From program to Kinobi

There are various ways to extract information from your Solana programs in order to obtain a Kinobi IDL.

-   **Using Kinobi macros**. This is not yet available but you will soon have access to a set of Rust macros that help attach IDL information directly within your Rust code. These macros enable Kinobi IDLs to be generated whenever you build your programs.
-   **From Anchor IDLs**. If you are using [Anchor programs](https://github.com/coral-xyz/anchor) or [Shank macros](https://github.com/metaplex-foundation/shank), then you can get an Anchor IDL from them. You can then use the `@kinobi-so/nodes-from-anchor` package to convert that IDL into a Kinobi IDL as shown in the code snippet below. Note that the Anchor IDL might not offer all the information that Kinobi can hold and therefore, you may want to transform your Kinobi IDL to provide additional information. You can learn more about this in the next section.

    ```ts
    import { createFromRootNode } from 'kinobi';
    import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
    import anchorIdl from 'anchor-idl.json';

    const kinobi = createFromRootNode(rootNodeFromAnchor(anchorIdl));
    ```

-   **By hand**. If your Solana program cannot be updated to use Kinobi macros and you don’t have an Anchor IDL, you may design your Kinobi IDL by hand. We may provide tools such as a Kinobi Playground to help with that in the future.

## Transforming Kinobi

Once you have your Kinobi IDL, you may use visitors to transform it. This can be useful when the Kinobi IDL was obtained from another source that may not contain some necessary information. Here is an example using two provided visitors that adjusts the accounts and instructions on the program.

```ts
import { updateAccountsVisitor, updateInstructionsVisitor } from 'kinobi';

kinobi.update(updateAccountsVisitor({ ... }));
kinobi.update(updateInstructionsVisitor({ ... }));
```

## From Kinobi to utility

Now that you have the perfect Kinobi IDL for your Solana program, you can benefit from all the visitors and tools that provide utility such as rendering client code or registering your IDL on-chain so explorers can dynamically display relevant information for your program.

_Note that some features such as rendering CLIs are not yet available. However, because the Kinobi IDL is designed as a tree of nodes, these features are only a visitor away from being ready. Feel free to reach out if you’d like to contribute to this Kinobi ecosystem._

-   **Rendering client code**. Want people to start interacting with your Solana program? You can use special visitors that go through your Kinobi IDL and generate client code that you can then publish for your end-users. Currently, we have the following renderers available:

    -   `@kinobi-so/renderers-js`: Renders a JavaScript client compatible with the soon-to-be-released 2.0 line of [`@solana/web3.js`](https://github.com/solana-labs/solana-web3.js).
    -   `@kinobi-so/renderers-js-umi`: Renders a JavaScript client compatible with Metaplex’s [Umi](https://github.com/metaplex-foundation/umi) framework.
    -   `@kinobi-so/renderers-rust`: Renders a Rust client that removes the need for publishing the program crate and offers a better developer experience.
    -   _And more to come._

    Here’s an example of how to generate JavaScript and Rust client code for your program.

    ```ts
    import { renderJavaScriptVisitor, renderRustVisitor } from '@kinobi-so/renderers';

    kinobi.accept(renderJavaScriptVisitor('clients/js/src/generated', { ... }));
    kinobi.accept(renderRustVisitor('clients/rust/src/generated', { ... }));
    ```

-   **Registering your Kinobi IDL on-chain** (_Coming soon_). Perhaps the biggest benefit of having a Kinobi IDL from your program is that you can share it on-chain with the rest of the ecosystem. This means explorers may now use this information to provide a better experience for users of your programs. Additionally, anyone can now grab your Kinobi IDL, select the portion they are interested in and benefit from the same ecosystem of Kinobi visitors to iterate over it. For instance, an app could decide to grab the IDLs of all programs they depend on, filter out the accounts and instructions they don’t need and generate a bespoke client for their app that only contains the functions the app needs.
-   **Rendering CLIs** (_Not yet available_). Whilst not available yet, we can imagine a set of CLI commands that can be generated from our Kinobi IDL (much like our clients) so that end-users can fetch decoded accounts and send instructions directly from their terminal.
-   **Rendering documentation** (_Not yet available_). Similarly to CLIs, we may easily generate documentation in various formats from the information held by our Kinobi IDL.
