import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CodamaError } from '@codama/errors';
import {
    accountLinkNode,
    accountNode,
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    instructionNode,
    integerTypeNode,
    optionTypeNode,
    pathString,
    programNode,
    publicKeyTypeNode,
    rootNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { type DecodedAccountNode, formatDecodedNode, getDecodedNodeAtPath, getNodeCodec } from '../src';
import { hex } from './_setup';

const u8 = integerTypeNode('u8');
const config = structTypeNode([
    structFieldTypeNode({ identifier: 'fees', type: arrayTypeNode(u8, fixedCountNode(2)) }),
    structFieldTypeNode({ identifier: 'pair', type: tupleTypeNode([u8, u8]) }),
]);
const data = structTypeNode([
    structFieldTypeNode({ identifier: 'amount', type: u8 }),
    structFieldTypeNode({ identifier: 'config', type: config }),
]);
// amount = 42, fees = [25, 30], pair = [1, 2]
const bytes = hex('2a191e0102');

test('it returns struct fields as addressed', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('amount'))).toBe(decoded.fields[0]);
});

test('it follows nested struct fields and array indices', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[1]'))?.value).toBe(30n);
});

test('it follows tuple indices', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.pair[0]'))?.value).toBe(1n);
});

test('it starts from the data of instructions', () => {
    const instruction = instructionNode({ data, identifier: 'configure' });
    const root = rootNode(programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' }));
    const decoded = getNodeCodec([root, root.program, instruction]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[0]'))?.value).toBe(25n);
});

test('it follows linked defined types', () => {
    const root = rootNode(
        programNode({
            definedTypes: [definedTypeNode({ identifier: 'config', type: config })],
            identifier: 'myProgram',
            publicKey: '1111',
        }),
    );
    const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: definedTypeLinkNode('config') })]);
    const decoded = getNodeCodec([root, root.program, node]).decode(hex('191e0102'));
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[1]'))?.value).toBe(30n);
});

test('it returns formatted nodes from formatted nodes', () => {
    const formatted = formatDecodedNode(getNodeCodec([data]).decode(bytes));
    expect(getDecodedNodeAtPath(formatted, pathString('config.fees[1]'))?.text).toBe('30');
});

test('it returns undefined for indices beyond the items of arrays', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(getDecodedNodeAtPath(decoded, pathString('config.fees[2]'))).toBeUndefined();
});

test('it throws for unknown struct fields', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.owner'))).toThrow(
        new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
            nodePath: [data, data.fields![1], config],
            path: pathString('config.owner'),
            segment: 'owner',
        }),
    );
});

test('it throws for indices beyond the items of tuples', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.pair[2]'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: '[2]' }) }),
    );
});

test('it throws for segments applied to leaves', () => {
    const decoded = getNodeCodec([data]).decode(bytes);
    expect(() => getDecodedNodeAtPath(decoded, pathString('amount.value'))).toThrow(
        new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
            nodePath: [data, data.fields![0], u8],
            path: pathString('amount.value'),
            segment: 'value',
        }),
    );
});

test('it does not follow options', () => {
    const node = structTypeNode([structFieldTypeNode({ identifier: 'config', type: optionTypeNode(config) })]);
    const decoded = getNodeCodec([node]).decode(hex('01191e0102'));
    expect(() => getDecodedNodeAtPath(decoded, pathString('config.fees'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: 'fees' }) }),
    );
});

test('it does not follow enums', () => {
    const node = enumTypeNode([enumVariantTypeNode('set', { data: config })]);
    const decoded = getNodeCodec([node]).decode(hex('00191e0102'));
    expect(() => getDecodedNodeAtPath(decoded, pathString('fees'))).toThrow(
        expect.objectContaining({ context: expect.objectContaining({ segment: 'fees' }) }),
    );
});

test('it follows the data of enum variants', () => {
    const node = enumTypeNode([enumVariantTypeNode('set', { data: config })]);
    const decoded = getNodeCodec([node]).decode(hex('00191e0102'));
    expect(getDecodedNodeAtPath(decoded.variant, pathString('fees[0]'))?.value).toBe(25n);
});

describe('account links', () => {
    // A transfer whose `mint` links to a mint account holding its `decimals`.
    const mint = accountNode({
        data: structTypeNode([structFieldTypeNode({ identifier: 'decimals', type: u8 })]),
        identifier: 'mint',
    });
    const transfer = structTypeNode([
        structFieldTypeNode({ identifier: 'mint', type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }) }),
        structFieldTypeNode({ identifier: 'owner', type: publicKeyTypeNode() }),
    ]);
    const root = rootNode(programNode({ accounts: [mint], identifier: 'myProgram', publicKey: '1111' }));
    const decodedTransfer = getNodeCodec([root, root.program, transfer]).decode(new Uint8Array(64).fill(1));
    const decodedMint = getNodeCodec([root, root.program, mint]).decode(hex('06')); // decimals = 6

    test('it follows account links using the resolved account', () => {
        const resolveAccountLink = () => decodedMint;
        const decimals = getDecodedNodeAtPath(decodedTransfer, pathString('mint.data.decimals'), {
            resolveAccountLink,
        });
        expect(decimals).toBe(getDecodedNodeAtPath(decodedMint, pathString('decimals')));
    });

    test('it gives the decoded public key to the account link resolver', () => {
        const publicKeys: unknown[] = [];
        getDecodedNodeAtPath(decodedTransfer, pathString('mint.data.decimals'), {
            resolveAccountLink: publicKey => {
                publicKeys.push(publicKey);
                return decodedMint;
            },
        });
        expect(publicKeys).toEqual([decodedTransfer.fields[0].type]);
    });

    test('it returns undefined when the linked account is not resolved', () => {
        const resolveAccountLink = () => undefined;
        expect(
            getDecodedNodeAtPath(decodedTransfer, pathString('mint.data.decimals'), { resolveAccountLink }),
        ).toBeUndefined();
    });

    test('it throws when crossing an account link without a resolver', () => {
        const mintField = transfer.fields![0];
        expect(() => getDecodedNodeAtPath(decodedTransfer, pathString('mint.data.decimals'))).toThrow(
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                nodePath: [root, root.program, transfer, mintField, mintField.type],
                path: pathString('mint.data.decimals'),
                segment: 'data',
            }),
        );
    });

    test('it does not follow public keys without account links', () => {
        const resolveAccountLink = () => decodedMint;
        expect(() =>
            getDecodedNodeAtPath(decodedTransfer, pathString('owner.data.decimals'), { resolveAccountLink }),
        ).toThrow(expect.objectContaining({ context: expect.objectContaining({ segment: 'data' }) }));
    });

    test('it does not follow account links with other segments', () => {
        // Given a field of the linked account's data used directly, or another attribute of the account.
        const resolveAccountLink = () => decodedMint;
        for (const segment of ['decimals', 'lamports']) {
            expect(() =>
                getDecodedNodeAtPath(decodedTransfer, pathString(`mint.${segment}`), { resolveAccountLink }),
            ).toThrow(expect.objectContaining({ context: expect.objectContaining({ segment }) }));
        }
    });

    test('it returns the whole data of linked accounts for a data segment', () => {
        const resolveAccountLink = () => decodedMint;
        expect(getDecodedNodeAtPath(decodedTransfer, pathString('mint.data'), { resolveAccountLink })).toBe(
            decodedMint.data,
        );
    });

    test('it returns linked public keys as addressed', () => {
        const resolveAccountLink = () => decodedMint;
        expect(getDecodedNodeAtPath(decodedTransfer, pathString('mint'), { resolveAccountLink })).toBe(
            decodedTransfer.fields[0],
        );
    });

    test('it follows account links within formatted nodes', () => {
        const formattedMint = formatDecodedNode(decodedMint);
        const decimals = getDecodedNodeAtPath(formatDecodedNode(decodedTransfer), pathString('mint.data.decimals'), {
            resolveAccountLink: () => formattedMint,
        });
        expect(decimals?.text).toBe('6');
    });

    test('it follows account links of linked accounts', () => {
        // A token whose `mint` links to the mint account.
        const token = accountNode({
            data: structTypeNode([
                structFieldTypeNode({
                    identifier: 'mint',
                    type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }),
                }),
            ]),
            identifier: 'token',
        });
        const tokenRoot = rootNode(
            programNode({ accounts: [mint, token], identifier: 'myProgram', publicKey: '1111' }),
        );
        const decodedToken = getNodeCodec([tokenRoot, tokenRoot.program, token]).decode(new Uint8Array(32));
        const accounts = new Map<string, DecodedAccountNode>([
            [decodedTransfer.fields[0].value as string, decodedToken],
            [getDecodedNodeAtPath(decodedToken, pathString('mint'))?.value as string, decodedMint],
        ]);
        const decimals = getDecodedNodeAtPath(decodedTransfer, pathString('mint.data.mint.data.decimals'), {
            resolveAccountLink: publicKey => accounts.get(publicKey.value),
        });
        expect(decimals?.value).toBe(6n);
    });
});
