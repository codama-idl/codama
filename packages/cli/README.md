# Codama ➤ CLI

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/cli.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/cli.svg?style=flat&label=%40codama%2Fcli
[npm-url]: https://www.npmjs.com/package/@codama/cli

This package provides a CLI for the Codama library that can be used to run scripts on Codama IDLs.

Note that, whilst the CLI code is located in the `@codama/cli` package, the CLI binary is also included in the main `codama` library.

## Installation

Once you have the `codama` package installed, you can use the CLI using the `codama` binary.

```sh
pnpm install codama
codama --help
```

Note that you may install it from `@codama/cli` instead if you only want the CLI without the rest of the Codama library.

## Commands

### `codama init`

To get started with the Codama CLI, you will first need to create a [Codama configuration file](#configuration-file). You can do this using the `init` command as follows:

```sh
codama init
```

You will be prompted for the path of your IDL and asked to select any script presets you would like to use.

Here are the available options for the `init` command:

| Option            | Description                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| `[output]`        | As an optional argument, you may provide the path used to output the configuration file.                  |
| `--default`, `-d` | Skips all prompts and uses the default values.                                                            |
| `--force`         | Overwrites any existing configuration file.                                                               |
| `--gill`          | Initializes a configuration file for a [gill based Codama](https://gill.site/docs/guides/codama) project. |
| `--js`            | Generates a JavaScript configuration file instead of a JSON one.                                          |

### `codama run`

Once you have a configuration file, you can run your Codama scripts using the `codama run` command as follows:

```sh
codama run         # Only runs your before visitors, no scripts.
codama run js rust # Runs your before visitors followed by the `js` and `rust` scripts.
codama run --all   # Runs your before visitors followed by all your scripts.
```

Here are the available options for the `run` command:

| Option                  | Description                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `[scripts...]`          | As optional arguments, you may provide the names of the scripts you wish to run.         |
| `--all`, `-a`           | Runs all the scripts defined in your configuration file.                                 |
| `--config <path>`, `-c` | Specifies the path to your configuration file. Defaults to `codama.json` or `codama.js`. |
| `--idl`, `-i`           | Overrides the `idl` field in your configuration file.                                    |

## Configuration file

> [!NOTE]
> If you don't have a Codama configuration file yet, you can generate a new one using the `codama init` command as [described above](#codama-init).

The Codama configuration file defines an object containing the following fields:

- `idl` (string): The path to the IDL file. This can be a Codama IDL or an Anchor IDL which will be automatically converted to a Codama IDL.
    ```json
    {
        "idl": "path/to/idl"
    }
    ```
- `before` (array): An array of visitors that will run before every script. See [the next section](#using-visitors) for more details on how to use visitors in your configuration file.
    ```json
    {
        "before": ["./my-visitor.js", "external-library#someVisitor"]
    }
    ```
- `scripts` (object): An object defining the available Codama scripts. The keys identify the scripts and the values are arrays of visitors that make up the script.
    ```json
    {
        "scripts": {
            "apple": ["./my-apple-visitor.js"],
            "banana": ["./my-banana-visitor.js"]
        }
    }
    ```

Whether it is in the `before` array or in the `scripts` values, if you have a single visitor, you may provide it directly instead of wrapping it in an array. For instance, the following configuration file is valid:

```json
{
    "idl": "path/to/idl",
    "before": "./my-visitor.js",
    "scripts": { "apple": "./my-apple-visitor.js" }
}
```

Note that the configuration file can also be a JavaScript file exporting the configuration object as the `default` export.

```js
export default {
    idl: 'path/to/idl',
    before: './my-visitor.js',
    scripts: { apple: './my-apple-visitor.js' },
};
```

## Using visitors

When using a visitor in your configuration file, **you must provide its import path**. This can either be a local path (relative or absolute) or an external NPM package. For instance the following are all valid visitor import paths:

```js
'./my-visitor.js'; // Relative local path.
'/Users/me/my-visitor.js'; // Absolute local path.
'some-library'; // External package.
'@acme/some-library'; // Scoped external package.
```

In all these cases, the visitor will be imported from the `default` export of the module by default. If you want to **import a named export** instead, you may append a `#` followed by the export name to the import path. For instance:

```js
'./my-visitor.js#myExport'; // Named export from a local path.
'@acme/some-library#myExport'; // Named export from an external package.
```

Some visitors may instead be **exported as functions** that return visitor objects. This allows the visitor to receive arguments from the end-user to customize its behavior. When that is the case, you may instead define your visitor as an object with the following fields:

- `from` (string): The import path (and potentially the export name) of the visitor.
- `args` (array): An array of arguments to pass to the visitor. If you don't need to pass any arguments to the visitor function, you may simply provide the import path as a string instead of an object.

```json
{
    "from": "@acme/some-library#myExport",
    "args": ["hello", { "someOption": true }]
}
```

Finally note that, if the invoked visitor returns a new `RootNode`, this new `RootNode` will be used for the subsequent visitors instead of the original one. This allows us to chain visitors that modify the Codama IDL. Consider the following example such that the `./delete-all-accounts.js` visitor returns a new IDL with all accounts removed it.

```js
export default {
    scripts: {
        documentation: [
            './delete-all-accounts.js', // After this visitor, the IDL has no accounts.
            './generate-documentation.js', // Generates documentation for an IDL with no accounts.
        ],
    },
};
```

## Recipes

There are plenty of existing visitors that you can use in your Codama scripts. The "[Available visitors](https://github.com/codama-idl/codama?tab=readme-ov-file#available-visitors)" section of the Codama README aims to list as many of them as possible. This includes visitors maintained by various teams across the ecosystem.

The examples below show how to use some of these visitors in your configuration file. They make heavy use of the [`@codama/visitors`](https://github.com/codama-idl/codama/tree/main/packages/visitors/README.md) package which provides a large number of utility visitors.

### Deleting nodes

Returns a new IDL with the specified nodes removed.

See [`deleteNodesVisitor`](https://github.com/codama-idl/codama/tree/main/packages/visitors-core#deletenodesvisitor) and [node selectors](https://github.com/codama-idl/codama/tree/main/packages/visitors-core#selecting-nodes).

In the example below, we remove the `mint` account, the `initializeMint` instruction and all errors from the IDL.

```json
{
    "from": "@codama/visitors#deleteNodesVisitor",
    "args": [["[accountNode]mint", "[instructionNode]initializeMint", "[errorNode]"]]
}
```

### Generating a JavaScript client

Generates a JavaScript client for the IDL at the specified output path.

See [`@codama/renderer-js`](https://github.com/codama-idl/renderers-js).

```json
{
    "from": "@codama/renderers-js",
    "args": ["clients/js/src/generated"]
}
```

### Removing documentation

Returns a new IDL with documentation removed from all nodes.

See [`removeDocsVisitor`](https://github.com/codama-idl/codama/tree/main/packages/visitors-core#removedocsvisitor)

```json
"@codama/visitors#removeDocsVisitor"
```

### Unwrapping linked types

Returns a new IDL with specified type links replaced by their underlying types.

See [`unwrapDefinedTypesVisitor`](https://github.com/codama-idl/codama/tree/main/packages/visitors#unwrapDefinedTypesVisitor)

In the example below, any links to the `counter` or `escrow` types will be replaced by the actual definitions of these types.

```json
{
    "from": "@codama/visitors#unwrapDefinedTypesVisitor",
    "args": [["counter", "escrow"]]
}
```

### Updating accounts

Returns a new IDL with updated account information.

See [`updateAccountsVisitor`](https://github.com/codama-idl/codama/tree/main/packages/visitors#updateAccountsVisitor)

In the example below, we rename the `vault` account to `safe` and update the `authority` field of the `bank` account to `treasury`.

```json
{
    "from": "@codama/visitors#updateAccountsVisitor",
    "args": [
        {
            "vault": {
                "name": "safe"
            },
            "bank": {
                "data": { "authority": "treasury" }
            }
        }
    ]
}
```
