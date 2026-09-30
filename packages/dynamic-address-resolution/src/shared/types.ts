import type { AddressInput } from './address';

/** The addresses provided for the accounts of an instruction, keyed by account identifier. */
export type AccountsInput = Partial<Record<string, AddressInput | null | undefined>>;

/**
 * The data provided for an instruction, as accepted by the codec of its `data`
 * (see `getNodeValueCodec` in `@codama/dynamic-codecs`), e.g. `{ amount: 42n }`.
 */
export type DataInput = unknown;
