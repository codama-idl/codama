import { defineUnion, union } from '@codama/spec/api';
import { describe, expect, it } from 'vitest';

import { getUnionFragment } from '../../../src/nodeTypes/fragments/union';

describe('getUnionFragment', () => {
    it('renders a union of node references with sorted members', () => {
        const u = defineUnion('TypeNode', { members: ['innerTypeNode'] });
        const result = getUnionFragment(u);
        expect(result.content).toContain('export type TypeNode =\n| InnerTypeNode;');
        expect([...result.imports.keys()]).toEqual(['node:innerTypeNode']);
    });

    it('preserves nested union references and emits symbolic-keyed imports', () => {
        const outer = defineUnion('Outer', { members: [union('Inner'), 'aNode'] });
        const result = getUnionFragment(outer);
        // Members render in PascalCase order: ANode, Inner.
        expect(result.content).toMatch(/export type Outer =\n\| ANode\n\| Inner;$/);
        expect([...result.imports.keys()].sort()).toEqual(['node:aNode', 'union:Inner']);
    });

    it('emits the union-level docs as a single-line JSDoc when the docs array has one entry', () => {
        const u = defineUnion('U', { docs: ['My union.'], members: ['aNode'] });
        const result = getUnionFragment(u);
        expect(result.content.startsWith('/** My union. */\n')).toBe(true);
    });

    it('emits a multi-line JSDoc when the docs array has multiple paragraphs', () => {
        const u = defineUnion('U', { docs: ['First paragraph.', 'Second paragraph.'], members: ['aNode'] });
        const result = getUnionFragment(u);
        expect(result.content.startsWith('/**\n * First paragraph.\n * Second paragraph.\n */\n')).toBe(true);
    });
});
