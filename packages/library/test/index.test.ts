import { expect, test } from 'vitest';

import {
    CODAMA_VERSION,
    createFromJson,
    createFromRoot,
    getAllInstructions,
    identityVisitor,
    programNode,
    rootNode,
    rootNodeVisitor,
    voidVisitor,
} from '../src';

test('it exports node helpers', () => {
    expect(typeof rootNode).toBe('function');
});

test('it exports visitors', () => {
    expect(typeof identityVisitor).toBe('function');
});

test('it accepts visitors', () => {
    const codama = createFromRoot(rootNode(programNode({ name: 'myProgram', publicKey: '1111' })));
    const visitor = voidVisitor({ keys: ['rootNode'] });
    const result = codama.accept(visitor) satisfies void;
    expect(typeof result).toBe('undefined');
});

test('it updates the root node returned by visitors', () => {
    const codama = createFromRoot(rootNode(programNode({ name: 'myProgram', publicKey: '1111' })));
    const visitor = rootNodeVisitor(node => rootNode(programNode({ ...node.program, name: 'myTransformedProgram' })));
    codama.update(visitor) satisfies void;
    expect(codama.getRoot()).toEqual(rootNode(programNode({ name: 'myTransformedProgram', publicKey: '1111' })));
});

test('it reads an IDL that omits every array attribute without throwing (skip-when-empty)', () => {
    // A minimal IDL that omits every (formerly-required) array attribute. An
    // absent array is semantically identical to an empty one, so readers must
    // tolerate it (see the "Array attributes are omitted when empty" convention
    // in the `@codama/spec` README).
    const json = JSON.stringify({
        kind: 'rootNode',
        program: {
            kind: 'programNode',
            name: 'myProgram',
            publicKey: '1111',
            version: '1.0.0',
        },
        standard: 'codama',
        version: CODAMA_VERSION,
    });

    const codama = createFromJson(json);

    // A downstream accessor normalises the absent array to `[]` rather than throwing.
    expect(getAllInstructions(codama.getRoot())).toEqual([]);

    // Running the identity visitor over the partial IDL does not throw and
    // re-serialises without re-introducing empty arrays (key order aside).
    codama.update(identityVisitor());
    const reserialised = JSON.parse(codama.getJson()) as { program: Record<string, unknown> };
    expect(reserialised).toEqual(JSON.parse(json) as unknown);
    expect('accounts' in reserialised.program).toBe(false);
    expect('instructions' in reserialised.program).toBe(false);
});
