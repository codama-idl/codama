import {
    accountNode,
    type AccountNode,
    type Node,
    pdaNode,
    type PdaNode,
    programNode,
    rootNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, expectTypeOf, test } from 'vitest';

import { getLastNodeFromPath, type NodePath } from '../src';

const program = programNode({ identifier: 'myProgram', publicKey: '1111' });
const root = rootNode(program);

test('it accepts paths ending at a node of a union as paths to that union', () => {
    // Given a node only known to be one of two kinds.
    const entry = accountNode({ data: structTypeNode([]), identifier: 'config' }) as AccountNode | PdaNode;

    // When we append it to a path.
    const path: NodePath<AccountNode | PdaNode> = [root, program, entry];

    // Then the path ends at that union, rather than being one path per member.
    expectTypeOf<NodePath<AccountNode | PdaNode>>().toEqualTypeOf<
        readonly [...(readonly Node[]), AccountNode | PdaNode]
    >();
    expectTypeOf(getLastNodeFromPath(path)).toEqualTypeOf<AccountNode | PdaNode>();
    expect(getLastNodeFromPath(path)).toBe(entry);
});

test('it keeps paths without a node type as any list of nodes', () => {
    expectTypeOf<NodePath>().toEqualTypeOf<readonly Node[]>();
    const empty: NodePath = [];
    expect(empty).toStrictEqual([]);
});

test('it keeps paths to a single node kind ending at that kind', () => {
    const pda = pdaNode({ identifier: 'vault' });
    const path: NodePath<PdaNode> = [root, program, pda];
    expectTypeOf(getLastNodeFromPath(path)).toEqualTypeOf<PdaNode>();
    expect(getLastNodeFromPath(path)).toBe(pda);
});

test('it keeps optional node types as either kind of path', () => {
    expectTypeOf<NodePath<PdaNode | undefined>>().toEqualTypeOf<
        readonly Node[] | readonly [...(readonly Node[]), PdaNode]
    >();
});
