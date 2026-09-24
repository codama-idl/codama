import { IdentifierString, isNode, Node } from '@codama/nodes';
import {
    extendVisitor,
    findProgramNodeFromPath,
    mergeVisitor,
    NodePath,
    NodeStack,
    pipe,
    recordNodeStackVisitor,
    Visitor,
} from '@codama/visitors-core';

type DefinedTypeHistogramKey = IdentifierString | `${IdentifierString}.${IdentifierString}`;

export type DefinedTypeHistogram = {
    [key: DefinedTypeHistogramKey]: {
        /** Uses as an instruction's `data` itself or as the type of one of its top-level data fields. */
        directlyAsInstructionData: number;
        inAccounts: number;
        inDefinedTypes: number;
        inEvents: number;
        inInstructionData: number;
        total: number;
    };
};

type LinkUsage = { direct: boolean; mode: 'account' | 'definedType' | 'event' | 'instruction' | null };

function mergeHistograms(histograms: DefinedTypeHistogram[]): DefinedTypeHistogram {
    const result: DefinedTypeHistogram = {};

    histograms.forEach(histogram => {
        (Object.keys(histogram) as DefinedTypeHistogramKey[]).forEach(key => {
            if (result[key] === undefined) {
                result[key] = { ...histogram[key] };
            } else {
                result[key].total += histogram[key].total;
                result[key].inAccounts += histogram[key].inAccounts;
                result[key].inDefinedTypes += histogram[key].inDefinedTypes;
                result[key].inEvents += histogram[key].inEvents;
                result[key].inInstructionData += histogram[key].inInstructionData;
                result[key].directlyAsInstructionData += histogram[key].directlyAsInstructionData;
            }
        });
    });

    return result;
}

/**
 * Count the uses of every defined type, keyed by
 * `programIdentifier.typeIdentifier` (or `typeIdentifier` outside of a
 * program).
 *
 * Every `definedTypeLinkNode` counts towards `total`, including those in
 * default values, PDA seeds or constants. The `in*` counters only track
 * links inside an account's data, a defined type's type, an event's data or
 * an instruction's data respectively.
 */
export function getDefinedTypeHistogramVisitor(): Visitor<DefinedTypeHistogram> {
    const stack = new NodeStack();

    return pipe(
        mergeVisitor(
            () => ({}) as DefinedTypeHistogram,
            (_, histograms) => mergeHistograms(histograms),
        ),
        v =>
            extendVisitor(v, {
                visitDefinedTypeLink(node) {
                    const path = stack.getPath();
                    const program = node.program ?? findProgramNodeFromPath(path);
                    const key = program ? `${program.identifier}.${node.identifier}` : node.identifier;
                    const { direct, mode } = getLinkUsage(path);
                    return {
                        [key]: {
                            directlyAsInstructionData: Number(direct),
                            inAccounts: Number(mode === 'account'),
                            inDefinedTypes: Number(mode === 'definedType'),
                            inEvents: Number(mode === 'event'),
                            inInstructionData: Number(mode === 'instruction'),
                            total: 1,
                        },
                    };
                },
            }),
        v => recordNodeStackVisitor(v, stack),
    );
}

/**
 * Locate a link, given its path, relative to its closest account, event,
 * defined type or instruction: whether it sits under that node's data (or
 * type) and, for instructions, whether it is used directly.
 */
function getLinkUsage(path: NodePath): LinkUsage {
    const link = path[path.length - 1];
    for (let index = path.length - 2; index >= 0; index--) {
        const owner = path[index];
        const child: Node | undefined = path[index + 1];
        if (isNode(owner, 'accountNode')) return { direct: false, mode: child === owner.data ? 'account' : null };
        if (isNode(owner, 'eventNode')) return { direct: false, mode: child === owner.data ? 'event' : null };
        if (isNode(owner, 'definedTypeNode')) {
            return { direct: false, mode: child === owner.type ? 'definedType' : null };
        }
        if (isNode(owner, 'instructionNode')) {
            if (child !== owner.data) return { direct: false, mode: null };
            const isData = path.length === index + 2;
            const field = path[index + 2];
            const isTopLevelFieldType =
                isNode(child, 'structTypeNode') &&
                path.length === index + 4 &&
                isNode(field, 'structFieldTypeNode') &&
                field.type === link;
            return { direct: isData || isTopLevelFieldType, mode: 'instruction' };
        }
    }
    return { direct: false, mode: null };
}
