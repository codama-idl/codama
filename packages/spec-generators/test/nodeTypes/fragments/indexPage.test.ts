import { describe, expect, it } from 'vitest';

import { getIndexPageFragment } from '../../../src/nodeTypes/fragments/indexPage';

describe('getIndexPageFragment', () => {
    it('renders a single `export *` line', () => {
        // No trailing newline on the fragment itself; the EOL convention
        // is owned by `getPageFragment` when the index becomes a file.
        expect(getIndexPageFragment(['AccountNode']).content).toBe("export * from './AccountNode';");
    });

    it('sorts the names alphabetically', () => {
        const result = getIndexPageFragment(['zNode', 'aNode', 'mNode']);
        expect(result.content).toBe(
            ["export * from './aNode';", "export * from './mNode';", "export * from './zNode';"].join('\n'),
        );
    });

    it('produces a fragment with no symbolic imports (the export-all references resolve at file level)', () => {
        const result = getIndexPageFragment(['AccountNode']);
        expect(result.imports.size).toBe(0);
    });

    it('renders a fragment with no `export *` lines when given no names', () => {
        const result = getIndexPageFragment([]);
        expect(result.content).not.toContain('export *');
    });
});
