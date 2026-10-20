import { describe, expect, test } from 'vitest';

import * as codegenEntry from '../../src/codegen';
import * as mainEntry from '../../src/index';

describe('entrypoints', () => {
    test('it does not export code generation from the main entry', () => {
        expect(mainEntry).not.toHaveProperty('generateClientTypes');
    });

    test('it exports code generation from the codegen entry', () => {
        expect(codegenEntry).toHaveProperty('generateClientTypes', expect.any(Function));
    });
});
