import {
    argumentValueNode,
    conditionalValueNode,
    instructionAccountNode,
    numberValueNode,
    publicKeyValueNode,
    resolverValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { SvmTestContext } from '../../../svm-test-context';
import { ixAccountNodeStub, makeVisitor } from './account-default-value-test-utils';

describe('account-default-value: visitConditionalValue', async () => {
    const ifTrueAddress = await SvmTestContext.generateAddress();
    const ifFalseAddress = await SvmTestContext.generateAddress();

    test('should resolve ifTrue branch when argument condition is truthy', async () => {
        const node = conditionalValueNode({
            condition: argumentValueNode('flag'),
            ifTrue: publicKeyValueNode(ifTrueAddress),
        });
        const visitor = makeVisitor({ argumentsInput: { flag: true } });
        const result = await visitor.visitConditionalValue(node);
        expect(result).toBe(ifTrueAddress);
    });

    test('should resolve ifFalse branch when argument condition is falsy', async () => {
        const node = conditionalValueNode({
            condition: argumentValueNode('flag'),
            ifFalse: publicKeyValueNode(ifFalseAddress),
            ifTrue: publicKeyValueNode(ifTrueAddress),
        });
        const visitor = makeVisitor({ argumentsInput: { flag: false } });
        const result = await visitor.visitConditionalValue(node);
        expect(result).toBe(ifFalseAddress);
    });

    test('should return null for optional account when no ifFalse and condition is falsy', async () => {
        const optionalAccountNode = instructionAccountNode({
            isOptional: true,
            isSigner: false,
            isWritable: false,
            name: 'optionalAccount',
        });
        const node = conditionalValueNode({
            condition: argumentValueNode('flag'),
            ifTrue: publicKeyValueNode(ifTrueAddress),
        });
        const visitor = makeVisitor({
            argumentsInput: { flag: false },
            ixAccountNode: optionalAccountNode,
        });
        const result = await visitor.visitConditionalValue(node);
        expect(result).toBeNull();
    });

    test('should throw for required account when no ifFalse and condition is falsy', async () => {
        const node = conditionalValueNode({
            condition: argumentValueNode('flag'),
            ifTrue: publicKeyValueNode(ifTrueAddress),
        });
        const visitor = makeVisitor({
            argumentsInput: { flag: false },
            ixAccountNode: {
                ...ixAccountNodeStub,
                isOptional: false,
            },
        });
        await expect(visitor.visitConditionalValue(node)).rejects.toThrow(/Conditional branch resolved to undefined/);
    });

    test('should resolve ifTrue when primitive value matches', async () => {
        const node = conditionalValueNode({
            condition: argumentValueNode('tokenStandard'),
            ifFalse: publicKeyValueNode(ifFalseAddress),
            ifTrue: publicKeyValueNode(ifTrueAddress),
            value: numberValueNode(0),
        });
        const visitor = makeVisitor({ argumentsInput: { tokenStandard: 0 } });
        const result = await visitor.visitConditionalValue(node);
        expect(result).toBe(ifTrueAddress);
    });

    test('should resolve ifFalse when value does not match', async () => {
        const node = conditionalValueNode({
            condition: argumentValueNode('tokenStandard'),
            ifFalse: publicKeyValueNode(ifFalseAddress),
            ifTrue: publicKeyValueNode(ifTrueAddress),
            value: numberValueNode(0),
        });
        const visitor = makeVisitor({ argumentsInput: { tokenStandard: 1 } });
        const result = await visitor.visitConditionalValue(node);
        expect(result).toBe(ifFalseAddress);
    });

    test('should resolve with resolver condition', async () => {
        const nodeWithTrue = conditionalValueNode({
            condition: resolverValueNode('myResolver'),
            ifFalse: publicKeyValueNode(ifFalseAddress),
            ifTrue: publicKeyValueNode(ifTrueAddress),
        });
        const visitorWithTrue = makeVisitor({ resolversInput: { myResolver: () => Promise.resolve(true) } });
        const result = await visitorWithTrue.visitConditionalValue(nodeWithTrue);
        expect(result).toBe(ifTrueAddress);

        const visitorWithFalse = makeVisitor({ resolversInput: { myResolver: () => Promise.resolve(false) } });
        const resultFalse = await visitorWithFalse.visitConditionalValue(nodeWithTrue);
        expect(resultFalse).toBe(ifFalseAddress);
    });
});
