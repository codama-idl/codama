import {
    accountValueNode,
    constantPdaSeedNodeFromBytes,
    instructionAccountNode,
    instructionNode,
    pdaLinkNode,
    pdaNode,
    pdaSeedValueNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    variablePdaSeedNode,
} from '@codama/nodes';
import { expect, test, vi } from 'vitest';

import { extractPdasFromProgram } from '../../src/extractPdasVisitor';

function makeProgram(instructions: ReturnType<typeof instructionNode>[]) {
    return programNode({
        identifier: 'testProgram',
        instructions,
        publicKey: '1111',
    });
}

test('it extracts a single PDA to program level', () => {
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            identifier: 'myPda',
                            seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')],
                        }),
                    ),
                    identifier: 'myPda',
                    isSigner: false,
                    isWritable: false,
                }),
            ],
            identifier: 'myInstruction',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    expect(result.pdas).toEqual([
        pdaNode({
            identifier: 'myPda',
            seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')],
        }),
    ]);
    expect((result.instructions ?? [])[0].accounts?.[0]!.defaultValue).toEqual(pdaValueNode(pdaLinkNode('myPda')));
});

test('it deduplicates the same PDA across two instructions', () => {
    const seeds = [constantPdaSeedNodeFromBytes('base58', 'F9bS'), variablePdaSeedNode('owner', publicKeyTypeNode())];
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(pdaNode({ identifier: 'myPda', seeds }), {
                        seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
                    }),
                    identifier: 'myPda',
                    isSigner: false,
                    isWritable: false,
                }),
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
            ],
            identifier: 'instructionA',
        }),
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(pdaNode({ identifier: 'myPda', seeds }), {
                        seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
                    }),
                    identifier: 'myPda',
                    isSigner: false,
                    isWritable: false,
                }),
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
            ],
            identifier: 'instructionB',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    // Only one PDA extracted.
    expect(result.pdas).toHaveLength(1);
    expect((result.pdas ?? [])[0].identifier).toBe('myPda');

    // Both instructions use pdaLinkNode.
    for (const ix of result.instructions ?? []) {
        const account = (ix.accounts ?? [])[0];
        expect(account.defaultValue).toEqual(
            pdaValueNode(pdaLinkNode('myPda'), { seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))] }),
        );
    }
});

test('it handles name collisions with different seeds by prefixing the raw instruction identifier', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            identifier: 'authority',
                            seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')],
                        }),
                    ),
                    identifier: 'authority',
                    isSigner: false,
                    isWritable: false,
                }),
            ],
            identifier: 'instruction_a',
        }),
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            identifier: 'authority',
                            seeds: [constantPdaSeedNodeFromBytes('base58', 'AAAA')],
                        }),
                    ),
                    identifier: 'authority',
                    isSigner: false,
                    isWritable: false,
                }),
            ],
            identifier: 'instruction_b',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    expect(result.pdas).toHaveLength(2);
    expect((result.pdas ?? [])[0].identifier).toBe('authority');
    expect((result.pdas ?? [])[1].identifier).toBe('instruction_b_authority');
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
});

test('it excludes foreign-program PDAs', () => {
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            identifier: 'ata',
                            programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                            seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')],
                        }),
                    ),
                    identifier: 'ata',
                    isSigner: false,
                    isWritable: false,
                }),
            ],
            identifier: 'myInstruction',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    expect(result.pdas ?? []).toEqual([]);
    // Account is unchanged (still inline pdaNode).
    expect((result.instructions ?? [])[0].accounts?.[0]!.defaultValue).toEqual(
        pdaValueNode(
            pdaNode({
                identifier: 'ata',
                programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
                seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')],
            }),
        ),
    );
    // Nothing changed on the node at all.
    expect(result).toEqual(program);
});

test('it keeps dynamic programId on pdaValueNode, not on PdaNode', () => {
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(
                        pdaNode({
                            identifier: 'dynamicPda',
                            seeds: [variablePdaSeedNode('owner', publicKeyTypeNode())],
                        }),
                        {
                            programId: accountValueNode('tokenProgram'),
                            seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
                        },
                    ),
                    identifier: 'dynamicPda',
                    isSigner: false,
                    isWritable: false,
                }),
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
                instructionAccountNode({ identifier: 'tokenProgram', isSigner: false, isWritable: false }),
            ],
            identifier: 'myInstruction',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    // PdaNode has no programId.
    expect((result.pdas ?? [])[0].programId).toBeUndefined();

    // pdaValueNode still has the dynamic programId.
    const defaultValue = (result.instructions ?? [])[0].accounts?.[0]!.defaultValue;
    expect(defaultValue).toEqual(
        pdaValueNode(pdaLinkNode('dynamicPda'), {
            programId: accountValueNode('tokenProgram'),
            seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
        }),
    );
});

test('it deduplicates same seeds with different account names using first name', () => {
    const seeds = [constantPdaSeedNodeFromBytes('base58', 'F9bS'), variablePdaSeedNode('owner', publicKeyTypeNode())];
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(pdaNode({ identifier: 'authority', seeds }), {
                        seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
                    }),
                    identifier: 'authority',
                    isSigner: false,
                    isWritable: false,
                }),
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
            ],
            identifier: 'instructionA',
        }),
        instructionNode({
            accounts: [
                instructionAccountNode({
                    defaultValue: pdaValueNode(pdaNode({ identifier: 'admin', seeds }), {
                        seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))],
                    }),
                    identifier: 'admin',
                    isSigner: false,
                    isWritable: false,
                }),
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
            ],
            identifier: 'instructionB',
        }),
    ]);

    const result = extractPdasFromProgram(program);

    expect(result.pdas).toHaveLength(1);
    expect((result.pdas ?? [])[0].identifier).toBe('authority');

    // Both instructions link to the first-encountered name.
    expect((result.instructions ?? [])[0].accounts?.[0]!.defaultValue).toEqual(
        pdaValueNode(pdaLinkNode('authority'), { seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))] }),
    );
    expect((result.instructions ?? [])[1].accounts?.[0]!.defaultValue).toEqual(
        pdaValueNode(pdaLinkNode('authority'), { seeds: [pdaSeedValueNode('owner', accountValueNode('owner'))] }),
    );
});

test('it preserves existing program-level PDAs', () => {
    const existingPda = pdaNode({
        identifier: 'existingPda',
        seeds: [constantPdaSeedNodeFromBytes('base58', 'ZZZZ')],
    });
    const program = programNode({
        identifier: 'testProgram',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({ identifier: 'newPda', seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')] }),
                        ),
                        identifier: 'newPda',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                identifier: 'myInstruction',
            }),
        ],
        pdas: [existingPda],
        publicKey: '1111',
    });

    const result = extractPdasFromProgram(program);

    expect(result.pdas).toHaveLength(2);
    expect((result.pdas ?? [])[0]).toEqual(existingPda);
    expect((result.pdas ?? [])[1].identifier).toBe('newPda');
});

test('it returns empty pdas when no PDA accounts exist', () => {
    const program = makeProgram([
        instructionNode({
            accounts: [
                instructionAccountNode({ identifier: 'owner', isSigner: false, isWritable: false }),
                instructionAccountNode({ identifier: 'payer', isSigner: false, isWritable: false }),
            ],
            identifier: 'myInstruction',
        }),
    ]);

    const result = extractPdasFromProgram(program);
    expect(result.pdas ?? []).toEqual([]);
    // Nothing changed on the node at all.
    expect(result).toEqual(program);
});

test('it suffixes extracted PDA names that are already used by program-level PDAs', () => {
    const existingPda = pdaNode({
        identifier: 'my_pda',
        seeds: [constantPdaSeedNodeFromBytes('base58', 'ZZZZ')],
    });
    const program = programNode({
        identifier: 'testProgram',
        instructions: [
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode(
                            pdaNode({ identifier: 'my_pda', seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')] }),
                        ),
                        identifier: 'my_pda',
                        isSigner: false,
                        isWritable: false,
                    }),
                ],
                identifier: 'my_instruction',
            }),
        ],
        pdas: [existingPda],
        publicKey: '1111',
    });

    const result = extractPdasFromProgram(program);

    expect(result.pdas).toEqual([
        existingPda,
        pdaNode({ identifier: 'my_pda2', seeds: [constantPdaSeedNodeFromBytes('base58', 'F9bS')] }),
    ]);
    expect((result.instructions ?? [])[0].accounts?.[0]!.defaultValue).toEqual(pdaValueNode(pdaLinkNode('my_pda2')));
});
