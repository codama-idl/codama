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
    let node = rootNode(idl.program);
    node = setDiscriminatorsToFixedSize(node);

    visit(
        node,
        renderVisitor({
            projectFolder: __dirname,
            projectName,
        }),
    );
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
