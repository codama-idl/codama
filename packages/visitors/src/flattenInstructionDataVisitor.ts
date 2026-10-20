import { camelCase } from '@codama/fragments/casing';
import {
    assertIsNode,
    DataValueNode,
    dataValueNode,
    fieldDiscriminatorNode,
    IdentifierString,
    instructionNode,
    InstructionNode,
    isNode,
    StructTypeNode,
} from '@codama/nodes';
import {
    bottomUpTransformerVisitor,
    getNodePathUntilLastNode,
    NodeStack,
    parsePath,
    visit,
} from '@codama/visitors-core';

import { getFlattenedStruct, isInlinableStructField } from './flattenStructHelpers';
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
 * Each struct field is inlined on its own, and a field is kept nested,
 * while the others are still inlined, when:
 * - one of the instruction's data paths refers to it as a whole (e.g. a
 *   `params` seed or `params[0]`), since that path would have nothing to
 *   point to;
 * - one of its fields would share a camelCase form with another resulting
 *   field (e.g. `amount` and `params.amount`). Every field involved in such
 *   a conflict is kept nested, regardless of field order, and this is
 *   repeated until no conflict remains, since a field kept nested may
 *   itself conflict with the inlined fields of another.
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
                const fieldsToInline = getFieldsToInline(instruction, instruction.data);
                if (fieldsToInline.length === 0) return instruction;
                const dataPath = [...stack.getPath(), instruction.data];
                const { struct } = getFlattenedStruct(instruction.data, fieldsToInline, dataPath);
                const repointed = repointInlinedDataPaths(instruction, new Set(fieldsToInline));
                return instructionNode({ ...repointed, data: struct });
            },
        },
    ]);
}

/**
 * The identifiers of the struct fields of `data` to inline, in field order:
 * the inlinable ones that are neither referenced as a whole by a data path
 * of `instruction` nor involved in a camelCase conflict once inlined.
 */
function getFieldsToInline(instruction: InstructionNode, data: StructTypeNode): IdentifierString[] {
    const fields = data.fields ?? [];
    const inlinableFields = new Set(fields.filter(isInlinableStructField).map(field => field.identifier));
    if (inlinableFields.size === 0) return [];
    const wholeFieldReferences = getWholeFieldReferences(instruction, inlinableFields);
    const candidates = new Set([...inlinableFields].filter(identifier => !wholeFieldReferences.has(identifier)));

    // Drop the fields involved in conflicts until none remains, since a dropped field takes its place back.
    for (;;) {
        // The inlined fields each resulting identifier comes from, `undefined` for those kept as they are.
        const sourcesByCamelCase = new Map<string, (IdentifierString | undefined)[]>();
        fields.forEach(field => {
            const isInlined = candidates.has(field.identifier);
            const resultingFields = isInlined ? ((field.type as StructTypeNode).fields ?? []) : [field];
            resultingFields.forEach(resultingField => {
                const key = camelCase(resultingField.identifier);
                const source = isInlined ? field.identifier : undefined;
                sourcesByCamelCase.set(key, [...(sourcesByCamelCase.get(key) ?? []), source]);
            });
        });
        const conflictingFields = [...sourcesByCamelCase.values()]
            .filter(sources => sources.length > 1)
            .flat()
            .filter(source => source !== undefined);
        if (conflictingFields.length === 0) break;
        conflictingFields.forEach(identifier => candidates.delete(identifier));
    }

    return fields.map(field => field.identifier).filter(identifier => candidates.has(identifier));
}

/**
 * The given fields that a data path of `instruction` refers to as a whole,
 * i.e. paths made of the field alone or followed by an index (e.g. `params`
 * or `params[0]`), as opposed to one of its fields (e.g. `params.seed`).
 */
function getWholeFieldReferences(instruction: InstructionNode, fields: ReadonlySet<string>): Set<string> {
    const references = new Set<string>();
    mapOwnDataPaths(instruction, path => {
        const [first, next] = parsePath(path);
        if (first?.kind === 'field' && fields.has(first.identifier) && next?.kind !== 'field') {
            references.add(first.identifier);
        }
        return path;
    });
    return references;
}

/**
 * Repoint the data paths of `instruction` going through the given inlined
 * fields, dropping their first segment. These fields must not be referenced
 * as a whole, see {@link getWholeFieldReferences}.
 */
function repointInlinedDataPaths(instruction: InstructionNode, inlinedFields: ReadonlySet<string>): InstructionNode {
    return mapOwnDataPaths(instruction, path => {
        const segments = parsePath(path);
        const [first] = segments;
        if (first?.kind !== 'field' || !inlinedFields.has(first.identifier)) return path;
        return serializePath(segments.slice(1));
    });
}

/**
 * Map the data paths of `instruction` that are relative to its own data,
 * i.e. those whose closest instruction is `instruction` rather than one of
 * its sub-instructions. Nodes whose path is unchanged are kept as they are.
 */
function mapOwnDataPaths(instruction: InstructionNode, map: (path: string) => string): InstructionNode {
    const mapDataValue = (node: DataValueNode): DataValueNode => {
        const path = map(node.path);
        return path === node.path ? node : dataValueNode(path, { ...node });
    };
    const isOwnPath = (stack: NodeStack): boolean =>
        getNodePathUntilLastNode(stack.getPath(), 'instructionNode')?.length === 1;

    const result = visit(
        instruction,
        bottomUpTransformerVisitor([
            {
                select: '[dataValueNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'dataValueNode');
                    return isOwnPath(stack) ? mapDataValue(node) : node;
                },
            },
            {
                select: '[fieldDiscriminatorNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'fieldDiscriminatorNode');
                    if (!isOwnPath(stack)) return node;
                    const path = map(node.path);
                    return path === node.path ? node : fieldDiscriminatorNode(path, { ...node });
                },
            },
            {
                select: '[instructionDisplayNode]',
                transform: (node, stack) => {
                    assertIsNode(node, 'instructionDisplayNode');
                    if (!isOwnPath(stack)) return node;
                    return mapInterpolatedIntentPlaceholders(node, placeholder =>
                        isNode(placeholder, 'dataValueNode') ? mapDataValue(placeholder) : placeholder,
                    );
                },
            },
        ]),
    );
    assertIsNode(result, 'instructionNode');
    return result;
}
