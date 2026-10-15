import { describe, expect, it } from 'vitest';

import { addToImportMap } from '../../src/javascript/addToImportMap';
import { createImportMap } from '../../src/javascript/ImportMap';
import { importMapToString } from '../../src/javascript/importMapToString';

describe('importMapToString', () => {
    it('emits empty string for an empty map', () => {
        expect(importMapToString(createImportMap())).toBe('');
    });

    it('sorts non-relative paths first, then relative; alphabetical within each group', () => {
        let map = createImportMap();
        map = addToImportMap(map, './local', ['Local']);
        map = addToImportMap(map, '@codama/spec', ['Spec']);
        map = addToImportMap(map, '../shared', ['Shared']);
        const out = importMapToString(map);
        // Within the relative group, alphabetical: '../shared' < './local'
        // because '.' (46) < '/' (47) at position 1.
        expect(out).toBe(
            "import { Spec } from '@codama/spec';\n" +
                "import { Shared } from '../shared';\n" +
                "import { Local } from './local';",
        );
    });

    it('renders mixed-form imports with per-identifier type prefix', () => {
        const map = addToImportMap(createImportMap(), './foo', ['type Foo as Bar', 'Baz']);
        expect(importMapToString(map)).toBe("import { type Foo as Bar, Baz } from './foo';");
    });

    it('sorts identifiers ignoring their `type` prefix', () => {
        const map = addToImportMap(createImportMap(), './foo', [
            'visit',
            'type Node',
            'noneValueNode',
            'tupleTypeNode',
        ]);
        expect(importMapToString(map)).toBe("import { type Node, noneValueNode, tupleTypeNode, visit } from './foo';");
    });

    it('sorts identifiers by the name they are used under', () => {
        const map = addToImportMap(createImportMap(), './foo', ['type Visitor', 'visit as baseVisit']);
        expect(importMapToString(map)).toBe("import { visit as baseVisit, type Visitor } from './foo';");
    });

    it('sorts identifiers ignoring case', () => {
        const map = addToImportMap(createImportMap(), './foo', ['getTextNodeContent', 'DisplaySkip', 'isNode']);
        expect(importMapToString(map)).toBe("import { DisplaySkip, getTextNodeContent, isNode } from './foo';");
    });

    it('sorts identifiers by code unit, as the `sort-imports` lint rule does', () => {
        const map = addToImportMap(createImportMap(), './foo', ['getI8Codec', 'getI16Codec', 'A_B', 'AB']);
        expect(importMapToString(map)).toBe("import { A_B, AB, getI16Codec, getI8Codec } from './foo';");
    });

    it('promotes to block-level `import type` when all imports are type-only', () => {
        const map = addToImportMap(createImportMap(), './foo', ['type Foo', 'type Bar']);
        expect(importMapToString(map)).toBe("import type { Bar, Foo } from './foo';");
    });

    it('preserves aliasing under a block-level `import type`', () => {
        const map = addToImportMap(createImportMap(), './foo', ['type Foo as Bar']);
        expect(importMapToString(map)).toBe("import type { Foo as Bar } from './foo';");
    });

    it('alphabetizes identifiers across multiple modules', () => {
        let map = createImportMap();
        map = addToImportMap(map, './foo', ['Zebra', 'Apple']);
        map = addToImportMap(map, './bar', ['Mango', 'Banana']);
        const out = importMapToString(map);
        expect(out).toBe("import { Banana, Mango } from './bar';\nimport { Apple, Zebra } from './foo';");
    });

    it('resolves symbolic module names through the dependency map', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['Address']);
        map = addToImportMap(map, 'generatedAccounts', ['MyAccount']);
        const out = importMapToString(map, {
            generatedAccounts: '../accounts',
            solanaAddresses: '@solana/kit',
        });
        expect(out).toBe("import { Address } from '@solana/kit';\nimport { MyAccount } from '../accounts';");
    });

    it('merges identifiers when two source modules resolve to the same target', () => {
        let map = createImportMap();
        map = addToImportMap(map, 'solanaAddresses', ['Address']);
        map = addToImportMap(map, 'solanaCodecsCore', ['Codec']);
        const out = importMapToString(map, {
            solanaAddresses: '@solana/kit',
            solanaCodecsCore: '@solana/kit',
        });
        expect(out).toBe("import { Address, Codec } from '@solana/kit';");
    });
});
