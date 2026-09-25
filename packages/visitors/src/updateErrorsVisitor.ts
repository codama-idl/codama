import { assertIsNode, errorNode, ErrorNodeInput } from '@codama/nodes';
import { BottomUpNodeTransformerWithSelector, bottomUpTransformerVisitor } from '@codama/visitors-core';

import { assertValidUpdateKeys } from './updateHelpers';

export type ErrorUpdates = Partial<ErrorNodeInput> | { delete: true };

const ERROR_UPDATE_KEYS = ['code', 'docs', 'identifier', 'message', 'plugins'];

/**
 * Update or delete errors, keyed by `NodeSelector`s such as error
 * identifiers (matched exactly), optionally prefixed by a program identifier.
 *
 * @throws {CODAMA_ERROR__VISITORS__UNRECOGNIZED_UPDATE_KEYS} if an update
 * contains an unrecognised key (e.g. `name` instead of `identifier`).
 *
 * @example
 * ```ts
 * updateErrorsVisitor({
 *     'splToken.invalidMint': { message: 'The mint is invalid.' },
 *     notRentExempt: { delete: true },
 * });
 * ```
 */
export function updateErrorsVisitor(map: Record<string, ErrorUpdates>) {
    return bottomUpTransformerVisitor(
        Object.entries(map).map(([selector, updates]): BottomUpNodeTransformerWithSelector => {
            assertValidUpdateKeys(selector, updates, 'delete' in updates ? ['delete'] : ERROR_UPDATE_KEYS);
            return {
                select: ['[errorNode]', selector],
                transform: node => {
                    assertIsNode(node, 'errorNode');
                    if ('delete' in updates) return null;
                    return errorNode({ ...node, ...updates });
                },
            };
        }),
    );
}
