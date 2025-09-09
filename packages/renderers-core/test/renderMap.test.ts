import { assert, describe, expect, test } from 'vitest';

import {
    addToRenderMap,
    BaseFragment,
    createRenderMap,
    mapRenderMapContent,
    mapRenderMapContentAsync,
    mergeRenderMaps,
    removeFromRenderMap,
} from '../src';

describe('createRenderMap', () => {
    test('it creates an empty render map', () => {
        expect(createRenderMap()).toStrictEqual(new Map());
    });

    test('it creates a render map from a path and a string', () => {
        expect(createRenderMap('some/path', 'Some content')).toStrictEqual(new Map([['some/path', 'Some content']]));
    });

    test('it creates a render map from a path and a fragment', () => {
        const fragment: BaseFragment = { content: 'Some fragment content' };
        expect(createRenderMap('some/fragment/path', fragment)).toStrictEqual(
            new Map([['some/fragment/path', 'Some fragment content']]),
        );
    });

    test('it creates a render map from a record of entries', () => {
        expect(
            createRenderMap({
                'some/fragment/path': { content: 'Some fragment content' },
                'some/path': 'Some content',
            }),
        ).toStrictEqual(
            new Map([
                ['some/fragment/path', 'Some fragment content'],
                ['some/path', 'Some content'],
            ]),
        );
    });

    test('it removes undefined entries from the provided record', () => {
        expect(
            createRenderMap({
                'some/path': 'Some content',
                'some/path/undefined': undefined,
            }),
        ).toStrictEqual(new Map([['some/path', 'Some content']]));
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(createRenderMap());
        assert.isFrozen(createRenderMap('some/path', 'Some content'));
        assert.isFrozen(createRenderMap({ 'some/path': 'Some content' }));
    });
});

describe('addToRenderMap', () => {
    test('it adds new entries to render map', () => {
        const renderMap = createRenderMap('some/path', 'Some content');
        expect(addToRenderMap(renderMap, 'some/new/path', 'Some new content')).toStrictEqual(
            new Map([
                ['some/path', 'Some content'],
                ['some/new/path', 'Some new content'],
            ]),
        );
    });

    test('it overwrites existing entries in the render map', () => {
        const renderMap = createRenderMap('some/path', 'Some content');
        expect(addToRenderMap(renderMap, 'some/path', 'Some new content')).toStrictEqual(
            new Map([['some/path', 'Some new content']]),
        );
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(addToRenderMap(createRenderMap(), 'some/new/path', 'Some new content'));
    });
});

describe('removeFromRenderMap', () => {
    test('it removes existing entries from a render map', () => {
        const renderMap = createRenderMap({ pathA: 'Content A', pathB: 'Content B' });
        expect(removeFromRenderMap(renderMap, 'pathA')).toStrictEqual(new Map([['pathB', 'Content B']]));
    });

    test('it can remove the last entry of a render map', () => {
        const renderMap = createRenderMap('pathA', 'Content A');
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
        const renderMap = createRenderMap('pathA', 'ContentA');
        expect(mergeRenderMaps([renderMap])).toBe(renderMap);
    });

    test('it merges the entries of two render maps', () => {
        expect(
            mergeRenderMaps([createRenderMap('pathA', 'ContentA'), createRenderMap('pathB', 'ContentB')]),
        ).toStrictEqual(
            new Map([
                ['pathA', 'ContentA'],
                ['pathB', 'ContentB'],
            ]),
        );
    });

    test('later entries overwrite earlier entries', () => {
        expect(
            mergeRenderMaps([createRenderMap('samePath', 'Old content'), createRenderMap('samePath', 'New content')]),
        ).toStrictEqual(new Map([['samePath', 'New content']]));
    });

    test('it merges the entries of two render maps', () => {
        expect(
            mergeRenderMaps([createRenderMap('pathA', 'ContentA'), createRenderMap('pathB', 'ContentB')]),
        ).toStrictEqual(
            new Map([
                ['pathA', 'ContentA'],
                ['pathB', 'ContentB'],
            ]),
        );
    });

    test('it freezes the returned render map', () => {
        assert.isFrozen(mergeRenderMaps([]));
        assert.isFrozen(mergeRenderMaps([createRenderMap('pathA', 'ContentA')]));
        assert.isFrozen(mergeRenderMaps([createRenderMap('pathA', 'ContentA'), createRenderMap('pathB', 'ContentB')]));
    });
});

describe('mapRenderMapContent', () => {
    test('it maps the content of all entries inside a render map', () => {
        expect(
            mapRenderMapContent(
                createRenderMap({
                    pathA: 'ContentA',
                    pathB: 'ContentB',
                }),
                content => `Mapped: ${content}`,
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', 'Mapped: ContentA'],
                ['pathB', 'Mapped: ContentB'],
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
                    pathA: 'ContentA',
                    pathB: 'ContentB',
                }),
                content => Promise.resolve(`Mapped: ${content}`),
            ),
        ).toStrictEqual(
            new Map([
                ['pathA', 'Mapped: ContentA'],
                ['pathB', 'Mapped: ContentB'],
            ]),
        );
    });

    test('it freezes the returned render map', async () => {
        assert.isFrozen(await mapRenderMapContentAsync(createRenderMap(), c => Promise.resolve(c)));
    });
});
