# Codama ➤ Errors

[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]

[npm-downloads-image]: https://img.shields.io/npm/dm/@codama/errors.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@codama/errors.svg?style=flat&label=%40codama%2Ferrors
[npm-url]: https://www.npmjs.com/package/@codama/errors

This package defines a `CodamaError` class that accepts a specific error code and a context object based on that code. It enables us to catch and handle errors in a more structured way.

## Installation

```sh
pnpm install @codama/errors
```

> [!NOTE]
> This package is included in the main [`codama`](../library) package. Meaning, you already have access to its content if you are installing Codama this way.
>
> ```sh
> pnpm install codama
> ```

## Reading error messages

### In development mode

When the `NODE_ENV` environment variable is not set to `"production"`, every error message will be included in the bundle. As such, you will be able to read them in plain language wherever they appear.

### In production mode

On the other hand, when `NODE_ENV` is set to `"production"`, error messages will be stripped from the bundle to save space. Only the error code will appear when an error is encountered. Follow the instructions in the error message to convert the error code back to the human-readable error message.

For instance, to recover the error text for the error with code `123`:

```shell
npx @codama/errors decode -- 123
```

## Catching errors

When you catch a `CodamaError` and assert its error code using `isCodamaError()`, TypeScript will refine the error's context to the type associated with that error code. You can use that context to render useful error messages, or to make context-aware decisions that help your application to recover from the error.

```ts
import { CODAMA_ERROR__UNEXPECTED_NODE_KIND, isCodamaError } from '@codama/errors';

try {
    const codama = createFromJson(jsonIdl);
} catch (e) {
    if (isCodamaError(e, CODAMA_ERROR__UNEXPECTED_NODE_KIND)) {
        const { expectedKinds, kind, node } = e.context;
        // ...
    } else if (isCodamaError(e, CODAMA_ERROR__VERSION_MISMATCH)) {
        const { codamaVersion, rootVersion } = e.context;
        // ...
    } else {
        throw e;
    }
}
```

## Contributing

### Adding a new error

To add a new error in Codama, follow these steps:

1. Add a new exported error code constant to `src/codes.ts`. Find the most appropriate group for your error and ensure it is appended to the end of that group.
2. Add that new constant to the `CodamaErrorCode` union in `src/codes.ts`.
3. If you would like the new error to encapsulate context about the error itself define that context in `src/context.ts`.
4. Add the error's message to `src/messages.ts`. Any context values that you defined above will be interpolated into the message wherever you write `$key`, where `key` is the index of a value in the context (eg. ``'Unrecognized node `$kind`.'``).
5. Publish a new version of `@codama/errors` using changesets — maintainers will handle this via tha changesets CI workflow.
6. Bump the version of `@codama/errors` or `codama` in the consumer package from which the error is thrown.

### Removing an error message

- Don't remove errors.
- Don't change the meaning of an error message.
- Don't change or reorder error codes.
- Don't change or remove members of an error's context.

When an older client throws an error, we want to make sure that they can always decode the error. If you make any of the changes above, old clients will, by definition, not have received your changes. This could make the errors that they throw impossible to decode going forward.
