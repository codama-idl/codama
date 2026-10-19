import {
    assertIsNode,
    DataValueNode,
    dataValueNode,
    fieldDiscriminatorNode,
    instructionNode,
    InstructionNode,
    isNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    getNodePathUntilLastNode,
    NodeStack,
    parsePath,
    visit,
} from '@codama/visitors-core';

import { getFlattenedStruct } from './flattenStructHelpers';
import { mapInterpolatedIntentPlaceholders, serializePath } from './updateHelpers';

/**
 * Inline the fields of the struct-typed fields of every instruction's
 * `data`, when that data is a struct.
 *
 * The data paths of the instruction going through an inlined field are
 * repointed to the inlined fields, e.g. `params.seed` becomes `seed` once
 * `params` is inlined. These are the paths of its `dataValueNode`s (e.g. in
 * account default values, byte deltas, remaining accounts or provided
 * nodes), its `fieldDiscriminatorNode`s and the `${data.…}` placeholders of
 * its interpolated intent. Data paths are relative to the data of their
 * closest instruction, so those of sub-instructions are repointed when
 * their own data is flattened. Plugin payloads are inert and left as they
 * are.
 *
 * An instruction is left unflattened when inlining would make two fields
 * share a camelCase form (e.g. `amount` and `params.amount`), or when one
 * of its data paths refers to a field to inline as a whole (e.g. a
 * `params` seed), since that path would have nothing to point to.
 *
 * Linked data (`definedTypeLinkNode`) is left untouched, since the defined
 * type may be shared; unwrap it first (e.g. with
 * `unwrapInstructionDataDefinedTypesVisitor`) to flatten it.
 *
 * @throws {CODAMA_ERROR__VISITORS__CANNOT_FLATTEN_STRUCT_WITH_PLUGINS} if
 * a struct to inline carries `plugins`, since they would be lost.
 */
export function flattenInstructionDataVisitor() {
    return bottomUpTransformerVisitor([
        {
            select: '[instructionNode]',
            transform: (instruction, stack) => {
                assertIsNode(instruction, 'instructionNode');
                if (!isNode(instruction.data, 'structTypeNode')) return instruction;
                const dataPath = [...stack.getPath(), instruction.data];
                const { conflictingAttributes, inlinedFields, struct } = getFlattenedStruct(
                    instruction.data,
                    '*',
                    dataPath,
                );
                if (conflictingAttributes.length > 0) return instruction;
                const repointed = repointInlinedDataPaths(instruction, new Set(inlinedFields));
                return repointed ? instructionNode({ ...repointed, data: struct }) : instruction;
            },
        },
    ]);
}

/**
 * Repoint the data paths of `instruction` going through the given inlined
 * fields, dropping their first segment. Returns `undefined` when a data path
 * refers to an inlined field as a whole, since it cannot be repointed.
 */
function repointInlinedDataPaths(
    instruction: InstructionNode,
    inlinedFields: ReadonlySet<string>,
): InstructionNode | undefined {
    if (inlinedFields.size === 0) return instruction;
    let hasWholeFieldReference = false;

    const repointPath = (path: string): string => {
        const segments = parsePath(path);
        const [first, next] = segments;
        if (first?.kind !== 'field' || !inlinedFields.has(first.identifier)) return path;
        if (next?.kind !== 'field') {
            hasWholeFieldReference = true;
            return path;
        }
        return serializePath(segments.slice(1));
    };
    const repointDataValue = (node: DataValueNode): DataValueNode => {
        const path = repointPath(node.path);
        return path === node.path ? node : dataValueNode(path, { ...node });
    };
    // Only paths whose closest instruction is the visited one are relative to its data.
    const isOwnPath = (stack: NodeStack): boolean =>
        getNodePathUntilLastNode(stack.getPath(), 'instructionNode')?.length === 1;

    const result = visit(
        instruction,
        bottomUpTransformerVisitor([
            {
                select: '[dataValueNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'dataValueNode');
                    return isOwnPath(stack) ? repointDataValue(node) : node;
                },
            },
            {
                select: '[fieldDiscriminatorNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'fieldDiscriminatorNode');
                    if (!isOwnPath(stack)) return node;
                    const path = repointPath(node.path);
                    return path === node.path ? node : fieldDiscriminatorNode(path, { ...node });
                },
            },
            {
                select: '[instructionDisplayNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'instructionDisplayNode');
                    if (!isOwnPath(stack)) return node;
                    return mapInterpolatedIntentPlaceholders(node, placeholder =>
                        isNode(placeholder, 'dataValueNode') ? repointDataValue(placeholder) : placeholder,
                    );
                },
            },
        ]),
    );
    assertIsNode(result, 'instructionNode');
    return hasWholeFieldReference ? undefined : result;
}
