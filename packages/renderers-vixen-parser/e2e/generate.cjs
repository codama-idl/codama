#!/usr/bin/env -S node

const path = require('node:path');
const process = require('node:process');

const { rootNode } = require('@codama/nodes');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');
const fs = require('node:fs');
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

    // create src/generated directory if it doesn't exist
    const generatedDir = path.join(__dirname, project, 'parser', 'src', 'generated');
    if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
    }

    // create proto directory if it doesn't exist
    const protoDir = path.join(__dirname, project, 'parser', 'proto');
    if (!fs.existsSync(protoDir)) {
        fs.mkdirSync(protoDir);
    }

    await generateProject(project, sdkName, generateProto);
}

async function generateProject(project, sdkName, generateProto) {
    const idl = readJson(path.join(__dirname, project, 'idl.json'));
    // as we are using codama standard idl we are using rootNode(idl.program)
    const node = rootNode(idl.program);

    visit(
        node,
        renderVisitor(path.join(__dirname, project, 'parser'), {
            cargoAdditionalDependencies: [
                `codama-renderers-rust-e2e-${project} = { path = "../../../../renderers-rust/e2e/${project}" }`,
            ],
            sdkName: sdkName,
            project: `codama-renderers-vixen-parser-e2e-${project}`,
            generateProto: generateProto,
            crateFolder: path.join(__dirname, project, 'parser'),
            formatCode: true,
        }),
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
