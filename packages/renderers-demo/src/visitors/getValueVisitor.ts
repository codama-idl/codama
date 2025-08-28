import { pascalCase, REGISTERED_VALUE_NODE_KINDS } from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import { extendVisitor, NodeStack, pipe, recordNodeStackVisitor, staticVisitor, visit } from '@codama/visitors-core';

import { addFragmentImports, fragment, getStringValueAsHexadecimals, mergeFragments } from '../utils';

export type ValueVisitor = ReturnType<typeof getValueVisitor>;

export function getValueVisitor(input: { stack?: NodeStack } = {}) {
    const stack = input.stack ?? new NodeStack();

    return pipe(
        staticVisitor(() => fragment(''), {
            keys: [...REGISTERED_VALUE_NODE_KINDS, 'programIdValueNode'],
        }),
        visitor =>
            extendVisitor(visitor, {
                visitArrayValue(node, { self }) {
                    return mergeFragments(
                        node.items.map(item => visit(item, self)),
                        cs => `[${cs.join(', ')}]`,
                    );
                },

                visitBooleanValue(node) {
                    return fragment(node.boolean ? 'true' : 'false');
                },

                visitBytesValue(node) {
                    return fragment(getStringValueAsHexadecimals(node.encoding, node.data));
                },

                visitConstantValue(node, { self }) {
                    return visit(node.value, self);
                },

                visitEnumValue(node) {
                    return pipe(fragment(`${pascalCase(node.enum.name)}.${pascalCase(node.variant)}`), f =>
                        addFragmentImports(f, 'generatedTypes', pascalCase(node.enum.name)),
                    );
                },

                visitMapEntryValue(node, { self }) {
                    const key = visit(node.key, self);
                    const value = visit(node.value, self);
                    return mergeFragments([key, value], ([k, v]) => `[${k}, ${v}]`);
                },

                visitMapValue(node, { self }) {
                    return mergeFragments(
                        node.entries.map(entry => visit(entry, self)),
                        cs => `new Map([${cs.join(', ')}])`,
                    );
                },

                visitNoneValue() {
                    return fragment('null');
                },

                visitNumberValue(node) {
                    return fragment(node.number.toString());
                },

                visitProgramIdValue() {
                    return fragment('programId');
                },

                visitPublicKeyValue(node) {
                    return fragment(`"${node.publicKey}"`);
                },

                visitSetValue(node, { self }) {
                    return mergeFragments(
                        node.items.map(item => visit(item, self)),
                        cs => `new Set([${cs.join(', ')}])`,
                    );
                },

                visitSomeValue(node, { self }) {
                    return visit(node.value, self);
                },

                visitStringValue(node) {
                    return fragment(`"${node.string}"`);
                },

                visitStructFieldValue(node, { self }) {
                    return mapFragmentContent(visit(node.value, self), c => `${node.name}: ${c}`);
                },

                visitStructValue(node, { self }) {
                    return mergeFragments(
                        node.fields.map(field => visit(field, self)),
                        cs => (cs.length > 0 ? `{ ${cs.join(', ')} }` : '{}'),
                    );
                },

                visitTupleValue(node, { self }) {
                    return mergeFragments(
                        node.items.map(item => visit(item, self)),
                        cs => `[${cs.join(', ')}]`,
                    );
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}
