/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  containsBytes,
  getU32Encoder,
  type Address,
  type ReadonlyUint8Array,
} from '@solana/web3.js';
import { type ParsedCreateAccountInstruction } from '../instructions';

export const SYSTEM_PROGRAM_ADDRESS =
  '11111111111111111111111111111111' as Address<'11111111111111111111111111111111'>;

export enum SystemInstruction {
  CreateAccount,
}

export function identifySystemInstruction(
  instruction: { data: ReadonlyUint8Array } | ReadonlyUint8Array
): SystemInstruction {
  const data = 'data' in instruction ? instruction.data : instruction;
  if (containsBytes(data, getU32Encoder().encode(0), 0)) {
    return SystemInstruction.CreateAccount;
  }
  throw new Error(
    'The provided instruction could not be identified as a system instruction.'
  );
}

export type ParsedSystemInstruction<
  TProgram extends string = '11111111111111111111111111111111',
> = {
  instructionType: SystemInstruction.CreateAccount;
} & ParsedCreateAccountInstruction<TProgram>;
