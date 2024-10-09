const { definedTypeNode, numberTypeNode } = require('@codama/nodes');
const { visit } = require('@codama/visitors-core');

const { getRenderMapVisitor } = require('../../dist/index.node.cjs');

const node = definedTypeNode({ name: 'answerToLife', type: numberTypeNode('u8') });
visit(node, getRenderMapVisitor());
