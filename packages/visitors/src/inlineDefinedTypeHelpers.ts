import {
    addTypeNodeTransforms,
    assertIsNode,
    DefinedTypeLinkNode,
    definedTypeLinkNode,
    IdentifierString,
    Node,
    programLinkNode,
    TypeNode,
} from '@codama/nodes';
import { bottomUpTransformerVisitor, visit } from '@codama/visitors-core';

/**
 * Give every `definedTypeLinkNode` inside `node` that has no explicit
 * `program` the given program, so the links keep resolving to the same
 * defined types once the subtree is moved into another program.
 */
export function qualifyDefinedTypeLinks<TNode extends Node>(node: TNode, program: IdentifierString): TNode {
    const result = visit(
        node,
        bottomUpTransformerVisitor([
            {
                select: '[definedTypeLinkNode]',
                transform: link => {
                    assertIsNode(link, 'definedTypeLinkNode');
                    if (link.program) return link;
                    return definedTypeLinkNode(link.identifier, { ...link, program: programLinkNode(program) });
                },
            },
        ]),
    );
    assertIsNode(result, node.kind);
    return result as TNode;
}

/**
 * Return the type that replaces `link` when inlining the defined type it
 * points to.
 *
 * The link's own `transforms` are layered on top of the type's, since they
 * apply to the link's position. When the defined type lives in another
 * program than the one the link is inlined into, links inside the type are
 * qualified with the defined type's program so they keep resolving to the
 * same nodes.
 */
export function inlineDefinedType(
    link: DefinedTypeLinkNode,
    type: TypeNode,
    options: { definedTypeProgram: IdentifierString | undefined; linkProgram: IdentifierString | undefined },
): TypeNode {
    const { definedTypeProgram, linkProgram } = options;
    const qualifiedType =
        definedTypeProgram !== undefined && definedTypeProgram !== linkProgram
            ? qualifyDefinedTypeLinks(type, definedTypeProgram)
            : type;
    return addTypeNodeTransforms(qualifiedType, link.transforms ?? []);
}
