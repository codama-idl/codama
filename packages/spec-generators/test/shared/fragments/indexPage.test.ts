import { describe, expect, it } from 'vitest';

import { getIndexPageFragment, groupPathsByFolder } from '../../../src/shared';

describe('getIndexPageFragment', () => {
    it('renders a single `export *` line', () => {
        // No trailing newline on the fragment itself; the EOL convention
        // is owned by the page-level renderer when the index becomes a
        // file.
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

describe('groupPathsByFolder', () => {
    it('groups top-level files under the empty-string sentinel', () => {
        const result = groupPathsByFolder(['AccountNode.ts', 'RootNode.ts']);
        expect(result.get('')).toEqual(['AccountNode', 'RootNode']);
    });

    it('groups subdirectory files under their folder name', () => {
        const result = groupPathsByFolder(['typeNodes/StructTypeNode.ts', 'typeNodes/ArrayTypeNode.ts']);
        expect(result.get('typeNodes')).toEqual(['StructTypeNode', 'ArrayTypeNode']);
    });

    it('strips the `.ts` extension from basenames', () => {
        const result = groupPathsByFolder(['AccountNode.ts']);
        expect(result.get('')).toEqual(['AccountNode']);
    });

    it('handles paths with no extension', () => {
        const result = groupPathsByFolder(['AccountNode']);
        expect(result.get('')).toEqual(['AccountNode']);
    });

    it('returns an empty map when given no paths', () => {
        const result = groupPathsByFolder([]);
        expect(result.size).toBe(0);
    });
});
