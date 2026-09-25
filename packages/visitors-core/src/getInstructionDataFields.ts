import { DefinedTypeNode, InstructionNode, isNode, PathString, StructFieldTypeNode, TypeNode } from '@codama/nodes';

import { LinkableDictionary } from './LinkableDictionary';
import { getLastNodeFromPath, NodePath } from './NodePath';
import { NodeStack } from './NodeStack';

/** A struct field within an instruction's data, with its full path. */
export type InstructionDataField = {
    field: StructFieldTypeNode;
    /** The field's full path within `instructionNode.data`, e.g. `config.bump`. */
    path: PathString;
};

/**
 * List every struct field addressable within an instruction's `data`, with
 * its full path, following `definedTypeLinkNode`s.
 *
 * Fields are only addressable where the data type resolves to a struct, so
 * nested fields are listed for struct-typed (or struct-linked) fields only.
 * Each defined type is followed at most once, which guards against cycles.
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
    // Keyed by node rather than identifier: same-named types of different programs are distinct.
    const walkedDefinedTypes = new Set<DefinedTypeNode>();

    const walk = (type: TypeNode | undefined, prefix: string): void => {
        if (!type) return;
        if (isNode(type, 'definedTypeLinkNode')) {
            const linkedPath = linkables.getPath([...stack.getPath(), type]);
            if (!linkedPath) return;
            const definedType = getLastNodeFromPath(linkedPath);
            if (walkedDefinedTypes.has(definedType)) return;
            walkedDefinedTypes.add(definedType);
            stack.pushPath(linkedPath);
            walk(definedType.type, prefix);
            stack.popPath();
            return;
        }
        if (!isNode(type, 'structTypeNode')) return;
        (type.fields ?? []).forEach(field => {
            const path = (prefix ? `${prefix}.${field.identifier}` : field.identifier) as PathString;
            fields.push({ field, path });
            if (isNode(field.type, ['structTypeNode', 'definedTypeLinkNode'])) {
                walk(field.type, path);
            }
        });
    };

    walk(getLastNodeFromPath(instructionPath).data, '');
    return fields;
}
