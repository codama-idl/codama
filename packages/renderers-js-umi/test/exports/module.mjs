// This ensures that we do not rely on `__dirname` in ES modules even when it is polyfilled.
globalThis.__dirname = 'DO_NOT_USE';

import { definedTypeNode, numberTypeNode } from '@kinobi-so/nodes';
import { visit } from '@kinobi-so/visitors-core';

import { getRenderMapVisitor } from '../../dist/index.node.mjs';

const node = definedTypeNode({ name: 'answerToLife', type: numberTypeNode('u8') });
visit(node, getRenderMapVisitor());
