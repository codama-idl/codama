# Codama ➤ CLI

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/cli.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/cli.svg?style=flat&label=%40codama%2Fcli
[npm-url]: https://www.npmjs.com/package/@codama/cli

This package provides a CLI for the Codama library that can be used to run scripts on Codama IDLs.

Note that, whilst the CLI code is located in the `@codama/cli` package, the CLI binary is also included in the main `codama` library.

## Getting started

To get started with Codama, simply install `codama` to your project and run the `init` command like so:

```sh
pnpm install codama
pnpm codama init
```

You will be prompted for the path of your IDL and asked to select any script presets you would like to use.

To initialize a [gill based Codama](https://gill.site/docs/guides/codama) configuration file, run the `init` command with the `--gill` flag like so:

```sh
pnpm codama init --gill
```

## `codama run`

Once you have your codama configuration file, you can run your Codama scripts using the `codama run` command as follows:

```sh
pnpm codama run         # Only runs your before visitors.
pnpm codama run js rust # Runs your before visitors followed by the `js` and `rust` scripts.
pnpm codama run --all   # Runs your before visitors followed by all your scripts.
```

## The configuration file

The codama configuration file defines an object containing the following fields:

- `idl` (string): The path to the IDL file. This can be a Codama IDL or an Anchor IDL which will be automatically converted to a Codama IDL.
- `before` (array): An array of visitors that will run before every script.
- `scripts` (object): An object defining the available Codama scripts. The keys identify the scripts and the values are arrays of visitors that make up the script.

Whether it is in the `before` array or in the `scripts` values, when defining a visitor you may either provide:

- an object with the following fields:
    - `from` (string): The import path to the visitor.
    - `args` (array): An array of arguments to pass to the visitor.
- a string: The import path to the visitor. This is equivalent to providing an object with a `from` field and an empty `args` array.

Visitor import paths can either be local paths (pointing to JavaScript files exporting visitors) or npm package names. By default, the `default` export will be used but you may specify a named export by appending a `#` followed by the export name. When resolved, the imported element inside the module should either be a `Visitor<any, 'rootNode'>` or a function that returns a `Visitor<any, 'rootNode'>` given the arguments provided. Here are some examples of valid visitor import paths:

```js
'./my-visitor.js'; // Relative local path to a visitor module.
'/Users/me/my-visitor.js'; // Absolute local path to a visitor module.
'some-library'; // npm package name.
'@acme/some-library'; // Scoped npm package name.
'./my-visitor.js#myExport'; // Named export from a local path.
'@acme/some-library#myExport'; // Named export from an npm package.
```

Here is an example of what a Codama configuration file might look like:

```json
{
    "idl": "path/to/idl",
    "before": [
        "./my-before-visitor.js",
        { "from": "some-library#removeTypes", "args": [["internalFoo", "internalBar"]] }
    ],
    "scripts": {
        "js": [
            {
                "from": "@codama/renderers-js",
                "args": ["clients/js/src/generated"]
            }
        ]
    }
}
```

Note that you can use the `--js` flag to generate a `.js` configuration file when running the `init` command.
