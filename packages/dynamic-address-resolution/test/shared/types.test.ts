import type { Address } from '@solana/addresses';
import { describe, expectTypeOf, test } from 'vitest';

import type { AddressInput } from '../../src/shared/address';
import type { AccountsInput, DataInput } from '../../src/shared/types';

describe('AccountsInput', () => {
    test('it accepts a partial record of AddressInput or null', () => {
        expectTypeOf<AccountsInput>().toExtend<Partial<Record<string, AddressInput | null>>>();
        expectTypeOf<{ mint: null }>().toExtend<AccountsInput>();
        expectTypeOf<{ mint: Address }>().toExtend<AccountsInput>();
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        expectTypeOf<{}>().toExtend<AccountsInput>();
    });
});

describe('DataInput', () => {
    test('it accepts any codec input', () => {
        expectTypeOf<{ amount: bigint; name: string }>().toExtend<DataInput>();
        expectTypeOf<[number, string]>().toExtend<DataInput>();
    });
});
