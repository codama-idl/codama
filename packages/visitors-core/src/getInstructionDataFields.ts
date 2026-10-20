import {
    DefinedTypeNode,
    InstructionNode,
    isNode,
    Node,
    PathString,
    StructFieldTypeNode,
    TypeNode,
} from '@codama/nodes';

import { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath, NodePath } from './NodePath';
import { NodeStack } from './NodeStack';

/** A struct field within an instruction's data, with its full path. */
export type InstructionDataField = {
    field: StructFieldTypeNode;
    /**
     * The path of the field node, from the start of the instruction path, e.g.
     * `[root, program, instruction, struct, field]`. Fields within a linked defined type have a
     * path through that defined type, e.g. `[root, program, definedType, struct, field]`.
     */
    fieldPath: NodePath<StructFieldTypeNode>;
    /** The field's full path within `instructionNode.data`, e.g. `config.bump`. */
    path: PathString;
};

/**
 * List every struct field addressable within an instruction's `data`, with
 * its full path, following `definedTypeLinkNode`s.
 *
 * Fields are only addressable where the data type resolves to a struct, so
 * nested fields are listed for struct-typed (or struct-linked) fields only.
 * Each defined type is followed at most once per branch, which guards against
 * cycles while still expanding sibling fields linking the same type.
 *
 * @param instructionPath - The path to the instruction. It must contain the
 *   instruction's `programNode` for linked data to be followed; otherwise a
 *   linked type contributes no fields.
 * @param linkables - Used to follow `definedTypeLinkNode`s.
 *
 * @example
 * ```ts
 * // data: struct { amount: u64, config: struct { fee: u16 } }
 * getInstructionDataFields(instructionPath, linkables).map(({ path }) => path);
 * // ['amount', 'config', 'config.fee']
 * ```
 */
export function getInstructionDataFields(
    instructionPath: NodePath<InstructionNode>,
    linkables: LinkableDictionary,
): InstructionDataField[] {
    const fields: InstructionDataField[] = [];
    const stack = new NodeStack(instructionPath);
    // The defined types followed on the current branch, keyed by node rather than
    // identifier: same-named types of different programs are distinct.
    const followedDefinedTypes = new Set<DefinedTypeNode>();

    // The `typePath` leads to the walked type, which is its last node.
    const walk = (type: TypeNode, prefix: string, typePath: readonly Node[]): void => {
        if (isNode(type, 'definedTypeLinkNode')) {
            const linkedPath = linkables.getPath([...stack.getPath(), type]);
            if (!linkedPath) return;
            const definedType = getLastNodeFromPath(linkedPath);
            if (followedDefinedTypes.has(definedType)) return;
            followedDefinedTypes.add(definedType);
            stack.withPath(linkedPath, () => walk(definedType.type, prefix, [...linkedPath, definedType.type]));
            followedDefinedTypes.delete(definedType);
            return;
        }
        if (!isNode(type, 'structTypeNode')) return;
        (type.fields ?? []).forEach(field => {
            const path = (prefix ? `${prefix}.${field.identifier}` : field.identifier) as PathString;
            const fieldPath = [...typePath, field] as const;
            fields.push({ field, fieldPath, path });
            if (isNode(field.type, ['structTypeNode', 'definedTypeLinkNode'])) {
                walk(field.type, path, [...fieldPath, field.type]);
            }
        });
    };

    const data = getLastNodeFromPath(instructionPath).data;
    if (data) walk(data, '', [...instructionPath, data]);
    return fields;
}
