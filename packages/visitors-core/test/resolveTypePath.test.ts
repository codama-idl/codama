import { CODAMA_ERROR__CANNOT_RESOLVE_PATH, CODAMA_ERROR__LINKED_NODE_NOT_FOUND, CodamaError } from '@codama/errors';
import {
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

import { getRecordLinkablesVisitor, LinkableDictionary, parsePath, resolveTypePath, visit } from '../src';

/** Assert the callback throws a Codama error with exactly the context of the expected one. */
function expectCodamaError(callback: () => unknown, expected: CodamaError): void {
    expect(callback).toThrow(expect.objectContaining({ context: expected.context }));
}

function getLinkables(root: ReturnType<typeof rootNode>): LinkableDictionary {
    const linkables = new LinkableDictionary();
    visit(root, getRecordLinkablesVisitor(linkables));
    return linkables;
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
        expect(resolveTypePath(source, pathString('config'), getLinkables(root))).toStrictEqual([...source, config]);
        expect(resolveTypePath(source, pathString('config.amount'), getLinkables(root))).toStrictEqual([
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
            getLinkables(root),
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
                nodePath: [data],
                path: pathString('fee'),
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
                nodePath: [data, amount, amount.type],
                path: pathString('amount[0]'),
                segment: '[0]',
            }),
        );
        expectCodamaError(
            () => resolveTypePath([tuple], pathString('first'), linkables),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                nodePath: [tuple],
                path: pathString('first'),
                segment: 'first',
            }),
        );
        expectCodamaError(
            () => resolveTypePath([tuple], pathString('[1]'), linkables),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                nodePath: [tuple],
                path: pathString('[1]'),
                segment: '[1]',
            }),
        );
    });

    test('it throws when resolving into an enum variant without data', () => {
        const variant = enumVariantTypeNode('empty');
        expectCodamaError(
            () => resolveTypePath([variant], pathString('amount'), new LinkableDictionary()),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                nodePath: [variant],
                path: pathString('amount'),
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
            () => resolveTypePath([root, program, data], pathString('config.fee'), getLinkables(root)),
            new CodamaError(CODAMA_ERROR__LINKED_NODE_NOT_FOUND, {
                kind: 'definedTypeLinkNode',
                linkNode: link,
                name: link.identifier,
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
            () => resolveTypePath(source, pathString('x'), getLinkables(root)),
            new CodamaError(CODAMA_ERROR__CANNOT_RESOLVE_PATH, {
                nodePath: source,
                path: pathString('x'),
                segment: 'x',
            }),
        );
    });
});
