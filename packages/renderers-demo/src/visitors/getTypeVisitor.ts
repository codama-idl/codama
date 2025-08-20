import {
    camelCase,
    definedTypeNode,
    enumStructVariantTypeNode,
    isNode,
    isScalarEnum,
    pascalCase,
    REGISTERED_TYPE_NODE_KINDS,
    resolveNestedTypeNode,
    structFieldTypeNode,
    structTypeNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@codama/nodes';
import { mapFragmentContent } from '@codama/renderers-core';
import {
    extendVisitor,
    findLastNodeFromPath,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    staticVisitor,
    visit,
} from '@codama/visitors-core';

import { addFragmentImports, Fragment, fragment, mergeFragments } from '../utils';

export type TypeVisitor = ReturnType<typeof getTypeVisitor>;

export function getTypeVisitor(input: { stack?: NodeStack; typeIndent?: string } = {}) {
    const typeIndent = input.typeIndent ?? '    ';
    const stack = input.stack ?? new NodeStack();

    // Keeps track of the indentation level.
    let indentLevel = 0;
    const indent = () => typeIndent.repeat(indentLevel);
    const shouldInline = (fragment: Fragment) => {
        if (fragment.content.includes('\n')) return false;
        return indent().length + fragment.content.length <= 100;
    };

    return pipe(
        staticVisitor(() => fragment(''), {
            keys: [
                ...REGISTERED_TYPE_NODE_KINDS,
                'definedTypeLinkNode',
                'definedTypeNode',
                'accountNode',
                'instructionNode',
            ],
        }),
        visitor =>
            extendVisitor(visitor, {
                visitAccount(node, { self }) {
                    return visit(definedTypeNode({ name: node.name, type: node.data }), self);
                },

                visitAmountType(node, { self }) {
                    // Here, we ignore decimal and unit information for simplicity.
                    return visit(node.number, self);
                },

                visitArrayType(node, { self }) {
                    return pipe(visit(node.item, self), f => mapFragmentContent(f, c => `Array<${c}>`));
                },

                visitBooleanType() {
                    return fragment(`boolean`);
                },

                visitBytesType() {
                    return fragment(`bytes`);
                },

                visitDateTimeType(node, { self }) {
                    // Here, we ignore DateTime information for simplicity.
                    return visit(node.number, self);
                },

                visitDefinedType(node, { self }) {
                    const type = visit(node.type, self);
                    if (isNode(node.type, 'enumTypeNode') && isScalarEnum(node.type)) {
                        return mapFragmentContent(type, c => `enum ${pascalCase(node.name)} ${c}`);
                    }
                    return mapFragmentContent(type, c => `type ${pascalCase(node.name)} = ${c}`);
                },

                visitDefinedTypeLink(node) {
                    const typeName = pascalCase(node.name);
                    return pipe(fragment(typeName), f => addFragmentImports(f, 'generatedTypes', typeName));
                },

                visitEnumEmptyVariantType(node) {
                    const nodePath = stack.getPath('enumEmptyVariantTypeNode');
                    const enumParent = findLastNodeFromPath(nodePath, 'enumTypeNode');
                    if (!enumParent) throw new Error('Enum parent not found');

                    if (isScalarEnum(enumParent)) return fragment(pascalCase(node.name));
                    return fragment(`{ __kind: "${pascalCase(node.name)}" }`);
                },

                visitEnumStructVariantType(node, { self }) {
                    const fields = resolveNestedTypeNode(node.struct).fields;
                    const kindField = fragment(`__kind: "${pascalCase(node.name)}"`);

                    const inlinedStruct = pipe(
                        fields.map(field => visit(field, self)),
                        fs => [kindField, ...fs],
                        fs => mergeFragments(fs, cs => `{ ${cs.join('; ')} }`),
                    );
                    if (shouldInline(inlinedStruct)) return inlinedStruct;

                    indentLevel++;
                    const result = pipe(
                        fields.map(field => visit(field, self)),
                        fs => [kindField, ...fs],
                        fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c};\n`).join('')),
                    );
                    indentLevel--;
                    return mapFragmentContent(result, c => `{\n${c}${indent()}}`);
                },

                visitEnumTupleVariantType(node, { self }) {
                    const structVariant = enumStructVariantTypeNode(
                        node.name,
                        structTypeNode([structFieldTypeNode({ name: 'fields', type: node.tuple })]),
                        node.discriminator,
                    );
                    return visit(structVariant, self);
                },

                visitEnumType(node, { self }) {
                    if (isScalarEnum(node)) {
                        const inlinedEnum = pipe(
                            node.variants.map(v => visit(v, self)),
                            fs => mergeFragments(fs, cs => `{ ${cs.join(', ')} }`),
                        );
                        if (shouldInline(inlinedEnum)) return inlinedEnum;

                        indentLevel++;
                        const variants = pipe(
                            node.variants.map(field => visit(field, self)),
                            fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c},\n`).join('')),
                        );
                        indentLevel--;
                        return mapFragmentContent(variants, c => `{\n${c}${indent()}}`);
                    }

                    const inlinedEnum = pipe(
                        node.variants.map(v => visit(v, self)),
                        fs => mergeFragments(fs, cs => cs.join(' | ')),
                    );
                    if (shouldInline(inlinedEnum)) return inlinedEnum;

                    indentLevel++;
                    const variants = pipe(
                        node.variants.map(field => visit(field, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `| ${c}`).join(`\n${indent()}`)),
                    );
                    indentLevel--;
                    return variants;
                },

                visitFixedSizeType(node, { self }) {
                    // Here, we ignore fixed size information for simplicity.
                    return visit(node.type, self);
                },

                visitHiddenPrefixType(node, { self }) {
                    // Here, we ignore hidden prefix information for simplicity.
                    return visit(node.type, self);
                },

                visitHiddenSuffixType(node, { self }) {
                    // Here, we ignore hidden suffix information for simplicity.
                    return visit(node.type, self);
                },

                visitInstruction(node, { self }) {
                    const definedTypeArguments = definedTypeNode({
                        name: `${camelCase(node.name)}Instruction`,
                        type: structTypeNodeFromInstructionArgumentNodes(node.arguments),
                    });
                    return visit(definedTypeArguments, self);
                },

                visitMapType(node, { self }) {
                    const key = visit(node.key, self);
                    const value = visit(node.value, self);
                    return mergeFragments([key, value], ([k, v]) => `Map<${k}, ${v}>`);
                },

                visitNumberType(node) {
                    return fragment(`number /* ${node.format} */`);
                },

                visitOptionType(node, { self }) {
                    return pipe(visit(node.item, self), f => mapFragmentContent(f, c => `Option<${c}>`));
                },

                visitPostOffsetType(node, { self }) {
                    // Here, we ignore post offset information for simplicity.
                    return visit(node.type, self);
                },

                visitPreOffsetType(node, { self }) {
                    // Here, we ignore pre offset information for simplicity.
                    return visit(node.type, self);
                },

                visitPublicKeyType() {
                    return fragment(`Address`);
                },

                visitRemainderOptionType(node, { self }) {
                    return pipe(visit(node.item, self), f => mapFragmentContent(f, c => `Option<${c}>`));
                },

                visitSentinelType(node, { self }) {
                    // Here, we ignore sentinel information for simplicity.
                    return visit(node.type, self);
                },

                visitSetType(node, { self }) {
                    return pipe(visit(node.item, self), f => mapFragmentContent(f, c => `Set<${c}>`));
                },

                visitSizePrefixType(node, { self }) {
                    // Here, we ignore size prefix information for simplicity.
                    return visit(node.type, self);
                },

                visitSolAmountType(node, { self }) {
                    // Here, we ignore sol amount information for simplicity.
                    return visit(node.number, self);
                },

                visitStringType() {
                    return fragment(`string`);
                },

                visitStructFieldType(node, { self }) {
                    const name = camelCase(node.name);
                    return pipe(visit(node.type, self), f => mapFragmentContent(f, c => `${name}: ${c}`));
                },

                visitStructType(node, { self }) {
                    if (node.fields.length === 0) return fragment(`{}`);

                    const inlinedStruct = pipe(
                        node.fields.map(field => visit(field, self)),
                        fs => mergeFragments(fs, cs => `{ ${cs.join('; ')} }`),
                    );
                    if (shouldInline(inlinedStruct)) return inlinedStruct;

                    indentLevel++;
                    const fields = pipe(
                        node.fields.map(field => visit(field, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c};\n`).join('')),
                    );
                    indentLevel--;
                    return mapFragmentContent(fields, c => `{\n${c}${indent()}}`);
                },

                visitTupleType(node, { self }) {
                    const inlinedTuple = pipe(
                        node.items.map(item => visit(item, self)),
                        fs => mergeFragments(fs, cs => `[${cs.join(', ')}]`),
                    );
                    if (shouldInline(inlinedTuple)) return inlinedTuple;

                    indentLevel++;
                    const items = pipe(
                        node.items.map(item => visit(item, self)),
                        fs => mergeFragments(fs, cs => cs.map(c => `${indent()}${c},\n`).join('')),
                    );
                    indentLevel--;
                    return mapFragmentContent(items, c => `[\n${c}${indent()}]`);
                },

                visitZeroableOptionType(node, { self }) {
                    return pipe(visit(node.item, self), f => mapFragmentContent(f, c => `Option<${c}>`));
                },
            }),
        visitor => recordNodeStackVisitor(visitor, stack),
    );
}
