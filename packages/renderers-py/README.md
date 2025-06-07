# Codama ➤ Renderers ➤ Python

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/renderers-rust.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/renderers-rust.svg?style=flat&label=%40codama%2Frenderers-rust
[npm-url]: https://www.npmjs.com/package/@codama/renderers-rust

This package generates Rust clients from your Codama IDLs.

## Installation

```sh
pnpm install @codama/renderers-py
```

> [!NOTE]
> This package is **not** included in the main [`codama`](../library) package.
>
> However, note that the [`renderers`](../renderers) package re-exports the `renderVisitor` function of this package as `renderPythonVisitor`.

## Usage

Once you have a Codama IDL, you can use the `renderVisitor` of this package to generate Python clients. You will need to provide the base directory where the generated files will be saved and an optional set of options to customize the output.

```ts
// node ./codama.mjs
import { renderVisitor } from '@codama/renderers-py';

const pathToGeneratedFolder = path.join(__dirname, 'clients', 'python', 'src', 'generated');
const options = {}; // See below.
codama.accept(renderVisitor(pathToGeneratedFolder, options));
```

## Generate file directory structure

```
.
├── accounts
│   ├── foo_account.py
│   └── __init__.py
├── instructions
│   ├── some_instruction.py
│   ├── other_instruction.py
│   └── __init__.py
├── types
│   ├── bar_struct.py
│   ├── baz_enum.py
│   └── __init__.py
├── errors
│   ├── custom.py
│   └── __init__.py
└── program_id.py
```

## Dependencies

```
    "borsh-construct>=0.1.0",
    "anchorpy>=0.21.0",
    "solana>=0.36.6",
    "solders>=0.26.0",
```

## Examples

### Instructions

```python
from solders.hash import Hash
from solders.keypair import Keypair
from solders.message import Message
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solana.rpc.async_api import AsyncClient
from my_client.instructions import some_instruction

 # call an instruction
foo_account = Keypair()
async with AsyncClient("http://127.0.0.1:8899") as client:
    res = await client.is_connected()
    # in real use, fetch this from an RPC
    recent_blockhash = (await client.get_latest_blockhash()).value.blockhash

    ix = some_instruction({
        "foo_param": "...",
        "bar_param": "...",
        ...
        },
        {
            "foo_account": foo_account.pubkey(), # signer
            "bar_account": Pubkey("..."),
            ...
        })
    msg = Message(instructions=[ix], payer=payer.pubkey())
    try:
        transaction = Transaction([foo_account], msg, recent_blockhash)
        result = (await client.simulate_transaction(transaction))
        print(result)
    except BaseException as e:
        print(f"BaseException failed: {e}")
        return None

```

### Accounts

```python
from solders.pubkey import Pubkey
from my_client.accounts import FooAccount

# fetch an account
addr = Pubkey("...")

acc = await FooAccount.fetch(connection, addr)
if acc is None:
    # the fetch method returns null when the account is uninitialized
    raise ValueError("account not found")


# convert to a JSON object
obj = acc.to_json()
print(obj)

# load from JSON
acc_from_json = FooAccount.from_json(obj)
```

### Types

```python
# structs

from my_client.types import BarStruct

bar_struct = BarStruct(
  some_field="...",
  other_field="...",
)

print(bar_struct.to_json())
```

```python
# enums

from my_client.types import bazEnum

tupleEnum = bazEnum.SomeTupleKind((True, False, "some value"))
structEnum = bazEnum.SomeStructKind({
  "field1": "...",
  "field2": "...",
})
discEnum = bazEnum.SomeDiscriminantKind()

print(tupleEnum.toJSON(), structEnum.toJSON(), discEnum.toJSON())
```

```python
# types are used as arguments in instruction calls (where needed):
ix = some_instruction({
  "some_struct_field": bar_struct,
  "some_enum_field": tuple_enum,
  # ...
}, {
  # accounts
  # ...
})

# in case of struct fields, it's also possible to pass them as objects:
ix = some_instruction({
  "some_struct_field": {
    "some_field": "...",
    "other_field": "...",
  },
  # ...,
}, {
  # accounts
  # ...
})
```

### Errors

```python
from solana.rpc.core import RPCException
from my_client.errors import from_tx_error
from my_client.errors.custom import SomeCustomError

try:
  await provider.send(tx, [payer])
except RPCException as exc:
    parsed = from_tx_error(exc)
    raise parsed from exc
```

### Program ID

The Program ID is generated based on the Program address provided in the IDL. If it is not present in the IDL, it needs to be manually filled in.

### Description

The generated code uses the AnchorPy code generation method and some underlying structures.

Support for Codama was added, and some data structures not supported by AnchorPy were included, such as FixedSizeType, SizePrefixType, HiddenSuffixType, HiddenPrefixType, and EnumIndexU32Type.
