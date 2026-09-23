import {
    identifierString,
    injectedValueNode,
    instructionNode,
    integerValueNode,
    isNode,
    providedNode,
    structTypeNode,
} from '@codama/nodes';
import { expect, test } from 'vitest';

import { interceptVisitor, pipe, ProvidedScope, recordProvidedScopeVisitor, visit, voidVisitor } from '../src';

test('it opens the frame of an instruction for the duration of its visit', () => {
    // Given an instruction providing a key.
    const node = instructionNode({
        identifier: 'myInstruction',
        provides: [providedNode('decimals', integerValueNode('6'))],
    });

    // And a visitor recording the resolved key when visiting the instruction.
    const scope = new ProvidedScope();
    const resolvedDuringVisit: unknown[] = [];
    const visitor = pipe(
        voidVisitor(),
        v =>
            interceptVisitor(v, (visited, next) => {
                if (isNode(visited, 'instructionNode')) {
                    resolvedDuringVisit.push(
                        scope.resolve(injectedValueNode({ key: 'decimals' }), { kinds: ['integerValueNode'] }),
                    );
                }
                return next(visited);
            }),
        v => recordProvidedScopeVisitor(v, scope),
    );

    // When we visit it.
    visit(node, visitor);

    // Then the key was provided during the visit and the frame is closed afterwards.
    expect(resolvedDuringVisit).toEqual([integerValueNode('6')]);
    expect(scope.get(identifierString('decimals'))).toBeUndefined();
});

test('it lets a sub-instruction shadow its parent', () => {
    // Given a parent and a sub-instruction providing the same key.
    const node = instructionNode({
        identifier: 'parent',
        provides: [providedNode('decimals', integerValueNode('6'))],
        subInstructions: [
            instructionNode({
                identifier: 'child',
                provides: [providedNode('decimals', integerValueNode('9'))],
            }),
        ],
    });

    // And a visitor recording the resolved key for each instruction.
    const scope = new ProvidedScope();
    const resolved: Record<string, unknown> = {};
    const visitor = pipe(
        voidVisitor(),
        v =>
            interceptVisitor(v, (visited, next) => {
                if (isNode(visited, 'instructionNode')) {
                    const result = next(visited);
                    resolved[visited.identifier] = scope.resolve(injectedValueNode({ key: 'decimals' }), {
                        kinds: ['integerValueNode'],
                    });
                    return result;
                }
                return next(visited);
            }),
        v => recordProvidedScopeVisitor(v, scope),
    );

    // When we visit the tree.
    visit(node, visitor);

    // Then each instruction sees its own provider.
    expect(resolved).toEqual({ child: integerValueNode('9'), parent: integerValueNode('6') });
});

test('it only opens frames for instructions that provide values', () => {
    // Given a scope counting the frames it opens.
    class CountingScope extends ProvidedScope {
        pushes = 0;
        override push(...args: Parameters<ProvidedScope['push']>): void {
            this.pushes++;
            super.push(...args);
        }
    }
    const scope = new CountingScope();
    const visitor = recordProvidedScopeVisitor(voidVisitor(), scope);

    // When we visit a non-instruction node and an instruction without `provides`.
    visit(structTypeNode([]), visitor);
    visit(instructionNode({ data: structTypeNode([]), identifier: 'myInstruction' }), visitor);

    // Then no frame was opened.
    expect(scope.pushes).toBe(0);
});
