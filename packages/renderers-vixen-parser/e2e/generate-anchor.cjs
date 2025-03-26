#!/usr/bin/env -S node

const path = require('node:path');
const process = require('node:process');

const { rootNodeFromAnchor } = require('@codama/nodes-from-anchor');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');

const { renderVisitor } = require('../dist/index.node.cjs');

function transformHyphensToUnderscores(input) {
    return input.replace(/-/g, '_');
}

async function main() {
    const project = process.argv.slice(2)[0] ?? undefined;
    const sdkName = process.argv.slice(3)[0] ? transformHyphensToUnderscores(process.argv.slice(3)[0]) : undefined;
    const generateProto = process.argv.slice(4)[0] === 'true' ? true : false;
    if (project === undefined) {
        throw new Error('Project name is required.');
    }
    if (sdkName === undefined) {
        throw new Error('SDK name is required.');
    }
    await generateProject(project, sdkName, generateProto);
}

async function generateProject(project, sdkName, generateProto) {
    const idl = readJson(path.join(__dirname, project, 'idl.json'));
    const node = rootNodeFromAnchor(idl);

    visit(
        node,
        renderVisitor(path.join(__dirname, project, 'src', 'generated'), {
            sdkName: sdkName,
            generateProto: generateProto,
            crateFolder: path.join(__dirname, project),
            formatCode: true,
        }),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
