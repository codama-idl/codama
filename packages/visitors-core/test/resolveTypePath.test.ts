import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
    accountLinkNode,
    accountNode,
    arrayTypeNode,
    definedTypeLinkNode,
    definedTypeNode,
    enumVariantTypeNode,
    fixedCountNode,
    instructionNode,
    integerTypeNode,
    pathString,
    prefixedCountNode,
    programLinkNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    setTypeNode,
    stringTypeNode,
    structFieldTypeNode,
    structTypeNode,
    tupleTypeNode,
} from '@codama/nodes';
import { describe, expect, test } from 'vitest';

import { getLinkablesFromNode, LinkableDictionary, parsePath, resolveTypePath } from '../src';

/** Assert the callback throws a Codama error with exactly the context of the expected one. */
function expectCodamaError(callback: () => unknown, expected: CodamaError): void {
    expect(callback).toThrow(expect.objectContaining({ context: expected.context }));
}

describe('parsePath', () => {
    test('it parses field and index segments', () => {
        expect(parsePath('config.fees[0].amount')).toStrictEqual([
            { identifier: 'config', kind: 'field' },
            { identifier: 'fees', kind: 'field' },
            { index: 0, kind: 'index' },
            { identifier: 'amount', kind: 'field' },
        ]);
        expect(parsePath('[12]')).toStrictEqual([{ index: 12, kind: 'index' }]);
    });
});

describe('resolveTypePath', () => {
    test('it resolves struct fields', () => {
        // Given instruction data with a nested struct.
        const amount = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
        const inner = structTypeNode([amount]);
        const config = structFieldTypeNode({ identifier: 'config', type: inner });
        const data = structTypeNode([config]);
        const instruction = instructionNode({ data, identifier: 'transfer' });
        const program = programNode({ identifier: 'myProgram', instructions: [instruction], publicKey: '1111' });
        const root = rootNode(program);

        // Then each field is returned with its full path.
        const source = [root, program, instruction, data] as const;
        expect(resolveTypePath(source, pathString('config'), getLinkablesFromNode(root))).toStrictEqual([
            ...source,
            config,
        ]);
        expect(resolveTypePath(source, pathString('config.amount'), getLinkablesFromNode(root))).toStrictEqual([
            ...source,
            config,
            inner,
            amount,
        ]);
    });

    test('it resolves tuple, array and set items', () => {
        const publicKey = publicKeyTypeNode();
        const tuple = tupleTypeNode([integerTypeNode('u8'), publicKey]);
        const array = arrayTypeNode(integerTypeNode('u16'), prefixedCountNode(integerTypeNode('u32')));
        const set = setTypeNode(stringTypeNode('utf8'), fixedCountNode(2));
        const linkables = new LinkableDictionary();

        expect(resolveTypePath([tuple], pathString('[1]'), linkables)).toStrictEqual([tuple, publicKey]);
        expect(resolveTypePath([array], pathString('[5]'), linkables)).toStrictEqual([array, array.item]);
        expect(resolveTypePath([set], pathString('[0]'), linkables)).toStrictEqual([set, set.item]);
    });

    test('it follows links to other programs, using the path of their definitions', () => {
        // Given a field of programA linking to a struct of programB, whose own field links within programB.
        const fees = structFieldTypeNode({
            identifier: 'fees',
            type: arrayTypeNode(definedTypeLinkNode('fee'), fixedCountNode(2)),
        });
        const configStruct = structTypeNode([fees]);
        const configType = definedTypeNode({ identifier: 'config', type: configStruct });
        const feeType = definedTypeNode({ identifier: 'fee', type: integerTypeNode('u16') });
        const programB = programNode({
            definedTypes: [configType, feeType],
            identifier: 'programB',
            publicKey: '2222',
        });
        const config = structFieldTypeNode({
            identifier: 'config',
            type: definedTypeLinkNode('config', { program: programLinkNode('programB') }),
        });
        const data = structTypeNode([config]);
        const instruction = instructionNode({ data, identifier: 'transfer' });
        const programA = programNode({ identifier: 'programA', instructions: [instruction], publicKey: '1111' });
        const root = rootNode(programA, { additionalPrograms: [programB] });

        // When we resolve a path through both links.
        const result = resolveTypePath(
            [root, programA, instruction, data],
            pathString('config.fees[0]'),
            getLinkablesFromNode(root),
        );

        // Then the path continues from the definition of the config type.
        expect(result).toStrictEqual([root, programB, configType, configStruct, fees, fees.type, fees.type.item]);
    });

    test('it returns the last node as addressed without following it', () => {
        const link = definedTypeLinkNode('config');
        const config = structFieldTypeNode({ identifier: 'config', type: link });
        const items = structFieldTypeNode({ identifier: 'items', type: tupleTypeNode([link]) });
        const data = structTypeNode([items, config]);

        expect(resolveTypePath([data], pathString('config'), new LinkableDictionary())).toStrictEqual([data, config]);
        expect(resolveTypePath([data], pathString('items[0]'), new LinkableDictionary())).toStrictEqual([
            data,
            items,
            items.type,
            link,
        ]);
    });

    test('it resolves paths from struct fields and enum variants', () => {
        const amount = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
        const struct = structTypeNode([amount]);
        const field = structFieldTypeNode({ identifier: 'args', type: struct });
        const variant = enumVariantTypeNode('transfer', { data: struct });
        const linkables = new LinkableDictionary();

        expect(resolveTypePath([field], pathString('amount'), linkables)).toStrictEqual([field, struct, amount]);
        expect(resolveTypePath([variant], pathString('amount'), linkables)).toStrictEqual([variant, struct, amount]);
    });

    test('it throws when a field does not exist', () => {
        const data = structTypeNode([structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') })]);
        expectCodamaError(
            () => resolveTypePath([data], pathString('fee'), new LinkableDictionary()),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [data],
                pathString: pathString('fee'),
                segment: 'fee',
            }),
        );
    });

    test('it throws when a segment does not apply to the type', () => {
        const amount = structFieldTypeNode({ identifier: 'amount', type: integerTypeNode('u64') });
        const data = structTypeNode([amount]);
        const tuple = tupleTypeNode([integerTypeNode('u8')]);
        const linkables = new LinkableDictionary();

        // An index on an integer, a field on a tuple, and an out-of-bounds tuple index.
        expectCodamaError(
            () => resolveTypePath([data], pathString('amount[0]'), linkables),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [data, amount, amount.type],
                pathString: pathString('amount[0]'),
                segment: '[0]',
            }),
        );
        expectCodamaError(
            () => resolveTypePath([tuple], pathString('first'), linkables),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [tuple],
                pathString: pathString('first'),
                segment: 'first',
            }),
        );
        expectCodamaError(
            () => resolveTypePath([tuple], pathString('[1]'), linkables),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [tuple],
                pathString: pathString('[1]'),
                segment: '[1]',
            }),
        );
    });

    test('it throws when resolving into an enum variant without data', () => {
        const variant = enumVariantTypeNode('empty');
        expectCodamaError(
            () => resolveTypePath([variant], pathString('amount'), new LinkableDictionary()),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [variant],
                pathString: pathString('amount'),
                segment: 'amount',
            }),
        );
    });

    test('it throws when a link cannot be resolved', () => {
        const link = definedTypeLinkNode('missing');
        const config = structFieldTypeNode({ identifier: 'config', type: link });
        const data = structTypeNode([config]);
        const program = programNode({ identifier: 'myProgram', publicKey: '1111' });
        const root = rootNode(program);

        expectCodamaError(
            () => resolveTypePath([root, program, data], pathString('config.fee'), getLinkablesFromNode(root)),
            new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                path: [root, program, data, config, link],
            }),
        );
    });

    test('it throws on alias cycles rather than looping', () => {
        // Given two defined types aliasing each other.
        const linkToB = definedTypeLinkNode('b');
        const typeA = definedTypeNode({ identifier: 'a', type: linkToB });
        const typeB = definedTypeNode({ identifier: 'b', type: definedTypeLinkNode('a') });
        const program = programNode({ definedTypes: [typeA, typeB], identifier: 'myProgram', publicKey: '1111' });
        const root = rootNode(program);

        // Then resolving into them throws once a type is followed twice.
        const source = [root, program, typeA, linkToB] as const;
        expectCodamaError(
            () => resolveTypePath(source, pathString('x'), getLinkablesFromNode(root)),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: source,
                pathString: pathString('x'),
                segment: 'x',
            }),
        );
    });
});

describe('resolveTypePath with account links', () => {
    // A token account whose `mint` field links to the mint account.
    const decimals = structFieldTypeNode({ identifier: 'decimals', type: integerTypeNode('u8') });
    const mintData = structTypeNode([decimals]);
    const mintAccount = accountNode({ data: mintData, identifier: 'mint' });
    const mintField = structFieldTypeNode({
        identifier: 'mint',
        type: publicKeyTypeNode({ accountLink: accountLinkNode('mint') }),
    });
    const tokenData = structTypeNode([mintField]);
    const tokenAccount = accountNode({ data: tokenData, identifier: 'token' });
    const program = programNode({ accounts: [tokenAccount, mintAccount], identifier: 'myProgram', publicKey: '1111' });
    const root = rootNode(program);
    const source = [root, program, tokenAccount, tokenData] as const;

    test('it follows account links into the data of the linked account with a data segment', () => {
        const resolved = resolveTypePath(source, pathString('mint.data.decimals'), getLinkablesFromNode(root), {
            followAccountLinks: true,
        });
        expect(resolved).toStrictEqual([root, program, mintAccount, mintData, decimals]);
    });

    test('it resolves a data segment to the whole data of the linked account', () => {
        const resolved = resolveTypePath(source, pathString('mint.data'), getLinkablesFromNode(root), {
            followAccountLinks: true,
        });
        expect(resolved).toStrictEqual([root, program, mintAccount, mintData]);
    });

    test('it resolves a data segment to data that is not a struct', () => {
        // Given an account whose data is a single integer.
        const counterData = integerTypeNode('u64');
        const counter = accountNode({ data: counterData, identifier: 'counter' });
        const counterField = structFieldTypeNode({
            identifier: 'counter',
            type: publicKeyTypeNode({ accountLink: accountLinkNode('counter') }),
        });
        const holder = structTypeNode([counterField]);
        const counterProgram = programNode({ accounts: [counter], identifier: 'counters', publicKey: '6666' });
        const counterRoot = rootNode(counterProgram);

        // Then the data segment reads it.
        const resolved = resolveTypePath(
            [counterRoot, counterProgram, holder],
            pathString('counter.data'),
            getLinkablesFromNode(counterRoot),
            { followAccountLinks: true },
        );
        expect(resolved).toStrictEqual([counterRoot, counterProgram, counter, counterData]);
    });

    test('it does not follow account links with other segments', () => {
        // Given a field of the linked account's data used directly, or another attribute of the account.
        for (const segment of ['decimals', 'lamports']) {
            expectCodamaError(
                () =>
                    resolveTypePath(source, pathString(`mint.${segment}`), getLinkablesFromNode(root), {
                        followAccountLinks: true,
                    }),
                new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                    path: [...source, mintField, mintField.type],
                    pathString: pathString(`mint.${segment}`),
                    segment,
                }),
            );
        }
    });

    test('it does not follow account links by default', () => {
        expectCodamaError(
            () => resolveTypePath(source, pathString('mint.data.decimals'), getLinkablesFromNode(root)),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [...source, mintField, mintField.type],
                pathString: pathString('mint.data.decimals'),
                segment: 'data',
            }),
        );
    });

    test('it returns a linked public key as addressed without following it', () => {
        const resolved = resolveTypePath(source, pathString('mint'), getLinkablesFromNode(root), {
            followAccountLinks: true,
        });
        expect(resolved).toStrictEqual([...source, mintField]);
    });

    test('it only follows account links for field segments', () => {
        // Given a public key linking to an account whose data is a tuple.
        const pairData = tupleTypeNode([integerTypeNode('u8')]);
        const pairAccount = accountNode({ data: pairData, identifier: 'pair' });
        const pairField = structFieldTypeNode({
            identifier: 'pair',
            type: publicKeyTypeNode({ accountLink: accountLinkNode('pair') }),
        });
        const pairSource = structTypeNode([pairField]);
        const pairProgram = programNode({ accounts: [pairAccount], identifier: 'pairs', publicKey: '5555' });
        const pairRoot = rootNode(pairProgram);

        // Then an index segment does not follow the link.
        expectCodamaError(
            () =>
                resolveTypePath(
                    [pairRoot, pairProgram, pairSource],
                    pathString('pair[0]'),
                    getLinkablesFromNode(pairRoot),
                    {
                        followAccountLinks: true,
                    },
                ),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                path: [pairRoot, pairProgram, pairSource, pairField, pairField.type],
                pathString: pathString('pair[0]'),
                segment: '[0]',
            }),
        );
    });

    test('it follows account links back to the same account across segments', () => {
        // Given a linked list whose `next` field links to the account itself.
        const value = structFieldTypeNode({ identifier: 'value', type: integerTypeNode('u8') });
        const next = structFieldTypeNode({
            identifier: 'next',
            type: publicKeyTypeNode({ accountLink: accountLinkNode('node') }),
        });
        const nodeData = structTypeNode([value, next]);
        const nodeAccount = accountNode({ data: nodeData, identifier: 'node' });
        const listProgram = programNode({ accounts: [nodeAccount], identifier: 'list', publicKey: '2222' });
        const listRoot = rootNode(listProgram);

        // Then each segment can follow the link again, as paths are finite.
        const resolved = resolveTypePath(
            [listRoot, listProgram, nodeAccount, nodeData],
            pathString('next.data.next.data.value'),
            getLinkablesFromNode(listRoot),
            { followAccountLinks: true },
        );
        expect(resolved).toStrictEqual([listRoot, listProgram, nodeAccount, nodeData, value]);
    });

    test('it follows accounts whose data links back to themselves, one data segment at a time', () => {
        // Given an account whose data is a public key linking to the account itself.
        const selfData = publicKeyTypeNode({ accountLink: accountLinkNode('self') });
        const selfAccount = accountNode({ data: selfData, identifier: 'self' });
        const selfProgram = programNode({ accounts: [selfAccount], identifier: 'loop', publicKey: '3333' });
        const selfRoot = rootNode(selfProgram);

        // Then each data segment follows the link once, as paths are finite.
        const resolved = resolveTypePath(
            [selfRoot, selfProgram, selfAccount, selfData],
            pathString('data.data'),
            getLinkablesFromNode(selfRoot),
            { followAccountLinks: true },
        );
        expect(resolved).toStrictEqual([selfRoot, selfProgram, selfAccount, selfData]);
    });

    test('it throws when a linked account cannot be found', () => {
        const link = accountLinkNode('missing');
        const missingField = structFieldTypeNode({
            identifier: 'missing',
            type: publicKeyTypeNode({ accountLink: link }),
        });
        const data = structTypeNode([missingField]);
        const account = accountNode({ data, identifier: 'holder' });
        const holderProgram = programNode({ accounts: [account], identifier: 'holder', publicKey: '4444' });
        const holderRoot = rootNode(holderProgram);

        expectCodamaError(
            () =>
                resolveTypePath(
                    [holderRoot, holderProgram, account, data],
                    pathString('missing.data'),
                    getLinkablesFromNode(holderRoot),
                    {
                        followAccountLinks: true,
                    },
                ),
            new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                path: [holderRoot, holderProgram, account, data, missingField, missingField.type, link],
            }),
        );
    });
});
