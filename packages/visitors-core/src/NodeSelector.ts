import { camelCase, CamelCaseString, Node } from '@codama/nodes';

import { NodePath } from './NodePath';

export type NodeSelector = NodeSelectorFunction | NodeSelectorPath;

/**
 * A string that can be used to select a node in a Codama tree.
 * - `*` matches any node.
 * - `someText` matches the name of a node, if any.
 * - `[someNode]` matches a node of the given kind.
 * - `[someNode|someOtherNode]` matches a node with any of the given kind.
 * - `[someNode]someText` matches both the kind and the name of a node.
 * - `a.b.c` matches a node `c` such that its ancestors contains `a` and `b` in order (but not necessarily subsequent).
 */
export type NodeSelectorPath = string;

export type NodeSelectorFunction = (path: NodePath<Node>) => boolean;

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

    const checkPath = (path: Node[], nodeSelectors: string[]): boolean => {
        if (nodeSelectors.length === 0) return true;
        if (path.length === 0) return false;
        const lastNode = path.pop() as Node;
        const lastNodeSelector = nodeSelectors.pop() as string;
        return checkNode(lastNode, lastNodeSelector)
            ? checkPath(path, nodeSelectors)
            : checkPath(path, [...nodeSelectors, lastNodeSelector]);
    };

    const checkInitialPath = (path: Node[], nodeSelectors: string[]): boolean => {
        if (nodeSelectors.length === 0 || path.length === 0) return false;
        const lastNode = path.pop() as Node;
        const lastNodeSelector = nodeSelectors.pop() as string;
        return checkNode(lastNode, lastNodeSelector) && checkPath(path, nodeSelectors);
    };

    const nodeSelectors = selector.split('.');
    return path => checkInitialPath([...path], [...nodeSelectors]);
};

export const getConjunctiveNodeSelectorFunction = (selector: NodeSelector | NodeSelector[]): NodeSelectorFunction => {
    const selectors = Array.isArray(selector) ? selector : [selector];
    const selectorFunctions = selectors.map(getNodeSelectorFunction);
    return path => selectorFunctions.every(fn => fn(path));
};
