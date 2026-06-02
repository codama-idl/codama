import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, CodamaError } from '@codama/errors';
import { afterEach, assert, beforeEach, describe, expect, expectTypeOf, test } from 'vitest';

import type { BaseFragment } from '../../src/core/BaseFragment';
import {
    addToRenderMap,
    createRenderMap,
    mapRenderMapContent,
    mapRenderMapContentAsync,
    mergeRenderMaps,
    removeFromRenderMap,
    type RenderMap,
    writeRenderMap,
} from '../../src/core/renderMap';

describe('createRenderMap', () => {
    test('it creates an empty render map', () => {
        expect(createRenderMap()).toStrictEqual(new Map());
        expectTypeOf(createRenderMap()).toEqualTypeOf<RenderMap<BaseFragment>>();
    });

    test('it creates an empty render map using a custom fragment type', () => {
        type CustomFragment = BaseFragment & { customProperty: number };
        expect(createRenderMap()).toStrictEqual(new Map());
        expectTypeOf(createRenderMap<CustomFragment>()).toEqualTypeOf<RenderMap<CustomFragment>>();
    });

    test('it creates a render map from a path and a fragment', () => {
        expect(createRenderMap('some/path', { content: 'Some content' })).toStrictEqual(
            new Map([['some/path', { content: 'Some content' }]]),
        );
    });

    test('it creates a render map from a record of entries', () => {
        expect(
            createRenderMap({
                'some/path/a': { content: 'Some content A' },
                'some/path/b': { content: 'Some content B' },
            }),
        ).toStrictEqual(
            new Map([
                ['some/path/a', { content: 'Some content A' }],
                ['some/path/b', { content: 'Some content B' }],
            ]),
        );
    });

    test('it removes undefined entries from the provided record', () => {
        expect(
            createRenderMap({
                'some/path': { content: 'Some content' },
                'some/path/undefined': undefined,
            }),
        ).toStrictEqual(new Map([['some/path', { content: 'Some content' }]]));
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(createRenderMap());
        assert.isFrozen(createRenderMap('some/path', { content: 'Some content' }));
        assert.isFrozen(createRenderMap({ 'some/path': { content: 'Some content' } }));
    });
});

describe('addToRenderMap', () => {
    test('it adds new entries to render map', () => {
        const renderMap = createRenderMap('some/path', { content: 'Some content' });
        expect(addToRenderMap(renderMap, 'some/new/path', { content: 'Some new content' })).toStrictEqual(
            new Map([
                ['some/path', { content: 'Some content' }],
                ['some/new/path', { content: 'Some new content' }],
            ]),
        );
    });

    test('it overwrites existing entries in the render map', () => {
        const renderMap = createRenderMap('some/path', { content: 'Some content' });
        expect(addToRenderMap(renderMap, 'some/path', { content: 'Some new content' })).toStrictEqual(
            new Map([['some/path', { content: 'Some new content' }]]),
        );
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(addToRenderMap(createRenderMap(), 'some/new/path', { content: 'Some new content' }));
    });
});

describe('removeFromRenderMap', () => {
    test('it removes existing entries from a render map', () => {
        const renderMap = createRenderMap({ pathA: { content: 'Content A' }, pathB: { content: 'Content B' } });
        expect(removeFromRenderMap(renderMap, 'pathA')).toStrictEqual(new Map([['pathB', { content: 'Content B' }]]));
    });

    test('it can remove the last entry of a render map', () => {
        const renderMap = createRenderMap('pathA', { content: 'Content A' });
        expect(removeFromRenderMap(renderMap, 'pathA')).toStrictEqual(new Map());
    });

    test('it ignores missing paths', () => {
        const renderMap = createRenderMap();
        expect(removeFromRenderMap(renderMap, 'missingPaths')).toStrictEqual(new Map());
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(removeFromRenderMap(createRenderMap(), 'some/path'));
    });
});

describe('mergeRenderMaps', () => {
    test('it returns an empty render map when no maps are provided', () => {
        expect(mergeRenderMaps([])).toStrictEqual(new Map());
    });

    test('it returns the first render map as-is when only one map is provided', () => {
        const renderMap = createRenderMap('pathA', { content: 'ContentA' });
        expect(mergeRenderMaps([renderMap])).toBe(renderMap);
    });

    test('it merges the entries of two render maps', () => {
        expect(
            mergeRenderMaps([
                createRenderMap('pathA', { content: 'ContentA' }),
                createRenderMap('pathB', { content: 'ContentB' }),
            ]),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'ContentA' }],
                ['pathB', { content: 'ContentB' }],
            ]),
        );
    });

    test('later entries overwrite earlier entries', () => {
        expect(
            mergeRenderMaps([
                createRenderMap('samePath', { content: 'Old content' }),
                createRenderMap('samePath', { content: 'New content' }),
            ]),
        ).toStrictEqual(new Map([['samePath', { content: 'New content' }]]));
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(mergeRenderMaps([]));
        assert.isFrozen(mergeRenderMaps([createRenderMap('pathA', { content: 'ContentA' })]));
        assert.isFrozen(
            mergeRenderMaps([
                createRenderMap('pathA', { content: 'ContentA' }),
                createRenderMap('pathB', { content: 'ContentB' }),
            ]),
        );
    });
});

describe('mapRenderMapContent', () => {
    test('it maps the content of all entries inside a render map', () => {
        expect(
            mapRenderMapContent(
                createRenderMap({
                    pathA: { content: 'ContentA' },
                    pathB: { content: 'ContentB' },
                }),
                content => `Mapped: ${content}`,
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'Mapped: ContentA' }],
                ['pathB', { content: 'Mapped: ContentB' }],
            ]),
        );
    });

    test('it provides the path of the content being mapped', () => {
        expect(
            mapRenderMapContent(
                createRenderMap({
                    pathA: { content: 'Content' },
                    pathB: { content: 'Content' },
                }),
                (content, path) => `${content} from ${path}`,
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'Content from pathA' }],
                ['pathB', { content: 'Content from pathB' }],
            ]),
        );
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(mapRenderMapContent(createRenderMap(), c => c));
    });
});

describe('mapRenderMapContentAsync', () => {
    test('it maps the content of all entries inside a render map', async () => {
        expect(
            await mapRenderMapContentAsync(
                createRenderMap({
                    pathA: { content: 'ContentA' },
                    pathB: { content: 'ContentB' },
                }),
                content => Promise.resolve(`Mapped: ${content}`),
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'Mapped: ContentA' }],
                ['pathB', { content: 'Mapped: ContentB' }],
            ]),
        );
    });

    test('it provides the path of the content being mapped', async () => {
        expect(
            await mapRenderMapContentAsync(
                createRenderMap({
                    pathA: { content: 'Content' },
                    pathB: { content: 'Content' },
                }),
                (content, path) => Promise.resolve(`${content} from ${path}`),
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'Content from pathA' }],
                ['pathB', { content: 'Content from pathB' }],
            ]),
        );
    });

    test('it freezes the returned render map', async () => {
        assert.isFrozen(await mapRenderMapContentAsync(createRenderMap(), c => Promise.resolve(c)));
    });
});

if (__NODEJS__) {
    describe('writeRenderMap (Node)', () => {
        let tmp: string;

        beforeEach(() => {
            tmp = mkdtempSync(path.join(tmpdir(), 'fragments-writeRenderMap-'));
        });

        afterEach(() => {
            rmSync(tmp, { force: true, recursive: true });
        });

        test('it writes every entry to a file under basePath', () => {
            writeRenderMap(
                createRenderMap({
                    'a.txt': { content: 'A' },
                    'b.txt': { content: 'B' },
                }),
                tmp,
            );
            expect(readFileSync(path.join(tmp, 'a.txt'), 'utf-8')).toBe('A');
            expect(readFileSync(path.join(tmp, 'b.txt'), 'utf-8')).toBe('B');
        });

        test('it auto-creates intermediate directories for nested paths', () => {
            writeRenderMap(createRenderMap('sub/nested/deep.txt', { content: 'deep' }), tmp);
            expect(readFileSync(path.join(tmp, 'sub/nested/deep.txt'), 'utf-8')).toBe('deep');
        });

        test('it is a no-op for an empty render map', () => {
            expect(() => writeRenderMap(createRenderMap(), tmp)).not.toThrow();
        });

        test('it overwrites an existing file at the same path', () => {
            writeRenderMap(createRenderMap('a.txt', { content: 'first' }), tmp);
            writeRenderMap(createRenderMap('a.txt', { content: 'second' }), tmp);
            expect(readFileSync(path.join(tmp, 'a.txt'), 'utf-8')).toBe('second');
        });
    });
} else {
    describe('writeRenderMap (non-Node)', () => {
        test('it throws when called with at least one entry on a non-Node platform', () => {
            const map = createRenderMap('a.txt', { content: 'A' });
            expect(() => writeRenderMap(map, '/tmp/unused')).toThrow(
                new CodamaError(CODAMA_ERROR__NODE_FILESYSTEM_FUNCTION_UNAVAILABLE, { fsFunction: 'writeFileSync' }),
            );
        });

        test('it does not throw for an empty render map (writeFile never called)', () => {
            expect(() => writeRenderMap(createRenderMap(), '/tmp/unused')).not.toThrow();
        });
    });
}
