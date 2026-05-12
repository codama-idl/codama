import { programNode, rootNode } from 'codama';

// Shared root node mock for tests
export const rootNodeMock = rootNode(
    programNode({
        name: 'test',
        publicKey: '11111111111111111111111111111111',
    }),
);
