import {
    constantPdaSeedNodeFromString,
    instructionAccountNode,
    instructionNode,
    pdaNode,
    pdaValueNode,
    programNode,
    publicKeyTypeNode,
    rootNode,
    variablePdaSeedNode,
} from 'codama';
import { describe, expect, test } from 'vitest';

import { collectPdaNodesFromIdl } from '../../src/codegen/collect-pda-nodes';
import { makeRoot } from '../test-utils';

describe('collectPdaNodesFromIdl', () => {
    test('should collect inline PDA from instruction account default', () => {
        const inline = pdaNode({
            name: 'inline',
            seeds: [variablePdaSeedNode('mint', publicKeyTypeNode())],
        });
        const root = makeRoot([
            instructionNode({
                accounts: [
                    instructionAccountNode({
                        defaultValue: pdaValueNode(inline),
                        isSigner: false,
                        isWritable: false,
                        name: 'acc',
                    }),
                ],
                name: 'test',
            }),
        ]);

        const map = collectPdaNodesFromIdl(root);
        expect(map.size).toBe(1);
        expect(map.get('inline')).toBe(inline);
    });

    test('should prefer program.pdas over inline duplicate of the same name', () => {
        const topLevel = pdaNode({
            name: 'shared',
            seeds: [constantPdaSeedNodeFromString('utf8', 'top')],
        });
        const inline = pdaNode({
            name: 'shared',
            seeds: [constantPdaSeedNodeFromString('utf8', 'inline')],
        });

        const root = rootNode(
            programNode({
                instructions: [
                    instructionNode({
                        accounts: [
                            instructionAccountNode({
                                defaultValue: pdaValueNode(inline),
                                isSigner: false,
                                isWritable: false,
                                name: 'acc',
                            }),
                        ],
                        name: 'test',
                    }),
                ],
                name: 'program',
                pdas: [topLevel],
                publicKey: '11111111111111111111111111111111',
            }),
        );

        const map = collectPdaNodesFromIdl(root);
        expect(map.size).toBe(1);
        expect(map.get('shared')).toBe(topLevel);
    });
});
