#!/usr/bin/env -S node

const path = require('node:path');
const process = require('node:process');

const { rootNode } = require('@kinobi-so/nodes');
const { rootNodeFromAnchor } = require('@kinobi-so/nodes-from-anchor');
const { readJson } = require('@kinobi-so/renderers-core');
const { visit } = require('@kinobi-so/visitors-core');
const { addInstructionBundlesVisitor } = require('@kinobi-so/visitors');

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

    try {
        const bundles = readJson(path.join(__dirname, project, 'bundles.json'));

        if (bundles) {
            node = await visit(node, addInstructionBundlesVisitor(bundles ?? {}))
        }
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }

    await visit(node, renderVisitor(path.join(__dirname, project, 'src', 'generated')));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});