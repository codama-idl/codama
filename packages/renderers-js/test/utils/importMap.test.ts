import { pipe } from '@codama/visitors-core';
import { describe, expect, test } from 'vitest';

import {
    addToImportMap,
    createImportMap,
    importMapToString,
    mergeImportMaps,
    parseImportInput,
    removeFromImportMap,
} from '../../src/utils';

describe('createImportMap', () => {
    test('it creates an empty import map', () => {
        expect(createImportMap()).toStrictEqual(new Map());
    });
});

describe('parseImportInput', () => {
    test('it parses simple identifiers', () => {
        expect(parseImportInput('myFunction')).toStrictEqual({
            importedIdentifier: 'myFunction',
            isType: false,
            usedIdentifier: 'myFunction',
        });
    });

    test('it parses type-only identifiers', () => {
        expect(parseImportInput('type MyType')).toStrictEqual({
            importedIdentifier: 'MyType',
            isType: true,
            usedIdentifier: 'MyType',
        });
    });

    test('it parses aliased identifiers', () => {
        expect(parseImportInput('myFunction as myAliasedFunction')).toStrictEqual({
            importedIdentifier: 'myFunction',
            isType: false,
            usedIdentifier: 'myAliasedFunction',
        });
    });

    test('it parses type-only aliased identifiers', () => {
        expect(parseImportInput('type MyType as MyAliasedType')).toStrictEqual({
            importedIdentifier: 'MyType',
            isType: true,
            usedIdentifier: 'MyAliasedType',
        });
    });

    test('it parses unrecognised patterns as-is', () => {
        expect(parseImportInput('!some weird #input')).toStrictEqual({
            importedIdentifier: '!some weird #input',
            isType: false,
            usedIdentifier: '!some weird #input',
        });
    });
});

describe('mergeImportMaps', () => {
    test('it returns an empty map when merging empty maps', () => {
        expect(mergeImportMaps([])).toStrictEqual(new Map());
    });

    test('it returns the first map as-is when merging a single map', () => {
        const map = createImportMap();
        expect(mergeImportMaps([map])).toBe(map);
    });

    test('it add all modules from the merged maps', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        const map2 = addToImportMap(createImportMap(), 'module-b', ['import2']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                ['module-a', new Map([['import1', parseImportInput('import1')]])],
                ['module-b', new Map([['import2', parseImportInput('import2')]])],
            ]),
        );
    });

    test('it merges imports from the same module', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import2']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['import1', parseImportInput('import1')],
                        ['import2', parseImportInput('import2')],
                    ]),
                ],
            ]),
        );
    });

    test('it keeps the same import from the same module only once', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('import1')]])]]),
        );
    });

    test('it keeps multiple instances of the same import when one is aliased', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['import1', parseImportInput('import1')],
                        ['alias1', parseImportInput('import1 as alias1')],
                    ]),
                ],
            ]),
        );
    });

    test('it keeps multiple instances of the same import when both are aliased to different names', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias2']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['alias1', parseImportInput('import1 as alias1')],
                        ['alias2', parseImportInput('import1 as alias2')],
                    ]),
                ],
            ]),
        );
    });

    test('it keeps the same import from the same module when aliased to the same name', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['alias1', parseImportInput('import1 as alias1')]])]]),
        );
    });

    test('it keeps the same type-only import from the same module only once', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['type import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['type import1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('type import1')]])]]),
        );
    });

    test('it keeps the same type-only import with the same aliased name from the same module only once', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['type import1 as alias1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['type import1 as alias1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['alias1', parseImportInput('type import1 as alias1')]])]]),
        );
    });

    test('it only keep the non-type variant instead of the type-only variant when both have the same name', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['type import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('import1')]])]]),
        );
    });

    test('it only keep the non-type variant instead of the type-only variant when both are aliased to the same name', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['type import1 as alias1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([['module-a', new Map([['alias1', parseImportInput('import1 as alias1')]])]]),
        );
    });

    test('it keeps both the non-type and type-only imports when the former is aliased', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['type import1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['alias1', parseImportInput('import1 as alias1')],
                        ['import1', parseImportInput('type import1')],
                    ]),
                ],
            ]),
        );
    });

    test('it keeps both the non-type and type-only imports when the latter is aliased', () => {
        const map1 = addToImportMap(createImportMap(), 'module-a', ['import1']);
        const map2 = addToImportMap(createImportMap(), 'module-a', ['type import1 as alias1']);
        expect(mergeImportMaps([map1, map2])).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['import1', parseImportInput('import1')],
                        ['alias1', parseImportInput('type import1 as alias1')],
                    ]),
                ],
            ]),
        );
    });
});

describe('addToImportMap', () => {
    test('it adds imports to an empty import map', () => {
        expect(
            addToImportMap(createImportMap(), 'module-a', ['import1', 'type import2', 'import3 as alias3']),
        ).toStrictEqual(
            new Map([
                [
                    'module-a',
                    new Map([
                        ['import1', parseImportInput('import1')],
                        ['import2', parseImportInput('type import2')],
                        ['alias3', parseImportInput('import3 as alias3')],
                    ]),
                ],
            ]),
        );
    });

    test('it adds imports to an existing import map', () => {
        expect(
            pipe(
                createImportMap(),
                m => addToImportMap(m, 'module-a', ['import1']),
                m => addToImportMap(m, 'module-b', ['import2']),
            ),
        ).toStrictEqual(
            new Map([
                ['module-a', new Map([['import1', parseImportInput('import1')]])],
                ['module-b', new Map([['import2', parseImportInput('import2')]])],
            ]),
        );
    });
});

describe('removeFromImportMap', () => {
    test('it removes type-only imports from an existing import map', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1', 'type import2']);
        expect(removeFromImportMap(importMap, 'module-a', ['import1'])).toStrictEqual(
            new Map([['module-a', new Map([['import2', parseImportInput('type import2')]])]]),
        );
    });

    test('it removes type-only imports from an existing import map', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1', 'type import2']);
        expect(removeFromImportMap(importMap, 'module-a', ['import2'])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('import1')]])]]),
        );
    });

    test('it removes aliased imports from an existing import map using the aliased name', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1', 'import2 as alias2']);
        expect(removeFromImportMap(importMap, 'module-a', ['alias2'])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('import1')]])]]),
        );
    });

    test('it removes multiple imports from the same module', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', [
            'import1',
            'import2 as alias2',
            'type import3',
        ]);
        expect(removeFromImportMap(importMap, 'module-a', ['alias2', 'import3'])).toStrictEqual(
            new Map([['module-a', new Map([['import1', parseImportInput('import1')]])]]),
        );
    });

    test('it removes the module map when it is empty', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1', 'import2']);
        expect(removeFromImportMap(importMap, 'module-a', ['import1', 'import2'])).toStrictEqual(new Map());
    });
});

describe('importMapToString', () => {
    test('it converts an import map to a valid import statement', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1', 'import2', 'import3']);
        expect(importMapToString(importMap)).toBe("import { import1, import2, import3 } from 'module-a';");
    });

    test('it supports type-only import statements', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['type import1']);
        expect(importMapToString(importMap)).toBe("import { type import1 } from 'module-a';");
    });

    test('it supports aliased import statements', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import1 as alias1']);
        expect(importMapToString(importMap)).toBe("import { import1 as alias1 } from 'module-a';");
    });

    test('it supports aliased type-only import statements', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['type import1 as alias1']);
        expect(importMapToString(importMap)).toBe("import { type import1 as alias1 } from 'module-a';");
    });

    test('it orders import items alphabetically', () => {
        const importMap = addToImportMap(createImportMap(), 'module-a', ['import3', 'import1', 'import2']);
        expect(importMapToString(importMap)).toBe("import { import1, import2, import3 } from 'module-a';");
    });

    test('it orders import statements alphabetically', () => {
        const importMap = pipe(
            createImportMap(),
            m => addToImportMap(m, 'module-b', ['import2']),
            m => addToImportMap(m, 'module-a', ['import1']),
        );
        expect(importMapToString(importMap)).toBe(
            "import { import1 } from 'module-a';\nimport { import2 } from 'module-b';",
        );
    });

    test('it places absolute imports before relative imports', () => {
        const importMap = pipe(
            createImportMap(),
            m => addToImportMap(m, './relative-module', ['import1']),
            m => addToImportMap(m, 'absolute-module', ['import2']),
        );
        expect(importMapToString(importMap)).toBe(
            "import { import2 } from 'absolute-module';\nimport { import1 } from './relative-module';",
        );
    });

    test('it replaces internal modules with their actual paths', () => {
        const importMap = addToImportMap(createImportMap(), 'generatedAccounts', ['myAccount']);
        expect(importMapToString(importMap)).toBe("import { myAccount } from '../accounts';");
    });

    test('it can override the paths of internal modules', () => {
        const importMap = addToImportMap(createImportMap(), 'generatedAccounts', ['myAccount']);
        expect(importMapToString(importMap, { generatedAccounts: '.' })).toBe("import { myAccount } from '.';");
    });

    test('it replaces placeholder kit packages with their @solana/kit', () => {
        const importMap = addToImportMap(createImportMap(), 'solanaAddresses', ['type Address']);
        expect(importMapToString(importMap)).toBe("import { type Address } from '@solana/kit';");
    });

    test('it can use granular packages when replacing placeholder kit packages', () => {
        const importMap = addToImportMap(createImportMap(), 'solanaAddresses', ['type Address']);
        expect(importMapToString(importMap, {}, true)).toBe("import { type Address } from '@solana/addresses';");
    });

    test('it can override the module of placeholder kit packages', () => {
        const importMap = addToImportMap(createImportMap(), 'solanaAddresses', ['type Address']);
        expect(importMapToString(importMap, { solanaAddresses: '@acme/solana-addresses' })).toBe(
            "import { type Address } from '@acme/solana-addresses';",
        );
    });
});
