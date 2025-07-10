const path = require('node:path');
const { rootNode } = require('@codama/nodes');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');
const { renderVisitor } = require('../../dist/index.node.cjs');

function main() {
    const projectName = process.argv.slice(2)[0] ?? undefined;
    if (projectName === undefined) {
        throw new Error('Project name is required.');
    }

    const idl = readJson(path.join(__dirname, 'idl.json'));
    const node = rootNode(idl.program);

    visit(
        node,
        renderVisitor({
            projectFolder: __dirname,
            projectName,
        }),
    );
}

main();
