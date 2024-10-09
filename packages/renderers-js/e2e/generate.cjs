#!/usr/bin/env -S node

const path = require('node:path');
const process = require('node:process');

const { rootNode } = require('@codama/nodes');
const { rootNodeFromAnchor } = require('@codama/nodes-from-anchor');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');

const { renderVisitor } = require('../dist/index.node.cjs');

async function main() {
    const project = process.argv.slice(2)[0] ?? undefined;
    if (project === undefined) {
        throw new Error('Project name is required.');
    }
    await generateProject(project);
}

async function generateProject(project) {
    const idl = readJson(path.join(__dirname, project, 'idl.json'));

    let node;

    if (idl?.metadata?.spec) {
        node = rootNodeFromAnchor(idl);
    } else {
        node = rootNode(idl.program, idl.additionalPrograms);
    }

    await visit(node, renderVisitor(path.join(__dirname, project, 'src', 'generated')));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
