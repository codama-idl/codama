const path = require('node:path');

const { rootNodeFromAnchor } = require('@codama/nodes-from-anchor');
const { readJson } = require('@codama/renderers-core');
const { visit } = require('@codama/visitors-core');

const { renderVisitor: renderVixenVisitor } = require('../../dist/index.node.cjs');
const { renderVisitor: renderRustVisitor } = require('@codama/renderers-rust');

function generateProject(project, node, generateProto) {
    const crateFolder = __dirname;

    // Push `fees` defined type (not included in idl)
    // // https://github.com/raydium-io/raydium-amm/blob/master/program/src/state.rs#L475-L496
    node.program.definedTypes.push({
        kind: 'definedTypeNode',
        name: 'fees',
        docs: [],
        type: {
            kind: 'structTypeNode',
            fields: [
                'minSeparateNumerator',
                'minSeparateDenominator',
                'tradeFeeNumerator',
                'tradeFeeDenominator',
                'pnlNumerator',
                'pnlDenominator',
                'swapFeeNumerator',
                'swapFeeDenominator',
            ].map(fieldName => ({
                kind: 'structFieldTypeNode',
                name: fieldName,
                docs: [],
                type: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
            })),
        },
    });

    // Add `ammConfig` account (not included in idl)
    // https://github.com/raydium-io/raydium-amm/blob/master/program/src/state.rs#L860-L871
    const ammConfig = {
        kind: 'accountNode',
        name: 'ammConfig',
        docs: [],
        data: {
            kind: 'structTypeNode',
            fields: [
                {
                    kind: 'structFieldTypeNode',
                    name: 'pnlOwner',
                    docs: [],
                    type: { kind: 'publicKeyTypeNode' },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'cancelOwner',
                    docs: [],
                    type: { kind: 'publicKeyTypeNode' },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'pending1',
                    docs: [],
                    type: {
                        kind: 'arrayTypeNode',
                        item: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
                        count: { kind: 'fixedCountNode', value: 28 },
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'pending2',
                    docs: [],
                    type: {
                        kind: 'arrayTypeNode',
                        item: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
                        count: { kind: 'fixedCountNode', value: 31 },
                    },
                },
                {
                    kind: 'structFieldTypeNode',
                    name: 'createPoolFee',
                    docs: [],
                    type: { kind: 'numberTypeNode', format: 'u64', endian: 'le' },
                },
            ],
        },
        discriminators: [],
    };
    node.program.accounts.push(ammConfig);

    const ammConfigIndex = node.program.definedTypes.findIndex(definedType => definedType.name === 'ammConfig');
    node.program.definedTypes[ammConfigIndex].type = { ...ammConfig.data };
    const newNode = { ...node.program.definedTypes[ammConfigIndex], type: { ...ammConfig.data } };
    node.program.definedTypes.splice(ammConfigIndex, 1, newNode);

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
    let node = rootNodeFromAnchor(idl);
    node = setDefaultShankDiscriminators(node);

    node.program.publicKey = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';

    generateProject(project, node, generateProto);
}

main();

function setDefaultShankDiscriminators(node) {
    node.program.origin = 'shank';

    node.program.instructions.map((instruction, i) => {
        instruction.discriminators = [
            {
                kind: 'fieldDiscriminatorNode',
                field: 'discriminator',
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
                data: i.toString(16),
                encoding: 'base16',
            },
        };

        // // Remove discriminator argument if it exists
        const index = instruction.arguments.findIndex(arg => arg.name === 'discriminator');
        if (index !== -1) {
            instruction.arguments.splice(index, 1);
        }

        instruction.arguments.unshift(discriminatorArgument);
    });

    // By default use account length as discriminator for accounts
    const accounts = node.program.accounts.map(account => {
        let updatedAccount = { ...account, discriminators: [] };

        const index = account.data.fields.findIndex(field => field.name === 'discriminator');
        if (index !== -1) {
            updatedAccount.data.fields.splice(index, 1);
        }
        return updatedAccount;
    });

    node = { ...node, program: { ...node.program, accounts } };

    return node;
}
