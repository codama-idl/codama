/**
 * This code was AUTOGENERATED using the codama library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun codama to update it.
 *
 * @see https://github.com/codama-idl/codama
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  transformEncoder,
  type AccountMeta,
  type Address,
  type FixedSizeCodec,
  type FixedSizeDecoder,
  type FixedSizeEncoder,
  type Instruction,
  type InstructionWithAccounts,
  type InstructionWithData,
  type ReadonlyUint8Array,
} from '@solana/kit';
import { DUMMY_PROGRAM_ADDRESS } from '../programs';

export type Instruction5Instruction<
  TProgram extends string = typeof DUMMY_PROGRAM_ADDRESS,
  TRemainingAccounts extends readonly AccountMeta<string>[] = [],
> = Instruction<TProgram> &
  InstructionWithData<ReadonlyUint8Array> &
  InstructionWithAccounts<TRemainingAccounts>;

export type Instruction5InstructionData = { myArgument: bigint };

export type Instruction5InstructionDataArgs = { myArgument?: number | bigint };

export function getInstruction5InstructionDataEncoder(): FixedSizeEncoder<Instruction5InstructionDataArgs> {
  return transformEncoder(
    getStructEncoder([['myArgument', getU64Encoder()]]),
    (value) => ({ ...value, myArgument: value.myArgument ?? 42 })
  );
}

export function getInstruction5InstructionDataDecoder(): FixedSizeDecoder<Instruction5InstructionData> {
  return getStructDecoder([['myArgument', getU64Decoder()]]);
}

export function getInstruction5InstructionDataCodec(): FixedSizeCodec<
  Instruction5InstructionDataArgs,
  Instruction5InstructionData
> {
  return combineCodec(
    getInstruction5InstructionDataEncoder(),
    getInstruction5InstructionDataDecoder()
  );
}

export type Instruction5Input = {
  myArgument?: Instruction5InstructionDataArgs['myArgument'];
};

export function getInstruction5Instruction<
  TProgramAddress extends Address = typeof DUMMY_PROGRAM_ADDRESS,
>(
  input: Instruction5Input,
  config?: { programAddress?: TProgramAddress }
): Instruction5Instruction<TProgramAddress> {
  // Program address.
  const programAddress = config?.programAddress ?? DUMMY_PROGRAM_ADDRESS;

  // Original args.
  const args = { ...input };

  const instruction = {
    programAddress,
    data: getInstruction5InstructionDataEncoder().encode(
      args as Instruction5InstructionDataArgs
    ),
  } as Instruction5Instruction<TProgramAddress>;

  return instruction;
}

export type ParsedInstruction5Instruction<
  TProgram extends string = typeof DUMMY_PROGRAM_ADDRESS,
> = {
  programAddress: Address<TProgram>;
  data: Instruction5InstructionData;
};

export function parseInstruction5Instruction<TProgram extends string>(
  instruction: Instruction<TProgram> & InstructionWithData<ReadonlyUint8Array>
): ParsedInstruction5Instruction<TProgram> {
  return {
    programAddress: instruction.programAddress,
    data: getInstruction5InstructionDataDecoder().decode(instruction.data),
  };
}
