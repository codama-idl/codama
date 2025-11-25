import { assert, describe, expect, expectTypeOf, test } from 'vitest';

import {
    addToRenderMap,
    BaseFragment,
    createRenderMap,
    mapRenderMapContent,
    mapRenderMapContentAsync,
    mergeRenderMaps,
    removeFromRenderMap,
    RenderMap,
} from '../src';

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
                createRenderMap({ pathA: { content: 'ContentA' }, pathB: { content: 'ContentB' } }),
                content => `Mapped: ${content}`,
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', { content: 'Mapped: ContentA' }],
                ['pathB', { content: 'Mapped: ContentB' }],
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

    test('it freezes the returned render map', async () => {
        assert.isFrozen(await mapRenderMapContentAsync(createRenderMap(), c => Promise.resolve(c)));
    });
});
