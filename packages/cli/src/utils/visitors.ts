import type { RootNode } from '@codama/nodes';
import { rootNodeVisitor, visit, type Visitor } from '@codama/visitors-core';
import pico from 'picocolors';

import { ParsedVisitorConfig } from '../parsedConfig';
import { CliError } from './errors';
import { importModuleItem } from './import';
import { isRootNode } from './nodes';
import { promisify } from './promises';

export async function getRootNodeVisitors(
    visitors: readonly ParsedVisitorConfig[],
): Promise<Visitor<RootNode, 'rootNode'>[]> {
    return await Promise.all(visitors.map(getRootNodeVisitor));
}

async function getRootNodeVisitor(visitorConfig: ParsedVisitorConfig): Promise<Visitor<RootNode, 'rootNode'>> {
    const { item, path } = visitorConfig;
    const identifier = getVisitorIdentifier(visitorConfig);
    const moduleItem = await importModuleItem({ identifier, from: path, item });
    const visitor = await getVisitorFromModuleItem(identifier, moduleItem, visitorConfig);
    return rootNodeVisitor(root => {
        const result = visit(root, visitor);
        return isRootNode(result) ? result : root;
    });
}

type UnknownFunction = (...args: readonly unknown[]) => unknown;
async function getVisitorFromModuleItem(
    identifier: string,
    moduleItem: unknown,
    visitorConfig: ParsedVisitorConfig,
): Promise<Visitor<unknown, 'rootNode'>> {
    const { args, item, path } = visitorConfig;
    if (isRootNodeVisitor(moduleItem)) {
        return moduleItem;
    }
    if (typeof moduleItem === 'function') {
        const result = await promisify((moduleItem as UnknownFunction)(...args));
        if (isRootNodeVisitor(result)) {
            return result;
        }
    }
    throw new CliError(`Invalid visitor. Expected a visitor or a function returning a visitor.`, [
        `${pico.bold('Visitor')}: ${identifier}`,
        `${pico.bold('Path')}: ${path}`,
        ...(item ? [`${pico.bold('Item')}: ${item}`] : []),
    ]);
}

function isRootNodeVisitor(value: unknown): value is Visitor<unknown, 'rootNode'> {
    return !!value && typeof value === 'object' && 'visitRoot' in value;
}

function getVisitorIdentifier(visitorConfig: ParsedVisitorConfig): string {
    const { index, script } = visitorConfig;
    let identifier = `visitor #${index}`;
    identifier += script ? ` in script "${script}"` : '';
    return identifier;
}
