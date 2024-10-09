import { PublicKeyTypeNode } from '@codama/node-types';

import { CodamaError, CodamaErrorCode, isCodamaError } from '../src';
import * as CodamaErrorCodeModule from '../src/codes';
import { CodamaErrorContext } from '../src/context';

const { CODAMA_ERROR__UNRECOGNIZED_NODE_KIND, CODAMA_ERROR__UNEXPECTED_NODE_KIND } = CodamaErrorCodeModule;

// If this line raises a type error, you might have forgotten to add a new error to the
// `CodamaErrorCode` union in `src/codes.ts`.
Object.values(CodamaErrorCodeModule) satisfies CodamaErrorCode[];

const unexpectedNodeKindError = new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
    expectedKinds: ['numberTypeNode', 'stringTypeNode'],
    kind: 'publicKeyTypeNode',
    node: {} as PublicKeyTypeNode,
});

{
    const code = unexpectedNodeKindError.context.__code;
    code satisfies typeof CODAMA_ERROR__UNEXPECTED_NODE_KIND;
    // @ts-expect-error Wrong error code.
    code satisfies typeof CODAMA_ERROR__UNRECOGNIZED_NODE_KIND;
}

{
    // @ts-expect-error Missing context.
    new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {});
    // @ts-expect-error Missing part of the context.
    new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: ['numberTypeNode', 'stringTypeNode'],
        node: {} as PublicKeyTypeNode,
    });
    new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND, {
        // @ts-expect-error Wrong context attribute.
        foo: 'bar',
    });
}

unexpectedNodeKindError.context satisfies CodamaErrorContext[typeof CODAMA_ERROR__UNEXPECTED_NODE_KIND];
// @ts-expect-error Non existent context property.
unexpectedNodeKindError.context.feePayer;

// @ts-expect-error Missing context.
new CodamaError(CODAMA_ERROR__UNRECOGNIZED_NODE_KIND);
// @ts-expect-error Missing context.
new CodamaError(CODAMA_ERROR__UNEXPECTED_NODE_KIND);

const unknownError = null as unknown as CodamaError;
if (unknownError.context.__code === CODAMA_ERROR__UNEXPECTED_NODE_KIND) {
    unknownError.context satisfies CodamaErrorContext[typeof CODAMA_ERROR__UNEXPECTED_NODE_KIND];
    // @ts-expect-error Context belongs to another error code
    unknownError.context satisfies CodamaErrorContext[typeof CODAMA_ERROR__UNRECOGNIZED_NODE_KIND];
}

const e = null as unknown;
if (isCodamaError(e)) {
    e.context satisfies Readonly<{ __code: CodamaErrorCode }>;
}
if (isCodamaError(e, CODAMA_ERROR__UNEXPECTED_NODE_KIND)) {
    e.context satisfies CodamaErrorContext[typeof CODAMA_ERROR__UNEXPECTED_NODE_KIND];
    // @ts-expect-error Context belongs to another error code
    e.context satisfies CodamaErrorContext[typeof CODAMA_ERROR__UNRECOGNIZED_NODE_KIND];
}

// `CodamaErrorContext` must not contain any keys reserved by `ErrorOptions` (eg. `cause`)
null as unknown as CodamaErrorContext satisfies {
    [Code in keyof CodamaErrorContext]: CodamaErrorContext[Code] extends undefined
        ? undefined
        : {
              [PP in keyof CodamaErrorContext[Code]]: PP extends keyof ErrorOptions
                  ? never
                  : CodamaErrorContext[Code][PP];
          };
};
