import { PublicKeyTypeNode } from '@codama/node-types';

import { isKinobiError, KinobiError, KinobiErrorCode } from '../src';
import * as KinobiErrorCodeModule from '../src/codes';
import { KinobiErrorContext } from '../src/context';

const { KINOBI_ERROR__UNRECOGNIZED_NODE_KIND, KINOBI_ERROR__UNEXPECTED_NODE_KIND } = KinobiErrorCodeModule;

// If this line raises a type error, you might have forgotten to add a new error to the
// `KinobiErrorCode` union in `src/codes.ts`.
Object.values(KinobiErrorCodeModule) satisfies KinobiErrorCode[];

const unexpectedNodeKindError = new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {
    expectedKinds: ['numberTypeNode', 'stringTypeNode'],
    kind: 'publicKeyTypeNode',
    node: {} as PublicKeyTypeNode,
});

{
    const code = unexpectedNodeKindError.context.__code;
    code satisfies typeof KINOBI_ERROR__UNEXPECTED_NODE_KIND;
    // @ts-expect-error Wrong error code.
    code satisfies typeof KINOBI_ERROR__UNRECOGNIZED_NODE_KIND;
}

{
    // @ts-expect-error Missing context.
    new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {});
    // @ts-expect-error Missing part of the context.
    new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {
        expectedKinds: ['numberTypeNode', 'stringTypeNode'],
        node: {} as PublicKeyTypeNode,
    });
    new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND, {
        // @ts-expect-error Wrong context attribute.
        foo: 'bar',
    });
}

unexpectedNodeKindError.context satisfies KinobiErrorContext[typeof KINOBI_ERROR__UNEXPECTED_NODE_KIND];
// @ts-expect-error Non existent context property.
unexpectedNodeKindError.context.feePayer;

// @ts-expect-error Missing context.
new KinobiError(KINOBI_ERROR__UNRECOGNIZED_NODE_KIND);
// @ts-expect-error Missing context.
new KinobiError(KINOBI_ERROR__UNEXPECTED_NODE_KIND);

const unknownError = null as unknown as KinobiError;
if (unknownError.context.__code === KINOBI_ERROR__UNEXPECTED_NODE_KIND) {
    unknownError.context satisfies KinobiErrorContext[typeof KINOBI_ERROR__UNEXPECTED_NODE_KIND];
    // @ts-expect-error Context belongs to another error code
    unknownError.context satisfies KinobiErrorContext[typeof KINOBI_ERROR__UNRECOGNIZED_NODE_KIND];
}

const e = null as unknown;
if (isKinobiError(e)) {
    e.context satisfies Readonly<{ __code: KinobiErrorCode }>;
}
if (isKinobiError(e, KINOBI_ERROR__UNEXPECTED_NODE_KIND)) {
    e.context satisfies KinobiErrorContext[typeof KINOBI_ERROR__UNEXPECTED_NODE_KIND];
    // @ts-expect-error Context belongs to another error code
    e.context satisfies KinobiErrorContext[typeof KINOBI_ERROR__UNRECOGNIZED_NODE_KIND];
}

// `KinobiErrorContext` must not contain any keys reserved by `ErrorOptions` (eg. `cause`)
null as unknown as KinobiErrorContext satisfies {
    [Code in keyof KinobiErrorContext]: KinobiErrorContext[Code] extends undefined
        ? undefined
        : {
              [PP in keyof KinobiErrorContext[Code]]: PP extends keyof ErrorOptions
                  ? never
                  : KinobiErrorContext[Code][PP];
          };
};
