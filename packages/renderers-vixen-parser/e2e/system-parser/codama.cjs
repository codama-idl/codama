const path = require('node:path');
const { rootNode } = require('@codama/nodes');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');
const { renderVisitor: renderVixenVisitor } = require('../../dist/index.node.cjs');
const { renderVisitor: renderRustVisitor } = require('@codama/renderers-rust');

function generateProject(project, node, generateProto) {
    const crateFolder = __dirname;

    // #Renderers-rust
    visit(
        node,
        renderRustVisitor(path.join(crateFolder, 'src', 'generated_sdk'), {
            crateFolder,
            formatCode: true,
        }),
    );

    //  #Render Vixen Parser
    visit(
        node,
        renderVixenVisitor(crateFolder, {
            sdkName: 'crate',
            crateFolder,
            formatCode: true,
            generateProto,
            project,
            generatedFolderName: 'generated_parser',
            deleteFolderBeforeRendering: false,
            cargoAdditionalDependencies: [
                'yellowstone-vixen-core = { git = "https://github.com/rpcpool/yellowstone-vixen", branch = "main",features = ["proto"] }',
                'num-derive = "0.4"',
                'thiserror = "1.0.64"',
                'num-traits = "^0.2"',
                'tracing = { version = "0.1.40", optional = true }',
                'strum = { version = "0.24", optional = true }',
                'strum_macros = { version = "0.24", optional = true }',
                '\n',
                '[features]',
                'anchor = []',
                'anchor-idl-build = []',
                'serde = []',
                'test-sbf = []',
                'fetch = []',
                'tracing = ["dep:tracing", "dep:strum", "dep:strum_macros"]',
            ],
        }),
    );
}

function main() {
    const project = process.argv.slice(2)[0] ?? undefined;
    const generateProto = process.argv.slice(3)[0] === 'true' ? true : false;

    if (project === undefined) {
        throw new Error('Project name is required.');
    }

    const idl = readJson(path.join(__dirname, 'idl.json'));
    let node = rootNode(idl.program);

    node = setDiscriminatorsToFixedSize(node);

    generateProject(project, node, generateProto);
}

main();

// Transform number type discriminators(not supported by vixen renderer yet) to fixed size
function setDiscriminatorsToFixedSize(node) {
    const instructions = node.program.instructions.map(instruction => {
        const index = instruction.arguments.findIndex(arg => arg.name === 'discriminator');
        const data = instruction.arguments[index].defaultValue.number;
        if (index !== -1) {
            instruction.arguments.splice(index, 1);
        }

        instruction.discriminators = [
            {
                kind: 'fieldDiscriminatorNode',
                name: 'discriminator',
                offset: 0,
            },
        ];

        const discriminatorArgument = {
            kind: 'instructionArgumentNode',
            name: 'discriminator',
            defaultValueStrategy: 'omitted',
            docs: [],
            type: {
                kind: 'fixedSizeTypeNode',
                size: 1,
                type: { kind: 'bytesTypeNode' },
            },
            defaultValue: {
                kind: 'bytesValueNode',
                data: data.toString(16),
                encoding: 'base16',
            },
        };

        instruction.arguments.unshift(discriminatorArgument);

        return instruction;
    });

    return { ...node, program: { ...node.program, instructions } };
}
