import { programNode, rootNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { expect, test } from 'vitest';

import { writeIdlVisitor } from '../src';

// The non-Node fail-loud behaviour is covered by the `@codama/fragments`
// filesystem tests, which own the underlying `writeFile` guard.
test.runIf(__NODEJS__)('it writes the visited root node as JSON to the given path', async () => {
    const { mkdtempSync, readFileSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');

    // Given a root node and a path inside a directory that does not exist yet.
    const node = rootNode(programNode({ name: 'myProgram', publicKey: '1111' }));
    const directory = mkdtempSync(join(tmpdir(), 'writeIdlVisitor-'));
    const path = join(directory, 'nested', 'idl.json');

    // When we visit the root node using the writeIdlVisitor.
    visit(node, writeIdlVisitor(path));

    // Then the file contains the pretty-printed root node.
    expect(readFileSync(path, 'utf-8')).toBe(JSON.stringify(node, null, 2));
    rmSync(directory, { recursive: true });
});
