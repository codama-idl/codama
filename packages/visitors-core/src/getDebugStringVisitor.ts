import { Node } from '@codama/nodes';

import { interceptVisitor } from './interceptVisitor';
import { mergeVisitor } from './mergeVisitor';
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
                return `${node.kind}${details ? `[${details}]` : ''}(${values.join(', ')})`;
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
            return [node.name, node.publicKey];
        case 'instructionAccountNode':
            return [
                node.name,
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
            return [node.lifecycle, ...(node.message ? [node.message] : [])];
        case 'errorNode':
            return [node.code.toString(), node.name];
        case 'accountLinkNode':
        case 'definedTypeLinkNode':
        case 'instructionAccountLinkNode':
        case 'instructionArgumentLinkNode':
        case 'instructionLinkNode':
        case 'pdaLinkNode':
        case 'programLinkNode':
            return [node.name];
        case 'numberTypeNode':
            return [node.format, ...(node.endian === 'be' ? ['bigEndian'] : [])];
        case 'amountTypeNode':
            return [node.decimals.toString(), ...(node.unit ? [node.unit] : [])];
        case 'stringTypeNode':
            return [node.encoding];
        case 'optionTypeNode':
            return node.fixed ? ['fixed'] : [];
        case 'fixedCountNode':
            return [node.value.toString()];
        case 'numberValueNode':
            return [node.number.toString()];
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
        case 'resolverValueNode':
            return [node.name];
        case 'constantDiscriminatorNode':
            return [...(node.offset > 0 ? [`offset:${node.offset}`] : [])];
        case 'fieldDiscriminatorNode':
            return [node.name, ...(node.offset > 0 ? [`offset:${node.offset}`] : [])];
        case 'sizeDiscriminatorNode':
            return [node.size.toString()];
        case 'fixedSizeTypeNode':
            return [node.size.toString()];
        case 'preOffsetTypeNode':
            return [node.offset.toString(), node.strategy ?? 'relative'];
        case 'postOffsetTypeNode':
            return [node.offset.toString(), node.strategy ?? 'relative'];
        default:
            return 'name' in node ? [node.name] : [];
    }
}
