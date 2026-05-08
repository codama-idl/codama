import { describe, expect, it } from 'vitest';

import type { BaseFragment } from '../../src/core/BaseFragment';
import { createFragmentTemplate } from '../../src/core/createFragmentTemplate';

type TestFragment = BaseFragment & Readonly<{ tags: ReadonlySet<string> }>;

const isTestFragment = (value: unknown): value is TestFragment =>
    typeof value === 'object' && value !== null && 'content' in value && 'tags' in value;

const mergeTestFragments = (fragments: TestFragment[], mergeContent: (contents: string[]) => string): TestFragment => {
    const tags = new Set<string>();
    for (const f of fragments) for (const t of f.tags) tags.add(t);
    return Object.freeze({ content: mergeContent(fragments.map(f => f.content)), tags });
};

const f = (content: string, ...tags: string[]): TestFragment => Object.freeze({ content, tags: new Set(tags) });

const tag = (template: TemplateStringsArray, ...items: unknown[]): TestFragment =>
    createFragmentTemplate(template, items, isTestFragment, mergeTestFragments);

describe('createFragmentTemplate', () => {
    it('returns a fragment whose content matches a string-only template', () => {
        const out = tag`hello world`;
        expect(out.content).toBe('hello world');
        expect(out.tags.size).toBe(0);
    });

    it('inlines fragment interpolations and merges their non-content fields', () => {
        const a = f('A', 'red');
        const b = f('B', 'blue');
        const out = tag`${a} & ${b}`;
        expect(out.content).toBe('A & B');
        expect([...out.tags].sort()).toEqual(['blue', 'red']);
    });

    it('coerces non-fragment values to strings', () => {
        expect(tag`v=${42}`.content).toBe('v=42');
        expect(tag`v=${true}`.content).toBe('v=true');
    });

    it('elides undefined interpolations as the empty string', () => {
        expect(tag`hello ${undefined}world`.content).toBe('hello world');
    });

    it('only forwards fragments to the merger, not other values', () => {
        // The merger only sees actual fragments; primitives are coerced
        // inline, not passed through. This means non-fragment values can't
        // contribute non-content fields — important for fields like
        // imports/features that would otherwise be silently dropped.
        const a = f('A', 'red');
        const out = tag`${'plain string'}|${a}|${42}`;
        expect(out.content).toBe('plain string|A|42');
        expect([...out.tags]).toEqual(['red']);
    });
});
