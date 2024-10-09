import {
    arrayValueNode,
    bytesValueNode,
    isNode,
    numberValueNode,
    pascalCase,
    RegisteredValueNode,
    ValueNode,
} from '@codama/nodes';
import { visit, Visitor } from '@codama/visitors-core';

import { ImportMap } from './ImportMap';
import { getBytesFromBytesValueNode, GetImportFromFunction } from './utils';

export function renderValueNode(
    value: ValueNode,
    getImportFrom: GetImportFromFunction,
    useStr: boolean = false,
): {
    imports: ImportMap;
    render: string;
} {
    return visit(value, renderValueNodeVisitor(getImportFrom, useStr));
}

export function renderValueNodeVisitor(
    getImportFrom: GetImportFromFunction,
    useStr: boolean = false,
): Visitor<
    {
        imports: ImportMap;
        render: string;
    },
    RegisteredValueNode['kind']
> {
    return {
        visitArrayValue(node) {
            const list = node.items.map(v => visit(v, this));
            return {
                imports: new ImportMap().mergeWith(...list.map(c => c.imports)),
                render: `[${list.map(c => c.render).join(', ')}]`,
            };
        },
        visitBooleanValue(node) {
            return {
                imports: new ImportMap(),
                render: JSON.stringify(node.boolean),
            };
        },
        visitBytesValue(node) {
            const bytes = getBytesFromBytesValueNode(node);
            const numbers = Array.from(bytes).map(numberValueNode);
            return visit(arrayValueNode(numbers), this);
        },
        visitConstantValue(node) {
            if (isNode(node.value, 'bytesValueNode')) {
                return visit(node.value, this);
            }
            if (isNode(node.type, 'stringTypeNode') && isNode(node.value, 'stringValueNode')) {
                return visit(bytesValueNode(node.type.encoding, node.value.string), this);
            }
            if (isNode(node.type, 'numberTypeNode') && isNode(node.value, 'numberValueNode')) {
                const numberManifest = visit(node.value, this);
                const { format, endian } = node.type;
                const byteFunction = endian === 'le' ? 'to_le_bytes' : 'to_be_bytes';
                numberManifest.render = `${numberManifest.render}${format}.${byteFunction}()`;
                return numberManifest;
            }
            throw new Error('Unsupported constant value type.');
        },
        visitEnumValue(node) {
            const imports = new ImportMap();
            const enumName = pascalCase(node.enum.name);
            const variantName = pascalCase(node.variant);
            const importFrom = getImportFrom(node.enum);
            imports.add(`${importFrom}::${enumName}`);
            if (!node.value) {
                return { imports, render: `${enumName}::${variantName}` };
            }
            const enumValue = visit(node.value, this);
            const fields = enumValue.render;
            return {
                imports: imports.mergeWith(enumValue.imports),
                render: `${enumName}::${variantName} ${fields}`,
            };
        },
        visitMapEntryValue(node) {
            const mapKey = visit(node.key, this);
            const mapValue = visit(node.value, this);
            return {
                imports: mapKey.imports.mergeWith(mapValue.imports),
                render: `[${mapKey.render}, ${mapValue.render}]`,
            };
        },
        visitMapValue(node) {
            const map = node.entries.map(entry => visit(entry, this));
            const imports = new ImportMap().add('std::collection::HashMap');
            return {
                imports: imports.mergeWith(...map.map(c => c.imports)),
                render: `HashMap::from([${map.map(c => c.render).join(', ')}])`,
            };
        },
        visitNoneValue() {
            return {
                imports: new ImportMap(),
                render: 'None',
            };
        },
        visitNumberValue(node) {
            return {
                imports: new ImportMap(),
                render: node.number.toString(),
            };
        },
        visitPublicKeyValue(node) {
            return {
                imports: new ImportMap().add('solana_program::pubkey'),
                render: `pubkey!("${node.publicKey}")`,
            };
        },
        visitSetValue(node) {
            const set = node.items.map(v => visit(v, this));
            const imports = new ImportMap().add('std::collection::HashSet');
            return {
                imports: imports.mergeWith(...set.map(c => c.imports)),
                render: `HashSet::from([${set.map(c => c.render).join(', ')}])`,
            };
        },
        visitSomeValue(node) {
            const child = visit(node.value, this);
            return {
                ...child,
                render: `Some(${child.render})`,
            };
        },
        visitStringValue(node) {
            return {
                imports: new ImportMap(),
                render: useStr ? `${JSON.stringify(node.string)}` : `String::from(${JSON.stringify(node.string)})`,
            };
        },
        visitStructFieldValue(node) {
            const structValue = visit(node.value, this);
            return {
                imports: structValue.imports,
                render: `${node.name}: ${structValue.render}`,
            };
        },
        visitStructValue(node) {
            const struct = node.fields.map(field => visit(field, this));
            return {
                imports: new ImportMap().mergeWith(...struct.map(c => c.imports)),
                render: `{ ${struct.map(c => c.render).join(', ')} }`,
            };
        },
        visitTupleValue(node) {
            const tuple = node.items.map(v => visit(v, this));
            return {
                imports: new ImportMap().mergeWith(...tuple.map(c => c.imports)),
                render: `(${tuple.map(c => c.render).join(', ')})`,
            };
        },
    };
}
