import {
    accountNode,
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    errorNode,
    instructionAccountNode,
    instructionNode,
    integerTypeNode,
    Node,
    optionTypeNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import {
    getLastNodeFromPath,
    getNodeSelectorFunction,
    identityVisitor,
    interceptVisitor,
    isNodePath,
    NodePath,
    NodeSelector,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    visit,
} from '../src';

// Given the following tree. Nodes referenced by the assertions below are
// hoisted into named locals so the assertions can reference them directly,
// rather than re-reading them back through the (optionally-typed) node graph.

// splToken account fields.
const tokenAccountOwnerField = structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() });
const tokenAccountMintField = structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode() });
const tokenAccountAmountField = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
const tokenDelegatedAmountOption = optionTypeNode(integerTypeNode('u64'), { prefix: integerTypeNode('u32') });
const tokenAccountDelegatedAmountField = structFieldTypeNode({
    identifier: 'delegatedAmount',
    type: tokenDelegatedAmountOption,
});
const tokenAccount = accountNode({
    data: structTypeNode([
        tokenAccountOwnerField,
        tokenAccountMintField,
        tokenAccountAmountField,
        tokenAccountDelegatedAmountField,
    ]),
    identifier: 'token',
});

// splToken instruction.
const mintTokenAmountField = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
const mintTokenInstruction = instructionNode({
    accounts: [
        instructionAccountNode({ identifier: 'token', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'mint', isSigner: false, isWritable: true }),
        instructionAccountNode({ identifier: 'mintAuthority', isSigner: true, isWritable: false }),
    ],
    data: structTypeNode([mintTokenAmountField]),
    identifier: 'mintToken',
});

const splTokenProgram = programNode({
    accounts: [tokenAccount],
    errors: [
        errorNode({ code: 0, identifier: 'invalidProgramId', message: 'Invalid program ID' }),
        errorNode({ code: 1, identifier: 'invalidTokenOwner', message: 'Invalid token owner' }),
    ],
    identifier: 'splToken',
    instructions: [mintTokenInstruction],
    publicKey: '1111',
    version: '1.0.0',
});

// christmasProgram account fields.
const giftAccountOwnerField = structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() });
const giftAccountOpenedField = structFieldTypeNode({
    identifier: 'opened',
    type: booleanTypeNode({ size: integerTypeNode('u64') }),
});
const giftAccountAmountField = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
const giftAccountWrappingPaperField = structFieldTypeNode({
    identifier: 'wrappingPaper',
    type: definedTypeLinkNode('wrappingPaper'),
});
const giftAccount = accountNode({
    data: structTypeNode([
        giftAccountOwnerField,
        giftAccountOpenedField,
        giftAccountAmountField,
        giftAccountWrappingPaperField,
    ]),
    identifier: 'gift',
});

// christmasProgram wrappingPaper defined type.
const wrappingPaperGoldOwnerField = structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() });
const wrappingPaperBlueVariant = enumVariantTypeNode('blue');
const wrappingPaperRedVariant = enumVariantTypeNode('red');
const wrappingPaperEnumGold = enumVariantTypeNode('gold', {
    data: structTypeNode([wrappingPaperGoldOwnerField]),
});
const wrappingPaperEnum = enumTypeNode([wrappingPaperBlueVariant, wrappingPaperRedVariant, wrappingPaperEnumGold]);
const wrappingPaper = definedTypeNode({ identifier: 'wrappingPaper', type: wrappingPaperEnum });

// christmasProgram instruction.
const openGiftGiftAccount = instructionAccountNode({ identifier: 'gift', isSigner: false, isWritable: true });
const openGiftOwnerAccount = instructionAccountNode({ identifier: 'owner', isSigner: true, isWritable: false });
const openGiftInstruction = instructionNode({
    accounts: [openGiftGiftAccount, openGiftOwnerAccount],
    identifier: 'openGift',
});

const christmasProgram = programNode({
    accounts: [giftAccount],
    definedTypes: [wrappingPaper],
    errors: [errorNode({ code: 0, identifier: 'invalidProgramId', message: 'Invalid program ID' })],
    identifier: 'christmasProgram',
    instructions: [openGiftInstruction],
    publicKey: '2222',
    version: '1.0.0',
});

const tree = rootNode(splTokenProgram, { additionalPrograms: [christmasProgram] });

const macro = (selector: NodeSelector, expectedSelected: Node[]) => {
    const title =
        typeof selector === 'string'
            ? `it can select nodes using paths: "${selector}"`
            : 'it can select nodes using functions';

    test(title, () => {
        // Given a selector function created from the selector.
        const selectorFunction = getNodeSelectorFunction(selector);

        // And given a visitor that keeps track of selected nodes.
        const stack = new NodeStack();
        const selected = [] as Node[];
        const visitor = pipe(
            identityVisitor(),
            v =>
                interceptVisitor(v, (node, next) => {
                    if (selectorFunction(stack.getPath() as NodePath<Node>)) selected.push(node);
                    return next(node);
                }),
            v => recordNodeStackVisitor(v, stack),
        );

        // When we visit the tree.
        visit(tree, visitor);

        // Then the selected nodes are as expected.
        expect(expectedSelected).toEqual(selected);
        selected.forEach((node, index) => expect(node).toBe(expectedSelected[index]));
    });
};

/**
 * [programNode] splToken
 *     [accountNode] token > [structTypeNode]
 *         [structFieldTypeNode] owner > [publicKeyTypeNode]
 *         [structFieldTypeNode] mint > [publicKeyTypeNode]
 *         [structFieldTypeNode] amount > [integerTypeNode] (u64)
 *         [structFieldTypeNode] delegatedAmount > [optionTypeNode] (prefix: [integerTypeNode] (u32)) > [integerTypeNode] (u64)
 *     [instructionNode] mintToken
 *         [instructionAccountNode] token
 *         [instructionAccountNode] mint
 *         [instructionAccountNode] mintAuthority
 *         [structTypeNode]
 *             [structFieldTypeNode] amount > [integerTypeNode] (u64)
 *     [errorNode] invalidProgramId (0)
 *     [errorNode] invalidTokenOwner (1)
 * [programNode] christmasProgram
 *     [accountNode] gift > [structTypeNode]
 *         [structFieldTypeNode] owner > [publicKeyTypeNode]
 *         [structFieldTypeNode] opened > [booleanTypeNode] > [integerTypeNode] (u64)
 *         [structFieldTypeNode] amount > [integerTypeNode] (u64)
 *         [structFieldTypeNode] wrappingPaper > [definedTypeLinkNode] wrappingPaper
 *     [instructionNode] openGift
 *         [instructionAccountNode] gift
 *         [instructionAccountNode] owner
 *     [definedTypeNode] wrappingPaper > [enumTypeNode]
 *         [enumVariantTypeNode] blue
 *         [enumVariantTypeNode] red
 *         [enumVariantTypeNode] gold > [structTypeNode]
 *             [structFieldTypeNode] owner > [publicKeyTypeNode]
 *     [errorNode] invalidProgramId (0)
 */

// Select programs.
macro('[programNode]', [splTokenProgram, christmasProgram]);
macro('[programNode]splToken', [splTokenProgram]);
macro('christmasProgram', [christmasProgram]);

// Select and filter owner nodes.
macro('owner', [tokenAccountOwnerField, giftAccountOwnerField, wrappingPaperGoldOwnerField, openGiftOwnerAccount]);
macro('[structFieldTypeNode]owner', [tokenAccountOwnerField, giftAccountOwnerField, wrappingPaperGoldOwnerField]);
macro('splToken.owner', [tokenAccountOwnerField]);
macro('[instructionNode].owner', [openGiftOwnerAccount]);
macro('[accountNode].owner', [tokenAccountOwnerField, giftAccountOwnerField]);
macro('[accountNode]token.owner', [tokenAccountOwnerField]);
macro('christmasProgram.[accountNode].owner', [giftAccountOwnerField]);
macro('[programNode]christmasProgram.[definedTypeNode]wrappingPaper.[enumVariantTypeNode]gold.owner', [
    wrappingPaperGoldOwnerField,
]);
macro('christmasProgram.wrappingPaper.gold.owner', [wrappingPaperGoldOwnerField]);

// Select all descendants of a node.
macro('wrappingPaper.*', [
    giftAccountWrappingPaperField.type,
    wrappingPaperEnum,
    wrappingPaperEnum.size,
    wrappingPaperBlueVariant,
    wrappingPaperRedVariant,
    wrappingPaperEnumGold,
    wrappingPaperEnumGold.data!,
    wrappingPaperGoldOwnerField,
    wrappingPaperGoldOwnerField.type,
]);
macro('wrappingPaper.[structFieldTypeNode]', [wrappingPaperGoldOwnerField]);
macro('wrappingPaper.blue', [wrappingPaperBlueVariant]);
macro('amount.*', [tokenAccountAmountField.type, mintTokenAmountField.type, giftAccountAmountField.type]);
macro('[instructionNode].amount.*', [mintTokenAmountField.type]);
macro('[structFieldTypeNode].*', [
    tokenAccountOwnerField.type,
    tokenAccountMintField.type,
    tokenAccountAmountField.type,
    tokenAccountDelegatedAmountField.type,
    tokenDelegatedAmountOption.prefix,
    tokenDelegatedAmountOption.item,
    mintTokenAmountField.type,
    giftAccountOwnerField.type,
    giftAccountOpenedField.type,
    giftAccountOpenedField.type.size,
    giftAccountAmountField.type,
    giftAccountWrappingPaperField.type,
    wrappingPaperGoldOwnerField.type,
]);
macro('[structFieldTypeNode].*.*', [
    tokenDelegatedAmountOption.prefix,
    tokenDelegatedAmountOption.item,
    giftAccountOpenedField.type.size,
]);

// Select multiple node kinds.
macro('[accountNode]gift.[publicKeyTypeNode|booleanTypeNode]', [
    giftAccountOwnerField.type,
    giftAccountOpenedField.type,
]);

// Select using functions.
macro(
    path => isNodePath(path, 'integerTypeNode') && getLastNodeFromPath(path).format === 'u32',
    [tokenDelegatedAmountOption.prefix],
);
