import { definedTypeNode, enumEmptyVariantTypeNode, enumTypeNode } from '@codama/nodes';
import { visit } from '@codama/visitors-core';
import { describe, test } from 'vitest';

import { getRenderMapVisitor } from '../../src';
import { renderMapContains } from '../_setup';

describe('enumLabels', () => {
    test('it generates enum labels for scalar enums', async () => {
        // Given a defined type node with a scalar enum.
        const node = definedTypeNode({
            name: 'direction',
            type: enumTypeNode([
                enumEmptyVariantTypeNode('up'),
                enumEmptyVariantTypeNode('right'),
                enumEmptyVariantTypeNode('down'),
                enumEmptyVariantTypeNode('left'),
            ]),
        });

        // When we render it.
        const renderMap = visit(node, getRenderMapVisitor());

        // Then we expect the following type and labels to be exported.
        await renderMapContains(renderMap, 'types/direction.ts', [
            'export enum Direction {',
            'Up,',
            'Right,',
            'Down,',
            'Left',
            '}',
            'export type DirectionArgs = Direction;',
            'export const DIRECTION_LABELS: Record<Direction, string> = {',
            "[Direction.Up]: 'Up',",
            "[Direction.Right]: 'Right',",
            "[Direction.Down]: 'Down',",
            "[Direction.Left]: 'Left'",
            '};',
        ]);
    });
});
