import type { RootNode } from '@codama/nodes';
import pico from 'picocolors';

import { CliError } from './errors';
import { importModuleItem } from './import';
import { installMissingDependencies } from './packageInstall';
import { tryGetPackageJson } from './packageJson';

type RootNodeFromAnchor = (idl: unknown) => RootNode;
export type GetRootNodeFromIdlOptions = { npxCommandArgs?: string[] };

const NODES_FROM_ANCHOR = { from: '@codama/nodes-from-anchor', item: 'rootNodeFromAnchor' } as const;

export async function getRootNodeFromIdl(idl: unknown, options: GetRootNodeFromIdlOptions = {}): Promise<RootNode> {
    if (typeof idl !== 'object' || idl === null) {
        throw new CliError('Unexpected IDL content. Expected an object, got ' + typeof idl);
    }
    if (isRootNode(idl)) {
        return idl;
    }

    const rootNodeFromAnchor =
        (await tryImportRootNodeFromAnchor()) ?? (await resolveRootNodeFromAnchor(options.npxCommandArgs));
    return rootNodeFromAnchor(idl);
}

async function resolveRootNodeFromAnchor(npxCommandArgs: string[] = ['convert']): Promise<RootNodeFromAnchor> {
    if (!(await tryGetPackageJson())) {
        throw new CliError('Anchor IDL support is not available.', [
            `${pico.bold('Missing dependency')}: ${NODES_FROM_ANCHOR.from}`,
            'No package.json was found, so Codama did not install dependencies in this directory.',
            `${pico.bold('Re-run with')}: ${pico.yellow(getNpxCommand(npxCommandArgs))}`,
        ]);
    }

    return await installRootNodeFromAnchor();
}

function getNpxCommand(commandArgs: string[]): string {
    return ['npx', '-p', 'codama', '-p', NODES_FROM_ANCHOR.from, 'codama', ...commandArgs].join(' ');
}

async function installRootNodeFromAnchor(): Promise<RootNodeFromAnchor> {
    const hasNodesFromAnchor = await installMissingDependencies(
        'Anchor IDL detected. Additional dependencies are required to process Anchor IDLs.',
        [NODES_FROM_ANCHOR.from],
    );
    if (!hasNodesFromAnchor) {
        throw new CliError('Cannot proceed without Anchor IDL support.');
    }

    return await importModuleItem<RootNodeFromAnchor>(NODES_FROM_ANCHOR);
}

async function tryImportRootNodeFromAnchor(): Promise<RootNodeFromAnchor | undefined> {
    try {
        return await importModuleItem<RootNodeFromAnchor>(NODES_FROM_ANCHOR);
    } catch (error) {
        if (isMissingModuleError(error, NODES_FROM_ANCHOR.from)) return undefined;
        throw error;
    }
}

function isMissingModuleError(error: unknown, moduleName: string): boolean {
    for (let current: unknown = error; current != null; current = (current as { cause?: unknown }).cause) {
        const { code, message } = current as { code?: unknown; message?: unknown };
        const isModuleNotFound = code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND';
        const namesRequestedModule =
            typeof message === 'string' && (message.includes(`'${moduleName}'`) || message.includes(`"${moduleName}"`));
        if (isModuleNotFound && namesRequestedModule) return true;
    }
    return false;
}

export function isRootNode(value: unknown): value is RootNode {
    return (
        typeof value === 'object' &&
        value !== null &&
        (value as { standard?: string }).standard === 'codama' &&
        (value as { kind?: string }).kind === 'rootNode'
    );
}
