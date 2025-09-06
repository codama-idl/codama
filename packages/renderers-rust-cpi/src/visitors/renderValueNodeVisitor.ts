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

import {
    addFragmentImports,
    Fragment,
    fragment,
    getBytesFromBytesValueNode,
    GetImportFromFunction,
    mergeFragments,
} from '../utils';

export function renderValueNode(
    value: ValueNode,
    getImportFrom: GetImportFromFunction,
    useStr: boolean = false,
): Fragment {
    return visit(value, renderValueNodeVisitor(getImportFrom, useStr));
}

export function renderValueNodeVisitor(
    getImportFrom: GetImportFromFunction,
    useStr: boolean = false,
): Visitor<Fragment, RegisteredValueNode['kind']> {
    return {
        visitArrayValue(node) {
            return mergeFragments(
                node.items.map(v => visit(v, this)),
                cs => `[${cs.join(', ')}]`,
            );
        },

        visitBooleanValue(node) {
            return fragment`${JSON.stringify(node.boolean)}`;
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
                const child = visit(node.value, this);
                const { format, endian } = node.type;
                const byteFunction = endian === 'le' ? 'to_le_bytes' : 'to_be_bytes';
                return fragment`${child}${format}.${byteFunction}()`;
            }
            throw new Error('Unsupported constant value type.');
        },

        visitEnumValue(node) {
            const variantName = pascalCase(node.variant);
            const enumName = addFragmentImports(fragment`${pascalCase(node.enum.name)}`, [
                `${getImportFrom(node.enum)}::${pascalCase(node.enum.name)}`,
            ]);
            if (!node.value) return fragment`${enumName}::${variantName}`;

            const fields = visit(node.value, this);
            return fragment`${enumName}::${variantName} ${fields}`;
        },

        visitMapEntryValue(node) {
            const mapKey = visit(node.key, this);
            const mapValue = visit(node.value, this);
            return fragment`[${mapKey}, ${mapValue}]`;
        },

        visitMapValue(node) {
            const entries = node.entries.map(entry => visit(entry, this));
            return addFragmentImports(
                mergeFragments(entries, cs => `HashMap::from([${cs.join(', ')}])`),
                ['std::collection::HashMap'],
            );
        },

        visitNoneValue() {
            return fragment`None`;
        },

        visitNumberValue(node) {
            return fragment`${node.number}`;
        },

        visitPublicKeyValue(node) {
            return addFragmentImports(fragment`pubkey!("${node.publicKey}")`, ['solana_program::pubkey']);
        },

        visitSetValue(node) {
            const items = node.items.map(v => visit(v, this));
            return addFragmentImports(
                mergeFragments(items, cs => `HashSet::from([${cs.join(', ')}])`),
                ['std::collection::HashSet'],
            );
        },

        visitSomeValue(node) {
            const child = visit(node.value, this);
            return fragment`Some(${child})`;
        },

        visitStringValue(node) {
            return useStr
                ? fragment`${JSON.stringify(node.string)}`
                : fragment`String::from(${JSON.stringify(node.string)})`;
        },

        visitStructFieldValue(node) {
            const structValue = visit(node.value, this);
            return fragment`${node.name}: ${structValue}`;
        },

        visitStructValue(node) {
            const fields = node.fields.map(field => visit(field, this));
            return mergeFragments(fields, cs => `{ ${cs.join(', ')} }`);
        },

        visitTupleValue(node) {
            const items = node.items.map(v => visit(v, this));
            return mergeFragments(items, cs => `(${cs.join(', ')})`);
        },
    };
}
