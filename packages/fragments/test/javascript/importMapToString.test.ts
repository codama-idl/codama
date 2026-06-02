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
        expect(importMapToString(map)).toBe("import { Baz, type Foo as Bar } from './foo';");
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
