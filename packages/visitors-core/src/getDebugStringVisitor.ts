import { getTextNodeContent, Node } from '@codama/nodes';

import { mergeVisitor } from './generated/mergeVisitor';
import { interceptVisitor } from './interceptVisitor';
import { pipe } from './pipe';
import { Visitor } from './visitor';

export function getDebugStringVisitor(options: { indent?: boolean; indentSeparator?: string } = {}): Visitor<string> {
    const indent = options.indent ?? false;
    const indentSeparator = options.indentSeparator ?? '|   ';
    let stackLevel = -1;

    return pipe(
        mergeVisitor<string>(
            node => {
                const details = getNodeDetails(node).join('.');
                if (indent) {
                    return `${indentSeparator.repeat(stackLevel)}${node.kind}${details ? ` [${details}]` : ''}`;
                }
                return `${node.kind}${details ? `[${details}]` : ''}`;
            },
            (node, values) => {
                const details = getNodeDetails(node).join('.');
                if (indent) {
                    return [
                        `${indentSeparator.repeat(stackLevel)}${node.kind}${details ? ` [${details}]` : ''}`,
                        ...values,
                    ].join('\n');
                }
                return `${node.kind}${details ? `[${details}]` : ''}${values.length > 0 ? `(${values.join(', ')})` : ''}`;
            },
        ),
        v =>
            interceptVisitor(v, (node, next) => {
                stackLevel += 1;
                const newNode = next(node);
                stackLevel -= 1;
                return newNode;
            }),
    );
}

function getNodeDetails(node: Node): string[] {
    switch (node.kind) {
        case 'programNode':
            return [node.identifier, node.publicKey];
        case 'instructionAccountNode':
            return [
                node.identifier,
                ...(node.isWritable ? ['writable'] : []),
                ...(node.isSigner === true ? ['signer'] : []),
                ...(node.isSigner === 'either' ? ['optionalSigner'] : []),
                ...(node.isOptional ? ['optional'] : []),
            ];
        case 'instructionRemainingAccountsNode':
            return [
                ...(node.isOptional ? ['optional'] : []),
                ...(node.isWritable ? ['writable'] : []),
                ...(node.isSigner === true ? ['signer'] : []),
                ...(node.isSigner === 'either' ? ['optionalSigner'] : []),
            ];
        case 'instructionByteDeltaNode':
            return [...(node.subtract ? ['subtract'] : []), ...(node.withHeader ? ['withHeader'] : [])];
        case 'instructionStatusNode':
            return [node.lifecycle, ...(node.message ? [getTextNodeContent(node.message)] : [])];
        case 'errorNode':
            return [node.code.toString(), node.identifier];
        case 'constantNode':
            return [node.identifier];
        case 'accountLinkNode':
        case 'definedTypeLinkNode':
        case 'instructionAccountLinkNode':
        case 'instructionLinkNode':
        case 'pdaLinkNode':
        case 'programLinkNode':
            return [node.identifier];
        case 'integerTypeNode':
        case 'floatTypeNode':
            return [node.format, ...(node.endian === 'be' ? ['bigEndian'] : []), ...(node.unit ? [node.unit] : [])];
        case 'fixedPointTypeNode':
            return [
                `scale:${node.scale}`,
                ...(node.base !== undefined ? [`base:${node.base}`] : []),
                ...(node.unit ? [node.unit] : []),
            ];
        case 'durationTypeNode':
        case 'dateTimeTypeNode':
            return node.ticksPerSecond !== undefined ? [`ticksPerSecond:${node.ticksPerSecond}`] : [];
        case 'stringTypeNode':
            return [node.encoding];
        case 'optionTypeNode':
            return node.fixed ? ['fixed'] : [];
        case 'fixedCountNode':
            return [node.value.toString()];
        case 'sentinelCountNode':
            return node.strategy ? [node.strategy] : [];
        case 'integerValueNode':
        case 'floatValueNode':
            return [node.value];
        case 'stringValueNode':
            return [node.string];
        case 'booleanValueNode':
            return [node.boolean ? 'true' : 'false'];
        case 'bytesValueNode':
            return [node.encoding, node.data];
        case 'publicKeyValueNode':
            return [...(node.identifier ? [`${node.identifier}`] : []), node.publicKey];
        case 'enumValueNode':
            return [node.variant];
        case 'textNode':
            return [getTextNodeContent(node)];
        case 'dataValueNode':
            return [node.path];
        case 'accountDataValueNode':
            return [node.account, ...(node.path ? [node.path] : [])];
        case 'injectedValueNode':
            return [node.key];
        case 'enumVariantTypeNode':
            return [
                node.identifier,
                ...(node.discriminator !== undefined ? [`discriminator:${node.discriminator}`] : []),
            ];
        case 'pluginNode':
            return [node.namespace];
        case 'constantDiscriminatorNode':
            return node.offset > 0 ? [`offset:${node.offset}`] : [];
        case 'fieldDiscriminatorNode':
            return [node.path, ...(node.offset > 0 ? [`offset:${node.offset}`] : [])];
        case 'sizeDiscriminatorNode':
            return [node.size.toString()];
        case 'fixedSizeTransformNode':
            return [node.size.toString()];
        case 'sizePrefixTransformNode':
        case 'sentinelTransformNode':
            return [];
        case 'preOffsetTransformNode':
        case 'postOffsetTransformNode':
            return [node.offset.toString(), node.strategy];
        default:
            return 'identifier' in node ? [node.identifier] : [];
    }
}
