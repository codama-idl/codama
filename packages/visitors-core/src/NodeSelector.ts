import { camelCase, CamelCaseString, Node } from '@codama/nodes';

import type { NodeStack } from './NodeStack';

export type NodeSelector = NodeSelectorFunction | NodeSelectorPath;

/**
 * A string that can be used to select a node in a Kinobi tree.
 * - `*` matches any node.
 * - `someText` matches the name of a node, if any.
 * - `[someNode]` matches a node of the given kind.
 * - `[someNode|someOtherNode]` matches a node with any of the given kind.
 * - `[someNode]someText` matches both the kind and the name of a node.
 * - `a.b.c` matches a node `c` such that its parent stack contains `a` and `b` in order (but not necessarily subsequent).
 */
export type NodeSelectorPath = string;

export type NodeSelectorFunction = (node: Node, stack: NodeStack) => boolean;

export const getNodeSelectorFunction = (selector: NodeSelector): NodeSelectorFunction => {
    if (typeof selector === 'function') return selector;

    const checkNode = (node: Node, nodeSelector: string): boolean => {
        if (nodeSelector === '*') return true;
        const matches = nodeSelector.match(/^(?:\[([^\]]+)\])?(.*)?$/);
        if (!matches) return false;
        const [, kinds, name] = matches;

        // Check kinds.
        const kindArray = kinds ? kinds.split('|').map(camelCase) : [];
        if (kindArray.length > 0 && !kindArray.includes(node.kind as CamelCaseString)) {
            return false;
        }

        // Check names.
        if (name && (!('name' in node) || camelCase(name) !== node.name)) {
            return false;
        }

        return true;
    };

    const checkStack = (nodeStack: Node[], nodeSelectors: string[]): boolean => {
        if (nodeSelectors.length === 0) return true;
        if (nodeStack.length === 0) return false;
        const lastNode = nodeStack.pop() as Node;
        const lastNodeSelector = nodeSelectors.pop() as string;
        return checkNode(lastNode, lastNodeSelector)
            ? checkStack(nodeStack, nodeSelectors)
            : checkStack(nodeStack, [...nodeSelectors, lastNodeSelector]);
    };

    const nodeSelectors = selector.split('.');
    const lastNodeSelector = nodeSelectors.pop() as string;

    return (node, stack) => checkNode(node, lastNodeSelector) && checkStack(stack.all() as Node[], [...nodeSelectors]);
};

export const getConjunctiveNodeSelectorFunction = (selector: NodeSelector | NodeSelector[]): NodeSelectorFunction => {
    const selectors = Array.isArray(selector) ? selector : [selector];
    const selectorFunctions = selectors.map(getNodeSelectorFunction);
    return (node, stack) => selectorFunctions.every(fn => fn(node, stack));
};
