import { CODAMA_VERSION, CodamaVersion, programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import defaultExport, { upgradeToLatestVisitor } from '../src';

describe('upgradeToLatestVisitor', () => {
    test('it upgrades the visited document to the latest major', () => {
        const program = programNode({ name: 'myProgram', publicKey: '1111' });
        const root = { ...rootNode(program), version: '1.0.0' as CodamaVersion };
        const upgraded = visit(root, upgradeToLatestVisitor());
        expect(upgraded).toEqual({ ...rootNode(program), version: CODAMA_VERSION });
    });

    test('it is the package default export', () => {
        expect(defaultExport).toBe(upgradeToLatestVisitor);
    });
});
