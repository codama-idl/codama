import { describe, expect, it } from 'vitest';

import { buildRenderScope, type RenderOptions } from '../../src/visitorsCore/options';

const options: RenderOptions = { targetSpecMajor: 1 };

describe('buildRenderScope', () => {
    it('routes visitor:identityVisitor to its sibling file under generated/', () => {
        const scope = buildRenderScope(options);
        expect(scope.symbolicModules.get('visitor:identityVisitor')).toBe('identityVisitor');
    });

    it('routes visitor:mergeVisitor to its sibling file under generated/', () => {
        const scope = buildRenderScope(options);
        expect(scope.symbolicModules.get('visitor:mergeVisitor')).toBe('mergeVisitor');
    });

    it('routes visitor:nodeTestPaths to its sibling file under generated/', () => {
        const scope = buildRenderScope(options);
        expect(scope.symbolicModules.get('visitor:nodeTestPaths')).toBe('nodeTestPaths');
    });

    it('points helper symbols at the hand-written siblings above generated/', () => {
        const scope = buildRenderScope(options);
        expect(scope.symbolicModules.get('helper:staticVisitor')).toBe('../staticVisitor');
        expect(scope.symbolicModules.get('helper:visit')).toBe('../visitor');
        expect(scope.symbolicModules.get('helper:Visitor')).toBe('../visitor');
    });

    it('defaults the walk-order and union-alias tables when omitted from options', () => {
        const scope = buildRenderScope(options);
        // The defaulted maps carry the live v1 spec content; assert
        // a representative key from each rather than the full set.
        expect(scope.unionAliasNames.get('TypeNode')).toBe('TYPE_NODES');
        expect(scope.mergeVisitorWalkOrder.get('arrayTypeNode')).toEqual(['count', 'item']);
        expect(scope.identityVisitorWalkOrder.get('programNode')?.[0]).toBe('accounts');
    });

    it('honours caller-supplied unionAliasNames overrides', () => {
        const custom = new Map([['TypeNode', 'CUSTOM_TYPE_NODES']]);
        const scope = buildRenderScope({ ...options, unionAliasNames: custom });
        expect(scope.unionAliasNames.get('TypeNode')).toBe('CUSTOM_TYPE_NODES');
    });

    it('emits a frozen scope', () => {
        const scope = buildRenderScope(options);
        expect(Object.isFrozen(scope)).toBe(true);
        expect(Object.isFrozen(scope.symbolicModules)).toBe(true);
    });
});
