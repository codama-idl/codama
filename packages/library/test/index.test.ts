import { expect, test } from 'vitest';

import {
    CODAMA_ERROR__VERSION_MISMATCH,
    CODAMA_VERSION,
    CodamaError,
    createFromJson,
    createFromRoot,
    getAllInstructions,
    identityVisitor,
    programNode,
    rootNode,
    rootNodeVisitor,
    validateCodamaVersion,
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

test('it accepts document versions sharing the spec major, regardless of minor and patch', () => {
    expect(() => validateCodamaVersion(CODAMA_VERSION)).not.toThrow();
    expect(() => validateCodamaVersion('1.0.0')).not.toThrow();
    expect(() => validateCodamaVersion('1.42.7')).not.toThrow();
    expect(() => validateCodamaVersion('1.6.0-rc.6')).not.toThrow();
});

test('it rejects document versions from another spec major', () => {
    expect(() => validateCodamaVersion('2.0.0')).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '2.0.0' }),
    );
    expect(() => validateCodamaVersion('0.21.3')).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '0.21.3' }),
    );
});

test('it rejects unparsable document versions', () => {
    expect(() => validateCodamaVersion('')).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '' }),
    );
    expect(() => validateCodamaVersion('not-a-version')).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, {
            codamaVersion: CODAMA_VERSION,
            rootVersion: 'not-a-version',
        }),
    );
});

test('it validates the document version when creating a Codama instance', () => {
    const program = programNode({ name: 'myProgram', publicKey: '1111' });
    expect(() => createFromRoot(rootNode(program))).not.toThrow();
    expect(() => createFromRoot({ ...rootNode(program), version: '99.0.0' as typeof CODAMA_VERSION })).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '99.0.0' }),
    );
});
