import { getAllAccounts, getAllDefinedTypes, getAllPdas, getAllPrograms, NodeKind } from '@kinobi-so/nodes';

import { extendVisitor, VisitorOverrides } from './extendVisitor';
import { LinkableDictionary } from './LinkableDictionary';
import { Visitor } from './visitor';

export function recordLinkablesVisitor<TReturn, TNodeKind extends NodeKind>(
    visitor: Visitor<TReturn, TNodeKind>,
    linkables: LinkableDictionary,
): Visitor<TReturn, TNodeKind> {
    const overriddenFunctions: VisitorOverrides<
        TReturn,
        'accountNode' | 'definedTypeNode' | 'pdaNode' | 'programNode' | 'rootNode'
    > = {};
    if ('visitRoot' in visitor) {
        overriddenFunctions.visitRoot = function visitRoot(node, { next }) {
            linkables.recordAll([
                ...getAllPrograms(node),
                ...getAllPdas(node),
                ...getAllAccounts(node),
                ...getAllDefinedTypes(node),
            ]);
            return next(node);
        };
    }
    if ('visitProgram' in visitor) {
        overriddenFunctions.visitProgram = function visitProgram(node, { next }) {
            linkables.recordAll([node, ...node.pdas, ...node.accounts, ...node.definedTypes]);
            return next(node);
        };
    }
    if ('visitPda' in visitor) {
        overriddenFunctions.visitPda = function visitPda(node, { next }) {
            linkables.record(node);
            return next(node);
        };
    }
    if ('visitAccount' in visitor) {
        overriddenFunctions.visitAccount = function visitAccount(node, { next }) {
            linkables.record(node);
            return next(node);
        };
    }
    if ('visitDefinedType' in visitor) {
        overriddenFunctions.visitDefinedType = function visitDefinedType(node, { next }) {
            linkables.record(node);
            return next(node);
        };
    }
    return extendVisitor(visitor, overriddenFunctions as VisitorOverrides<TReturn, TNodeKind>);
}
