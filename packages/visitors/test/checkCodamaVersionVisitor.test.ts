import { CODAMA_ERROR__VERSION_MISMATCH, CodamaError } from '@codama/errors';
import { CODAMA_VERSION, CodamaVersion, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { checkCodamaVersionVisitor } from '../src';

test('it accepts IDLs sharing the spec major and returns them unchanged', () => {
    // Given IDLs whose versions share the spec major.
    const program = programNode({ name: 'myProgram', publicKey: '1111' });
    const latest = rootNode(program);
    const oldest = { ...rootNode(program), version: '1.0.0' as CodamaVersion };

    // When we visit them with the check visitor, then they are returned unchanged.
    expect(visit(latest, checkCodamaVersionVisitor())).toBe(latest);
    expect(visit(oldest, checkCodamaVersionVisitor())).toBe(oldest);
});

test('it rejects IDLs from another spec major', () => {
    // Given IDLs whose versions belong to other spec majors.
    const program = programNode({ name: 'myProgram', publicKey: '1111' });
    const newer = { ...rootNode(program), version: '99.0.0' as CodamaVersion };
    const older = { ...rootNode(program), version: '0.21.3' as CodamaVersion };

    // When we visit them with the check visitor, then we expect version mismatch errors.
    expect(() => visit(newer, checkCodamaVersionVisitor())).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '99.0.0' }),
    );
    expect(() => visit(older, checkCodamaVersionVisitor())).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, { codamaVersion: CODAMA_VERSION, rootVersion: '0.21.3' }),
    );
});

test('it rejects IDLs with unparsable versions', () => {
    // Given an IDL whose version cannot be parsed.
    const program = programNode({ name: 'myProgram', publicKey: '1111' });
    const root = { ...rootNode(program), version: 'not-a-version' as CodamaVersion };

    // When we visit it with the check visitor, then we expect a version mismatch error.
    expect(() => visit(root, checkCodamaVersionVisitor())).toThrow(
        new CodamaError(CODAMA_ERROR__VERSION_MISMATCH, {
            codamaVersion: CODAMA_VERSION,
            rootVersion: 'not-a-version',
        }),
    );
});
