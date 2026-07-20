import {
    accountNode,
    booleanTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumStructVariantTypeNode,
    enumTypeNode,
    errorNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    Node,
    numberTypeNode,
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
const tokenAccountOwnerField = structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() });
const tokenAccountMintField = structFieldTypeNode({ name: 'mint', type: publicKeyTypeNode() });
const tokenAccountAmountField = structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') });
const tokenDelegatedAmountOption = optionTypeNode(numberTypeNode('u64'), { prefix: numberTypeNode('u32') });
const tokenAccountDelegatedAmountField = structFieldTypeNode({
    name: 'delegatedAmount',
    type: tokenDelegatedAmountOption,
});
const tokenAccount = accountNode({
    data: structTypeNode([
        tokenAccountOwnerField,
        tokenAccountMintField,
        tokenAccountAmountField,
        tokenAccountDelegatedAmountField,
    ]),
    name: 'token',
});

// splToken instruction.
const mintTokenAmountArgument = instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') });
const mintTokenInstruction = instructionNode({
    accounts: [
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'token' }),
        instructionAccountNode({ isSigner: false, isWritable: true, name: 'mint' }),
        instructionAccountNode({ isSigner: true, isWritable: false, name: 'mintAuthority' }),
    ],
    arguments: [mintTokenAmountArgument],
    name: 'mintToken',
});

const splTokenProgram = programNode({
    accounts: [tokenAccount],
    errors: [
        errorNode({ code: 0, message: 'Invalid program ID', name: 'invalidProgramId' }),
        errorNode({ code: 1, message: 'Invalid token owner', name: 'invalidTokenOwner' }),
    ],
    instructions: [mintTokenInstruction],
    name: 'splToken',
    publicKey: '1111',
    version: '1.0.0',
});

// christmasProgram account fields.
const giftAccountOwnerField = structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() });
const giftAccountOpenedField = structFieldTypeNode({ name: 'opened', type: booleanTypeNode(numberTypeNode('u64')) });
const giftAccountAmountField = structFieldTypeNode({ name: 'amount', type: numberTypeNode('u64') });
const giftAccountWrappingPaperField = structFieldTypeNode({
    name: 'wrappingPaper',
    type: definedTypeLinkNode('wrappingPaper'),
});
const giftAccount = accountNode({
    data: structTypeNode([
        giftAccountOwnerField,
        giftAccountOpenedField,
        giftAccountAmountField,
        giftAccountWrappingPaperField,
    ]),
    name: 'gift',
});

// christmasProgram wrappingPaper defined type.
const wrappingPaperGoldOwnerField = structFieldTypeNode({ name: 'owner', type: publicKeyTypeNode() });
const wrappingPaperBlueVariant = enumEmptyVariantTypeNode('blue');
const wrappingPaperRedVariant = enumEmptyVariantTypeNode('red');
const wrappingPaperEnumGold = enumStructVariantTypeNode('gold', structTypeNode([wrappingPaperGoldOwnerField]));
const wrappingPaperEnum = enumTypeNode([wrappingPaperBlueVariant, wrappingPaperRedVariant, wrappingPaperEnumGold]);
const wrappingPaper = definedTypeNode({ name: 'wrappingPaper', type: wrappingPaperEnum });

// christmasProgram instruction.
const openGiftGiftAccount = instructionAccountNode({ isSigner: false, isWritable: true, name: 'gift' });
const openGiftOwnerAccount = instructionAccountNode({ isSigner: true, isWritable: false, name: 'owner' });
const openGiftInstruction = instructionNode({
    accounts: [openGiftGiftAccount, openGiftOwnerAccount],
    name: 'openGift',
});

const christmasProgram = programNode({
    accounts: [giftAccount],
    definedTypes: [wrappingPaper],
    errors: [errorNode({ code: 0, message: 'Invalid program ID', name: 'invalidProgramId' })],
    instructions: [openGiftInstruction],
    name: 'christmasProgram',
    publicKey: '2222',
    version: '1.0.0',
});

const tree = rootNode(splTokenProgram, [christmasProgram]);

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
 *         [structFieldTypeNode] amount > [numberTypeNode] (u64)
 *         [structFieldTypeNode] delegatedAmount > [optionTypeNode] (prefix: [numberTypeNode] (u32)) > [numberTypeNode] (u64)
 *     [instructionNode] mintToken
 *         [instructionAccountNode] token
 *         [instructionAccountNode] mint
 *         [instructionAccountNode] mintAuthority
 *         [instructionArgumentNode] amount
 *             [numberTypeNode] (u64)
 *     [errorNode] invalidProgramId (0)
 *     [errorNode] invalidTokenOwner (1)
 * [programNode] christmasProgram
 *     [accountNode] gift > [structTypeNode]
 *         [structFieldTypeNode] owner > [publicKeyTypeNode]
 *         [structFieldTypeNode] opened > [booleanTypeNode] > [numberTypeNode] (u64)
 *         [structFieldTypeNode] amount > [numberTypeNode] (u64)
 *         [structFieldTypeNode] wrappingPaper > [definedTypeLinkNode] wrappingPaper
 *     [instructionNode] openGift
 *         [instructionAccountNode] gift
 *         [instructionAccountNode] owner
 *     [definedTypeNode] wrappingPaper > [enumTypeNode]
 *         [enumEmptyVariantTypeNode] blue
 *         [enumEmptyVariantTypeNode] red
 *         [enumStructVariantTypeNode] gold > [structTypeNode]
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
macro('[programNode]christmasProgram.[definedTypeNode]wrappingPaper.[enumStructVariantTypeNode]gold.owner', [
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
    wrappingPaperEnumGold.struct,
    wrappingPaperGoldOwnerField,
    wrappingPaperGoldOwnerField.type,
]);
macro('wrappingPaper.[structFieldTypeNode]', [wrappingPaperGoldOwnerField]);
macro('wrappingPaper.blue', [wrappingPaperBlueVariant]);
macro('amount.*', [tokenAccountAmountField.type, mintTokenAmountArgument.type, giftAccountAmountField.type]);
macro('[instructionNode].amount.*', [mintTokenAmountArgument.type]);
macro('[structFieldTypeNode].*', [
    tokenAccountOwnerField.type,
    tokenAccountMintField.type,
    tokenAccountAmountField.type,
    tokenAccountDelegatedAmountField.type,
    tokenDelegatedAmountOption.prefix,
    tokenDelegatedAmountOption.item,
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
    path => isNodePath(path, 'numberTypeNode') && getLastNodeFromPath(path).format === 'u32',
    [tokenDelegatedAmountOption.prefix],
);
