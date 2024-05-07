const { definedTypeNode, numberTypeNode } = require('@kinobi-so/nodes');
const { visit } = require('@kinobi-so/visitors-core');

const { getRenderMapVisitor } = require('../../dist/index.node.cjs');

const node = definedTypeNode({ name: 'answerToLife', type: numberTypeNode('u8') });
visit(node, getRenderMapVisitor());
