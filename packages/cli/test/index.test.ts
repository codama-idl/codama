import { expect, test } from 'vitest';

import { createProgram } from '../src';

test('it exports a function to create a CLI program', () => {
    expect(typeof createProgram).toBe('function');
});
