import { CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE, CodamaError } from '@codama/errors';
import { programNode, rootNode } from '@codama/nodes';
import { staticVisitor, visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { throwValidatorItemsVisitor, validationItem } from '../src';

test('it throws with the path of the validated node', () => {
    // Given a root node and a visitor reporting an error on its program.
    const program = programNode({ identifier: 'myProgram', publicKey: '1111' });
    const node = rootNode(program);
    const items = [validationItem('error', 'Something is wrong.', [node, program])];
    const visitor = staticVisitor(() => items, { keys: ['rootNode'] });

    // When we visit it using a visitor throwing on errors, then it throws with the path of the root.
    expect(() => visit(node, throwValidatorItemsVisitor(visitor))).toThrow(
        new CodamaError(CODAMA_ERROR__VISITORS__FAILED_TO_VALIDATE_NODE, {
            formattedHistogram: 'errors: 1',
            path: [node],
            validationItems: items,
        }),
    );
});

test('it does not throw on items below the given level', () => {
    // Given a root node and a visitor reporting a warning on it.
    const node = rootNode(programNode({ identifier: 'myProgram', publicKey: '1111' }));
    const visitor = staticVisitor(() => [validationItem('warn', 'Something is odd.', [node])], {
        keys: ['rootNode'],
    });

    // When we visit it using a visitor throwing on errors, then it does not throw.
    expect(() => visit(node, throwValidatorItemsVisitor(visitor))).not.toThrow();
});
