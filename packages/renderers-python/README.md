# Codama ➤ Renderers Python

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-python.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-python.svg?style=flat&label=%40codama%2Frenderers-python
[npm-url]: https://www.npmjs.com/package/@codama/renderers-python

This package provides Python client renderers for Codama IDLs.

## Installation

```sh
pnpm install @codama/renderers-python
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.

## Usage

```ts
// node ./codama.mjs
import { renderPythonVisitor } from '@codama/renderers-python';

codama.accept(renderPythonVisitor('clients/python/src/generated'));
```

## Options

The following options can be provided when using the Python renderer:

```ts
type RenderOptions = {
  // The folder to delete before rendering.
  deleteFolderBeforeRendering?: boolean; // default: true
  
  // Whether to format the code with black.
  formatCode?: boolean; // default: true
  
  // Options to pass to the black formatter.
  blackOptions?: string[]; // default: ['--line-length', '88', '--target-version', 'py311']
  
  // Path to additional templates.
  extraTemplatesPath?: string;
  
  // Override import paths for different types of links.
  importOverrides?: LinkOverrides;
  
  // Map of dependencies.
  dependencyMap?: Record<string, string>;
  
  // Whether to render the root init file.
  renderRootInit?: boolean; // default: true
};
```

## Generated client structure

The generated Python client has the following structure:

```
generated/
│
├── __init__.py              # Main entry point
├── programs.py              # Program IDs
│
├── accounts/                # Account definitions
│   ├── __init__.py
│   └── ...
│
├── instructions/            # Instruction definitions
│   ├── __init__.py
│   └── ...
│
├── errors/                  # Error definitions
│   ├── __init__.py
│   └── ...
│
├── types/                   # Type definitions
│   ├── __init__.py
│   └── ...
│
└── pdas/                    # PDA utilities
    ├── __init__.py
    └── ...
```

## Dependencies

The generated Python client requires the following dependencies:

```
solana-py>=0.29.0
```

## Examples

### Basic usage

```python
from solana.rpc.api import Client
from solana.publickey import Pubkey
from solana.keypair import Keypair
from solana.transaction import Transaction

from generated import PROGRAM_ID
from generated.instructions import SomeInstruction

# Create a connection to the Solana cluster
connection = Client("https://api.mainnet-beta.solana.com")

# Create an instruction
instruction = SomeInstruction(
    amount=1000,
    recipient=Pubkey("..."),
)

# Build the transaction
tx = Transaction()
tx.add(instruction.get_instruction())

# Sign and send the transaction
result = connection.send_transaction(tx, Keypair.from_secret_key([...]))
print(f"Transaction signature: {result.value}")
``` 