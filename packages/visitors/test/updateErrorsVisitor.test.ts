import { CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS, isCodamaError } from '@codama/errors';
import { assertIsNode, errorNode, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { updateErrorsVisitor } from '../src';

const programWithErrors = (identifier: string, publicKey: string) =>
    programNode({
        errors: [
            errorNode({ code: 1, identifier: 'invalidMint', message: 'Invalid mint.' }),
            errorNode({ code: 2, identifier: 'notRentExempt', message: 'Not rent exempt.' }),
        ],
        identifier,
        publicKey,
    });

test('it updates and deletes errors', () => {
    // Given a program with two errors.
    const node = programWithErrors('myProgram', '1111');

    // When we update one error and delete the other.
    const result = visit(
        node,
        updateErrorsVisitor({ invalidMint: { message: 'The mint is invalid.' }, notRentExempt: { delete: true } }),
    );

    // Then we expect the following errors.
    assertIsNode(result, 'programNode');
    expect(result.errors).toStrictEqual([
        errorNode({ code: 1, identifier: 'invalidMint', message: 'The mint is invalid.' }),
    ]);
});

test('it updates errors within a specific program', () => {
    // Given two programs with the same errors.
    const node = rootNode(programWithErrors('programA', '1111'), {
        additionalPrograms: [programWithErrors('programB', '2222')],
    });

    // When we update an error of the second program.
    const result = visit(node, updateErrorsVisitor({ 'programB.invalidMint': { code: 42 } }));

    // Then only that error is updated.
    assertIsNode(result, 'rootNode');
    expect(result.program.errors?.[0].code).toBe(1);
    expect(result.additionalPrograms?.[0].errors?.[0].code).toBe(42);
});

test('it throws on unrecognized update keys', () => {
    // When we use the v1 `name` key, then we expect an error when creating the visitor.
    let error: unknown;
    try {
        updateErrorsVisitor({ invalidMint: { name: 'badMint' } as never });
    } catch (e) {
        error = e;
    }
    expect(isCodamaError(error, CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS)).toBe(true);
});
