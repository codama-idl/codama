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

// Given the following tree.
const tree = rootNode(
    programNode({
        accounts: [
            accountNode({
                data: structTypeNode([
                    structFieldTypeNode({
                        name: 'owner',
                        type: publicKeyTypeNode(),
                    }),
                    structFieldTypeNode({
                        name: 'mint',
                        type: publicKeyTypeNode(),
                    }),
                    structFieldTypeNode({
                        name: 'amount',
                        type: numberTypeNode('u64'),
                    }),
                    structFieldTypeNode({
                        name: 'delegatedAmount',
                        type: optionTypeNode(numberTypeNode('u64'), {
                            prefix: numberTypeNode('u32'),
                        }),
                    }),
                ]),
                name: 'token',
            }),
        ],
        definedTypes: [],
        errors: [
            errorNode({
                code: 0,
                message: 'Invalid program ID',
                name: 'invalidProgramId',
            }),
            errorNode({
                code: 1,
                message: 'Invalid token owner',
                name: 'invalidTokenOwner',
            }),
        ],
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        isSigner: false,
                        isWritable: true,
                        name: 'token',
                    }),
                    instructionAccountNode({
                        isSigner: false,
                        isWritable: true,
                        name: 'mint',
                    }),
                    instructionAccountNode({
                        isSigner: true,
                        isWritable: false,
                        name: 'mintAuthority',
                    }),
                ],
                arguments: [
                    instructionArgumentNode({
                        name: 'amount',
                        type: numberTypeNode('u64'),
                    }),
                ],
                name: 'mintToken',
            }),
        ],
        name: 'splToken',
        publicKey: '1111',
        version: '1.0.0',
    }),
    [
        programNode({
            accounts: [
                accountNode({
                    data: structTypeNode([
                        structFieldTypeNode({
                            name: 'owner',
                            type: publicKeyTypeNode(),
                        }),
                        structFieldTypeNode({
                            name: 'opened',
                            type: booleanTypeNode(numberTypeNode('u64')),
                        }),
                        structFieldTypeNode({
                            name: 'amount',
                            type: numberTypeNode('u64'),
                        }),
                        structFieldTypeNode({
                            name: 'wrappingPaper',
                            type: definedTypeLinkNode('wrappingPaper'),
                        }),
                    ]),
                    name: 'gift',
                }),
            ],
            definedTypes: [
                definedTypeNode({
                    name: 'wrappingPaper',
                    type: enumTypeNode([
                        enumEmptyVariantTypeNode('blue'),
                        enumEmptyVariantTypeNode('red'),
                        enumStructVariantTypeNode(
                            'gold',
                            structTypeNode([
                                structFieldTypeNode({
                                    name: 'owner',
                                    type: publicKeyTypeNode(),
                                }),
                            ]),
                        ),
                    ]),
                }),
            ],
            errors: [
                errorNode({
                    code: 0,
                    message: 'Invalid program ID',
                    name: 'invalidProgramId',
                }),
            ],
            instructions: [
                instructionNode({
                    accounts: [
                        instructionAccountNode({
                            isSigner: false,
                            isWritable: true,
                            name: 'gift',
                        }),
                        instructionAccountNode({
                            isSigner: true,
                            isWritable: false,
                            name: 'owner',
                        }),
                    ],
                    arguments: [],
                    name: 'openGift',
                }),
            ],
            name: 'christmasProgram',
            publicKey: '2222',
            version: '1.0.0',
        }),
    ],
);

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

const splTokenProgram = tree.program;
const christmasProgram = tree.additionalPrograms[0];
const tokenAccount = splTokenProgram.accounts[0];
const tokenDelegatedAmountOption = tokenAccount.data.fields[3].type;
const mintTokenInstruction = splTokenProgram.instructions[0];
const giftAccount = christmasProgram.accounts[0];
const openGiftInstruction = christmasProgram.instructions[0];
const wrappingPaper = christmasProgram.definedTypes[0];
const wrappingPaperEnum = wrappingPaper.type;
const wrappingPaperEnumGold = wrappingPaperEnum.variants[2];

// Select programs.
macro('[programNode]', [splTokenProgram, christmasProgram]);
macro('[programNode]splToken', [splTokenProgram]);
macro('christmasProgram', [christmasProgram]);

// Select and filter owner nodes.
macro('owner', [
    tokenAccount.data.fields[0],
    giftAccount.data.fields[0],
    wrappingPaperEnumGold.struct.fields[0],
    openGiftInstruction.accounts[1],
]);
macro('[structFieldTypeNode]owner', [
    tokenAccount.data.fields[0],
    giftAccount.data.fields[0],
    wrappingPaperEnumGold.struct.fields[0],
]);
macro('splToken.owner', [tokenAccount.data.fields[0]]);
macro('[instructionNode].owner', [openGiftInstruction.accounts[1]]);
macro('[accountNode].owner', [tokenAccount.data.fields[0], giftAccount.data.fields[0]]);
macro('[accountNode]token.owner', [tokenAccount.data.fields[0]]);
macro('christmasProgram.[accountNode].owner', [giftAccount.data.fields[0]]);
macro('[programNode]christmasProgram.[definedTypeNode]wrappingPaper.[enumStructVariantTypeNode]gold.owner', [
    wrappingPaperEnumGold.struct.fields[0],
]);
macro('christmasProgram.wrappingPaper.gold.owner', [wrappingPaperEnumGold.struct.fields[0]]);

// Select all descendants of a node.
macro('wrappingPaper.*', [
    giftAccount.data.fields[3].type,
    wrappingPaperEnum,
    wrappingPaperEnum.variants[0],
    wrappingPaperEnum.variants[1],
    wrappingPaperEnum.variants[2],
    wrappingPaperEnumGold.struct,
    wrappingPaperEnumGold.struct.fields[0],
    wrappingPaperEnumGold.struct.fields[0].type,
]);
macro('wrappingPaper.[structFieldTypeNode]', [wrappingPaperEnumGold.struct.fields[0]]);
macro('wrappingPaper.blue', [wrappingPaperEnum.variants[0]]);
macro('amount.*', [
    tokenAccount.data.fields[2].type,
    mintTokenInstruction.arguments[0].type,
    giftAccount.data.fields[2].type,
]);
macro('[instructionNode].amount.*', [mintTokenInstruction.arguments[0].type]);
macro('[structFieldTypeNode].*', [
    tokenAccount.data.fields[0].type,
    tokenAccount.data.fields[1].type,
    tokenAccount.data.fields[2].type,
    tokenAccount.data.fields[3].type,
    tokenDelegatedAmountOption.prefix,
    tokenDelegatedAmountOption.item,
    giftAccount.data.fields[0].type,
    giftAccount.data.fields[1].type,
    giftAccount.data.fields[1].type.size,
    giftAccount.data.fields[2].type,
    giftAccount.data.fields[3].type,
    wrappingPaperEnumGold.struct.fields[0].type,
]);
macro('[structFieldTypeNode].*.*', [
    tokenDelegatedAmountOption.prefix,
    tokenDelegatedAmountOption.item,
    giftAccount.data.fields[1].type.size,
]);

// Select multiple node kinds.
macro('[accountNode]gift.[publicKeyTypeNode|booleanTypeNode]', [
    giftAccount.data.fields[0].type,
    giftAccount.data.fields[1].type,
]);

// Select using functions.
macro(
    path => isNodePath(path, 'numberTypeNode') && getLastNodeFromPath(path).format === 'u32',
    [tokenDelegatedAmountOption.prefix],
);
