import type { Address } from '@solana/addresses';
import {
    definedTypeLinkNode,
    definedTypeNode,
    enumEmptyVariantTypeNode,
    enumTypeNode,
    getLastNodeFromPath,
    instructionAccountNode,
    instructionArgumentNode,
    instructionNode,
    type NodePath,
    numberTypeNode,
    numberValueNode,
    providedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { buildDisplayContext } from '../../src/display/build-display-context';
import { makeParsedInstruction, makeRoot } from '../test-utils';

const MINT = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY' as Address;

describe('buildDisplayContext', () => {
    test('it maps the decoded data, accounts, and instruction onto the context', async () => {
        // Given a parsed instruction with one account and one decoded argument.
        const instruction = instructionNode({
            accounts: [instructionAccountNode({ isSigner: false, isWritable: false, name: 'mint' })],
            arguments: [instructionArgumentNode({ name: 'amount', type: numberTypeNode('u64') })],
            name: 'transfer',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction, { amount: 42n }, new Map([['mint', MINT]]));

        // When we build the display context.
        const context = await buildDisplayContext(root, parsed);

        // Then the data, account addresses, and instruction path are threaded through.
        expect(context.data).toEqual({ amount: 42n });
        expect(context.accountAddresses.get('mint')).toBe(MINT);
        expect(context.instructionPath).toBe(parsed.path);
    });

    test('it indexes the instruction provides by name', async () => {
        // Given an instruction exposing a provided value.
        const instruction = instructionNode({
            accounts: [],
            arguments: [],
            name: 'transfer',
            provides: [providedNode('decimals', numberValueNode(6))],
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction);

        // When we build the display context.
        const context = await buildDisplayContext(root, parsed);

        // Then the provided value is keyed by its name.
        expect(context.provides.get('decimals')).toEqual(providedNode('decimals', numberValueNode(6)));
    });

    test('it has an empty provides map when the instruction exposes nothing', async () => {
        // Given an instruction with no provides.
        const instruction = instructionNode({ accounts: [], arguments: [], name: 'transfer' });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction);

        // When we build the display context.
        const context = await buildDisplayContext(root, parsed);

        // Then the provides map is empty.
        expect(context.provides.size).toBe(0);
    });

    test('it resolves a defined-type link against the root', async () => {
        // Given a root whose program defines an enum referenced by the instruction.
        const orderType = definedTypeNode({
            name: 'orderType',
            type: enumTypeNode([enumEmptyVariantTypeNode('buy'), enumEmptyVariantTypeNode('sell')]),
        });
        const instruction = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'order', type: definedTypeLinkNode('orderType') })],
            name: 'placeOrder',
        });
        const root = makeRoot([instruction], 'testProgram', [orderType]);
        const parsed = makeParsedInstruction(root, instruction);

        // When we resolve a link path rooted at the program.
        const context = await buildDisplayContext(root, parsed);
        const linkPath = [root, root.program, definedTypeLinkNode('orderType')] as NodePath<
            ReturnType<typeof definedTypeLinkNode>
        >;
        const resolvedPath = context.resolveDefinedType(linkPath);

        // Then the path to the underlying defined type is returned.
        expect(resolvedPath && getLastNodeFromPath(resolvedPath)).toBe(orderType);
    });

    test('it returns undefined when a defined-type link cannot be resolved', async () => {
        // Given a root that does not define the referenced type.
        const instruction = instructionNode({
            accounts: [],
            arguments: [instructionArgumentNode({ name: 'order', type: definedTypeLinkNode('orderType') })],
            name: 'placeOrder',
        });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction);

        // When we resolve an unknown link path.
        const context = await buildDisplayContext(root, parsed);
        const linkPath = [root, root.program, definedTypeLinkNode('missing')] as NodePath<
            ReturnType<typeof definedTypeLinkNode>
        >;
        const resolvedPath = context.resolveDefinedType(linkPath);

        // Then we get undefined.
        expect(resolvedPath).toBeUndefined();
    });

    test('it threads the fetchAccountData option through', async () => {
        // Given a fetchAccountData hook.
        const instruction = instructionNode({ accounts: [], arguments: [], name: 'transfer' });
        const root = makeRoot([instruction]);
        const parsed = makeParsedInstruction(root, instruction);
        const fetchAccountData = () => Promise.resolve(null);

        // When we build the display context with that option.
        const context = await buildDisplayContext(root, parsed, { fetchAccountData });

        // Then the hook is carried on the context.
        expect(context.fetchAccountData).toBe(fetchAccountData);
    });
});
