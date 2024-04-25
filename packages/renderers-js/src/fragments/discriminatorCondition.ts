import {
    type ConstantDiscriminatorNode,
    constantDiscriminatorNode,
    constantValueNode,
    constantValueNodeFromBytes,
    type DiscriminatorNode,
    type FieldDiscriminatorNode,
    isNode,
    isNodeFilter,
    type ProgramNode,
    type SizeDiscriminatorNode,
    type StructTypeNode,
} from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';
import { getBase64Decoder } from '@solana/codecs-strings';

import type { GlobalFragmentScope } from '../getRenderMapVisitor';
import { Fragment, fragment, mergeFragments } from './common';

/**
 * ```
 * if (data.length === 72) {
 *   return splTokenAccounts.TOKEN;
 * }
 *
 * if (containsBytes(data, getU32Encoder().encode(42), offset)) {
 *   return splTokenAccounts.TOKEN;
 * }
 *
 * if (containsBytes(data, new Uint8Array([1, 2, 3]), offset)) {
 *   return splTokenAccounts.TOKEN;
 * }
 * ```
 */
export function getDiscriminatorConditionFragment(
    scope: Pick<GlobalFragmentScope, 'nameApi' | 'typeManifestVisitor'> & {
        dataName: string;
        discriminators: DiscriminatorNode[];
        ifTrue: string;
        programNode: ProgramNode;
        struct: StructTypeNode;
    },
): Fragment {
    return mergeFragments(
        scope.discriminators.flatMap(discriminator => {
            if (isNode(discriminator, 'sizeDiscriminatorNode')) {
                return [getSizeConditionFragment(discriminator, scope)];
            }
            if (isNode(discriminator, 'constantDiscriminatorNode')) {
                return [getByteConditionFragment(discriminator, scope)];
            }
            if (isNode(discriminator, 'fieldDiscriminatorNode')) {
                return [getFieldConditionFragment(discriminator, scope)];
            }
            return [];
        }),
        r => r.join(' && '),
    ).mapRender(r => `if (${r}) { ${scope.ifTrue}; }`);
}

function getSizeConditionFragment(
    discriminator: SizeDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        dataName: string;
    },
): Fragment {
    const { dataName } = scope;
    return fragment(`${dataName}.length === ${discriminator.size}`);
}

function getByteConditionFragment(
    discriminator: ConstantDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        dataName: string;
    },
): Fragment {
    const { dataName, typeManifestVisitor } = scope;
    const constant = visit(discriminator.constant, typeManifestVisitor).value;
    return constant
        .mapRender(r => `containsBytes(${dataName}, ${r}, ${discriminator.offset})`)
        .addImports('solanaCodecsCore', 'containsBytes');
}

function getFieldConditionFragment(
    discriminator: FieldDiscriminatorNode,
    scope: Pick<GlobalFragmentScope, 'typeManifestVisitor'> & {
        dataName: string;
        struct: StructTypeNode;
    },
): Fragment {
    const field = scope.struct.fields.find(f => f.name === discriminator.name);
    if (!field || !field.defaultValue) {
        // TODO: Coded error.
        throw new Error(
            `Field discriminator "${discriminator.name}" does not have a matching argument with default value.`,
        );
    }

    // This handles the case where a field uses an u8 array to represent its discriminator.
    // In this case, we can simplify the generated code by delegating to a constantDiscriminatorNode.
    if (
        isNode(field.type, 'arrayTypeNode') &&
        isNode(field.type.item, 'numberTypeNode') &&
        field.type.item.format === 'u8' &&
        isNode(field.type.count, 'fixedCountNode') &&
        isNode(field.defaultValue, 'arrayValueNode') &&
        field.defaultValue.items.every(isNodeFilter('numberValueNode'))
    ) {
        const base64Bytes = getBase64Decoder().decode(
            new Uint8Array(field.defaultValue.items.map(node => node.number)),
        );
        return getByteConditionFragment(
            constantDiscriminatorNode(constantValueNodeFromBytes('base64', base64Bytes), discriminator.offset),
            scope,
        );
    }

    return getByteConditionFragment(
        constantDiscriminatorNode(constantValueNode(field.type, field.defaultValue), discriminator.offset),
        scope,
    );
}
