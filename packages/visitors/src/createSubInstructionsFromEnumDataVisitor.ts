import { CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    assertIsNode,
    EnumTypeNode,
    EnumVariantTypeNode,
    identifierString,
    InstructionNode,
    instructionNode,
    integerValueNode,
    isNode,
    structFieldTypeNode,
    StructTypeNode,
    structTypeNode,
    TypeNode,
} from '@codama/nodes';
import {
    BottomUpNodeTransformerWithSelector,
    bottomUpTransformerVisitor,
    findProgramNodeFromPath,
    getLastNodeFromPath,
    LinkableDictionary,
    NodePath,
    pipe,
    recordLinkablesOnFirstVisitVisitor,
} from '@codama/visitors-core';

import { flattenStruct } from './flattenStructVisitor';
import { inlineDefinedType } from './inlineDefinedTypeHelpers';

/**
 * Create one sub-instruction per variant of an enum field of an
 * instruction's data.
 *
 * The map's keys select instructions and its values are the identifiers of
 * their enum data fields (matched exactly). The enum may be inline or
 * linked, and so may the instruction data. Each sub-instruction is named
 * `${instruction}_${variant}`, without any casing transformation, and
 * replaces the enum field with:
 * - a `${instruction}_${variant}_discriminator` field using the enum's
 *   `size`, whose omitted default value is the variant's discriminator;
 * - the variant's payload under the enum field's identifier, inlined when
 *   it is a struct.
 *
 * When the enum carries transforms, the discriminator and payload stay
 * grouped in a struct carrying them, so the wire format is preserved.
 *
 * @throws {CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND} if
 * the instruction has no data, if its data has no such field or if that
 * field is not an enum.
 * @throws {CODAMA_ERROR__UNEXPECTED_NODE_KIND} if the instruction data is
 * not a struct.
 * @throws {CODAMA_ERROR__LINKED_NODE_NOT_FOUND} if the instruction data or
 * the enum field links to a missing defined type.
 */
export function createSubInstructionsFromEnumDataVisitor(map: Record<string, string>) {
    const linkables = new LinkableDictionary();

    const visitor = bottomUpTransformerVisitor(
        Object.entries(map).map(([selector, fieldName]): BottomUpNodeTransformerWithSelector => ({
            select: ['[instructionNode]', selector],
            transform: (node, stack) => {
                assertIsNode(node, 'instructionNode');
                const notFound = () =>
                    new CodamaError(CODAMA_ERROR__VISITORS__INSTRUCTION_ENUM_DATA_FIELD_NOT_FOUND, {
                        fieldName: identifierString(fieldName),
                        instruction: node,
                        instructionName: node.identifier,
                    });

                if (!node.data) throw notFound();
                const data = resolveType(node.data, stack.getPath(), linkables);
                assertIsNode(data, 'structTypeNode');

                const fields = data.fields ?? [];
                const fieldIndex = fields.findIndex(field => field.identifier === fieldName);
                if (fieldIndex < 0) throw notFound();
                const field = fields[fieldIndex];
                const enumType = resolveType(field.type, stack.getPath(), linkables);
                if (!isNode(enumType, 'enumTypeNode')) throw notFound();

                const subInstructions = (enumType.variants ?? []).map((variant, index): InstructionNode => {
                    const subName = `${node.identifier}_${variant.identifier}`;
                    const subData = getSubInstructionData(data, fieldIndex, enumType, variant, index, subName);
                    return instructionNode({ ...node, data: subData, identifier: subName, subInstructions: undefined });
                });

                return instructionNode({
                    ...node,
                    subInstructions: [...(node.subInstructions ?? []), ...subInstructions],
                });
            },
        })),
    );

    return pipe(visitor, v => recordLinkablesOnFirstVisitVisitor(v, linkables));
}

/** Follow a defined type link, if any, without mutating the linked defined type. */
function resolveType(type: TypeNode, path: NodePath, linkables: LinkableDictionary): TypeNode {
    if (!isNode(type, 'definedTypeLinkNode')) return type;
    const definedTypePath = linkables.getPathOrThrow([...path, type]);
    const definedType = getLastNodeFromPath(definedTypePath);
    return inlineDefinedType(type, definedType.type, {
        definedTypeProgram: findProgramNodeFromPath(definedTypePath)?.identifier,
        linkProgram: findProgramNodeFromPath(path)?.identifier,
    });
}

function getSubInstructionData(
    data: StructTypeNode,
    fieldIndex: number,
    enumType: EnumTypeNode,
    variant: EnumVariantTypeNode,
    variantIndex: number,
    subName: string,
): StructTypeNode {
    const fields = data.fields ?? [];
    const field = fields[fieldIndex];
    const discriminatorField = structFieldTypeNode({
        defaultValue: integerValueNode(String(variant.discriminator ?? variantIndex)),
        defaultValueStrategy: 'omitted',
        identifier: `${subName}_discriminator`,
        type: enumType.size,
    });
    const payloadField = variant.data
        ? structFieldTypeNode({
              docs: field.docs,
              identifier: field.identifier,
              plugins: field.plugins,
              type: variant.data,
          })
        : undefined;
    const variantStruct = structTypeNode(payloadField ? [discriminatorField, payloadField] : [discriminatorField], {
        transforms: enumType.transforms,
    });

    const subData = structTypeNode(
        [
            ...fields.slice(0, fieldIndex),
            structFieldTypeNode({ identifier: field.identifier, type: variantStruct }),
            ...fields.slice(fieldIndex + 1),
        ],
        { ...data },
    );

    // Inline the discriminator and payload, then the payload's fields when it is a struct.
    return flattenStruct(flattenStruct(subData, [field.identifier]), [field.identifier]);
}
