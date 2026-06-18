import {
    argumentValueNode,
    booleanTypeNode,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    instructionRemainingAccountsNode,
    optionTypeNode,
    resolverValueNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { getResolutionRefs } from '../../src/codegen/get-resolution-refs';

describe('getResolutionRefs', () => {
    test('should return null argsRef when there are no non-omitted arguments and no argument-valued remaining accounts', () => {
        const ix = instructionNode({ accounts: [], arguments: [], name: 'noop' });
        const refs = getResolutionRefs(ix);
        expect(refs.argsRef).toBeNull();
        expect(refs.hasArgs).toBe(false);
        expect(refs.accountsRef).toBe('NoopAccounts');
    });

    test('should return ${Name}Args when an argument exists', () => {
        const ix = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'flag', type: booleanTypeNode() })],
            name: 'setFlag',
        });
        const refs = getResolutionRefs(ix);
        expect(refs.argsRef).toBe('SetFlagArgs');
        expect(refs.hasArgs).toBe(true);
    });

    test('should ignore arguments with defaultValueStrategy "omitted"', () => {
        const ix = instructionNode({
            accounts: [],
            arguments: [
                instructionArgumentNode({
                    defaultValueStrategy: 'omitted',
                    name: 'discriminator',
                    type: booleanTypeNode(),
                }),
            ],
            name: 'omitted',
        });
        const refs = getResolutionRefs(ix);
        expect(refs.argsRef).toBeNull();
    });

    test('should treat argumentValueNode remaining accounts as args', () => {
        const ix = instructionNode({
            accounts: [],
            arguments: [],
            name: 'extra',
            remainingAccounts: [instructionRemainingAccountsNode(argumentValueNode('extras'))],
        });
        const refs = getResolutionRefs(ix);
        expect(refs.argsRef).toBe('ExtraArgs');
        expect(refs.hasArgs).toBe(true);
    });

    test('should report hasRequiredArgs true when at least one non-optional argument exists', () => {
        const ix = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'flag', type: booleanTypeNode() })],
            name: 'setFlag',
        });
        const refs = getResolutionRefs(ix);
        expect(refs.hasRequiredArgs).toBe(true);
        expect(refs.hasRequiredRemainingAccounts).toBe(false);
    });

    test('should report hasRequiredArgs false when every argument is optional-kinded', () => {
        const ix = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'maybeFlag', type: optionTypeNode(booleanTypeNode()) })],
            name: 'setMaybeFlag',
        });
        const refs = getResolutionRefs(ix);
        expect(refs.hasArgs).toBe(true);
        expect(refs.hasRequiredArgs).toBe(false);
    });

    test('should report hasRequiredRemainingAccounts based on the remaining-account argument isOptional flag', () => {
        const required = instructionNode({
            accounts: [],
            arguments: [],
            name: 'requiredExtras',
            remainingAccounts: [instructionRemainingAccountsNode(argumentValueNode('extras'), { isOptional: false })],
        });
        const optional = instructionNode({
            accounts: [],
            arguments: [],
            name: 'optionalExtras',
            remainingAccounts: [instructionRemainingAccountsNode(argumentValueNode('extras'), { isOptional: true })],
        });
        expect(getResolutionRefs(required).hasRequiredRemainingAccounts).toBe(true);
        expect(getResolutionRefs(optional).hasRequiredRemainingAccounts).toBe(false);
    });

    test('should emit resolversRef when an account default is a resolverValueNode', () => {
        const ix = instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: resolverValueNode('resolveOwner'),
                    isSigner: false,
                    isWritable: false,
                    name: 'owner',
                }),
            ],
            arguments: [],
            name: 'doStuff',
        });
        const refs = getResolutionRefs(ix);
        expect(refs.resolversRef).toBe('DoStuffResolvers');
        expect(refs.hasResolvers).toBe(true);
    });
});
