import type { ParsedInstruction } from '@codama/dynamic-parsers';
import type { Account } from '@solana/accounts';
import type { Address } from '@solana/addresses';
import { AccountRole } from '@solana/instructions';
import { generateKeyPairSigner } from '@solana/kit';
import {
    type DefinedTypeNode,
    getLastNodeFromPath,
    type InstructionNode,
    instructionNode,
    type NodePath,
    programNode,
    type ProvidedNode,
    type RootNode,
    rootNode,
} from 'codama';

import type { DisplayContext, FetchAccountDataFn, ResolveDefinedTypeFn } from '../src/display/types';

const DEFAULT_INSTRUCTION = instructionNode({ accounts: [], arguments: [], name: 'noop' });
const DEFAULT_ROOT = makeRoot([DEFAULT_INSTRUCTION]);

export async function generateAddress(): Promise<Address> {
    const signer = await generateKeyPairSigner();
    return signer.address;
}

/** Builds a {@link DisplayContext} with empty defaults, overridable per test. */
export function displayContext(overrides: Partial<DisplayContext> = {}): DisplayContext {
    return {
        accountAddresses: new Map<string, Address>(),
        consumedMemberNames: new Set<string>(),
        data: {},
        instructionPath: instructionPathOf(DEFAULT_ROOT, DEFAULT_INSTRUCTION),
        provides: new Map<string, ProvidedNode>(),
        resolveDefinedType: () => undefined,
        ...overrides,
    };
}

/**
 * Builds a {@link DisplayContext} whose `instructionPath` points at the given instruction, wrapping
 * it in a fresh root. Overrides are applied last.
 */
export function displayContextFor(
    instruction: InstructionNode,
    overrides: Partial<DisplayContext> = {},
): DisplayContext {
    const root = makeRoot([instruction]);
    return displayContext({ instructionPath: instructionPathOf(root, instruction), ...overrides });
}

/** The `[root, program, instruction]` path for an instruction within a root. */
export function instructionPathOf(root: RootNode, instruction: InstructionNode): NodePath<InstructionNode> {
    return [root, root.program, instruction] as NodePath<InstructionNode>;
}

/** Builds a {@link ResolveDefinedTypeFn} that resolves the given defined types by name. */
export function mockResolveDefinedType(...definedTypes: DefinedTypeNode[]): ResolveDefinedTypeFn {
    const byName = new Map(definedTypes.map(definedType => [definedType.name, definedType]));
    return linkPath => {
        const definedType = byName.get(getLastNodeFromPath(linkPath).name);
        return definedType ? ([definedType] as NodePath<DefinedTypeNode>) : undefined;
    };
}

/**
 * Builds a {@link FetchAccountDataFn} from a literal address-to-data mapping, keeping the relevant
 * data visible at the call site — e.g. `mockFetch([[MINT, { decimals: 6 }]])`.
 */
export function mockFetch(entries: ReadonlyArray<readonly [Address, object]>): FetchAccountDataFn {
    const accounts = new Map(entries);
    return address =>
        Promise.resolve(
            accounts.has(address)
                ? ({
                      address,
                      data: accounts.get(address)!,
                      executable: false,
                      lamports: 0n,
                      programAddress: address,
                      space: 0n,
                  } as Account<object>)
                : null,
        );
}

export function makeRoot(
    instructions: ReturnType<typeof instructionNode>[],
    name = 'testProgram',
    definedTypes: DefinedTypeNode[] = [],
) {
    return rootNode(
        programNode({
            definedTypes,
            instructions,
            name,
            publicKey: '11111111111111111111111111111111',
        }),
    );
}

/**
 * Builds a {@link ParsedInstruction} for an instruction within a root, with the decoded data and
 * concrete account addresses supplied by the test. The node path mirrors what `parseInstruction`
 * returns: `[root, program, instruction]`.
 */
export function makeParsedInstruction(
    root: RootNode,
    instruction: InstructionNode,
    data: Record<string, unknown> = {},
    accountAddresses: ReadonlyMap<string, Address> = new Map(),
): ParsedInstruction {
    return {
        accounts: instruction.accounts.flatMap(account => {
            const address = accountAddresses.get(account.name);
            return address ? [{ address, name: account.name, role: AccountRole.READONLY }] : [];
        }),
        data,
        path: [root, root.program, instruction] as NodePath<InstructionNode>,
    };
}
