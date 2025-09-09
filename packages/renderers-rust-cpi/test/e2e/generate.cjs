#!/usr/bin/env -S node

const path = require('node:path');
const process = require('node:process');

const { rootNode } = require('@codama/nodes');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');

const { renderVisitor } = require('../../dist/index.node.cjs');

async function main() {
    const project = process.argv.slice(2)[0] ?? undefined;
    if (project === undefined) {
        throw new Error('Project name is required.');
    }
    await generateProject(project);
}

async function generateProject(project) {
    const idl = readJson(path.join(__dirname, project, 'idl.json'));
    const node = rootNode(idl.program);
    visit(
        node,
        renderVisitor(path.join(__dirname, project, 'src', 'generated'), {
            crateFolder: path.join(__dirname, project),
            formatCode: true,
        }),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
