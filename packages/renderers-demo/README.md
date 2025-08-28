# Codama ➤ Renderers ➤ Demo

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-demo.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-demo.svg?style=flat&label=%40codama%2Frenderers-demo
[npm-url]: https://www.npmjs.com/package/@codama/renderers-demo

This package provides a demo implementation of a Codama renderer to help developers create their own.

## Installation

```sh
pnpm install @codama/renderers-demo
```

## Usage

Add the following script to your Codama configuration file.

```json
{
    // ...
    "scripts": {
        "demo": {
            "from": "@codama/renderers-demo",
            "args": ["docs"]
        }
    }
}
```
