import {
    accountValueNode,
    argumentValueNode,
    constantPdaSeedNodeFromBytes,
    instructionArgumentNode,
    numberTypeNode,
    pdaSeedValueNode,
    publicKeyTypeNode,
    sizePrefixTypeNode,
    stringTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { pdaSeedNodeFromAnchorV01 } from '../../src';

test('it creates a PdaSeedNode from a const Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'const', value: [11, 57, 246, 240] }, []);

    expect(nodes.definition).toEqual(constantPdaSeedNodeFromBytes('base58', 'HeLLo'));
    expect(nodes.value).toBeUndefined();
});

test('it creates a PdaSeedNode from an account Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'account', path: 'authority' }, []);

    expect(nodes.definition).toEqual(variablePdaSeedNode('authority', publicKeyTypeNode()));
    expect(nodes.value).toEqual(pdaSeedValueNode('authority', accountValueNode('authority')));
});

test('it creates a PdaSeedNode from an arg Anchor seed', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'capacity' }, [
        instructionArgumentNode({ name: 'capacity', type: numberTypeNode('u64') }),
    ]);

    expect(nodes.definition).toEqual(variablePdaSeedNode('capacity', numberTypeNode('u64')));
    expect(nodes.value).toEqual(pdaSeedValueNode('capacity', argumentValueNode('capacity')));
});

test('it removes the string prefix from arg Anchor seeds', () => {
    const nodes = pdaSeedNodeFromAnchorV01({ kind: 'arg', path: 'identifier' }, [
        instructionArgumentNode({
            name: 'identifier',
            type: sizePrefixTypeNode(stringTypeNode('utf8'), numberTypeNode('u32')),
        }),
    ]);

    expect(nodes.definition).toEqual(variablePdaSeedNode('identifier', stringTypeNode('utf8')));
    expect(nodes.value).toEqual(pdaSeedValueNode('identifier', argumentValueNode('identifier')));
});
