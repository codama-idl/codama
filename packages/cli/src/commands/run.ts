import type { RootNode } from '@codama/nodes';
import { visit, type Visitor } from '@codama/visitors-core';
import { Command } from 'commander';
import pico from 'picocolors';

import { ScriptName } from '../config';
import { getParsedConfigFromCommand, ParsedConfig } from '../parsedConfig';
import {
    CliError,
    getRootNodeVisitors,
    installMissingDependencies,
    isLocalModulePath,
    logInfo,
    logSuccess,
    logWarning,
} from '../utils';

export function setRunCommand(program: Command): void {
    program
        .command('run')
        .argument('[scripts...]', 'The scripts to execute')
        .option('-a, --all', 'Run all scripts in the configuration file')
        .action(doRun);
}

type RunOptions = {
    all?: boolean;
};

async function doRun(explicitScripts: string[], { all }: RunOptions, cmd: Command) {
    if (all && explicitScripts.length > 0) {
        logWarning(`CLI arguments "${explicitScripts.join(' ')}" are ignored because the "--all" option is set.`);
    }
    const parsedConfig = await getParsedConfigFromCommand(cmd);
    const scripts = all ? Object.keys(parsedConfig.scripts) : explicitScripts;
    const plans = await getPlans(parsedConfig, scripts);
    runPlans(plans, parsedConfig.rootNode);
}

type RunPlan = {
    script: ScriptName | null;
    visitors: Visitor<RootNode, 'rootNode'>[];
};

async function getPlans(
    parsedConfig: Pick<ParsedConfig, 'before' | 'configPath' | 'scripts'>,
    scripts: ScriptName[],
): Promise<RunPlan[]> {
    const plans: RunPlan[] = [];
    if (scripts.length === 0 && parsedConfig.before.length === 0) {
        throw new CliError('There are no scripts or before visitors to run.');
    }

    checkMissingScripts(parsedConfig, scripts);
    await checkMissingDependencies(parsedConfig, scripts);

    if (parsedConfig.before.length > 0) {
        plans.push({ script: null, visitors: await getRootNodeVisitors(parsedConfig.before) });
    }

    for (const script of scripts) {
        plans.push({ script, visitors: await getRootNodeVisitors(parsedConfig.scripts[script]) });
    }

    return plans;
}

function runPlans(plans: RunPlan[], rootNode: RootNode): void {
    for (const plan of plans) {
        const result = runPlan(plan, rootNode);
        if (!plan.script) {
            rootNode = result;
        }
    }
}

function runPlan(plan: RunPlan, rootNode: RootNode): RootNode {
    const visitorLength = plan.visitors.length;
    const visitorPluralized = visitorLength === 1 ? 'visitor' : 'visitors';
    const identifier = plan.script
        ? `script "${plan.script}" with ${visitorLength} ${visitorPluralized}`
        : `${visitorLength} before ${visitorPluralized}`;
    logInfo(`Running ${identifier}...`);
    const newRoot = plan.visitors.reduce(visit, rootNode);
    logSuccess(`Executed ${identifier}!`);
    return newRoot;
}

function checkMissingScripts(parsedConfig: Pick<ParsedConfig, 'configPath' | 'scripts'>, scripts: ScriptName[]) {
    const missingScripts = scripts.filter(script => !parsedConfig.scripts[script]);
    if (missingScripts.length === 0) return;

    const scriptPluralized = missingScripts.length === 1 ? 'Script' : 'Scripts';
    const message = parsedConfig.configPath
        ? `${scriptPluralized} not found in configuration file.`
        : `${scriptPluralized} not found because no configuration file was found.`;
    const items = [
        `${pico.bold(scriptPluralized)}: ${missingScripts.join(', ')}`,
        ...(parsedConfig.configPath ? [`${pico.bold('Path')}: ${parsedConfig.configPath}`] : []),
    ];
    throw new CliError(message, items);
}

async function checkMissingDependencies(
    parsedConfig: Pick<ParsedConfig, 'before' | 'configPath' | 'scripts'>,
    scripts: ScriptName[],
) {
    const dependencies = new Set<string>([
        ...parsedConfig.before.map(v => v.path),
        ...scripts.flatMap(script => parsedConfig.scripts[script]?.map(v => v.path) ?? []),
    ]);
    const externalDependencies = [...dependencies].filter(dep => !isLocalModulePath(dep));
    const scriptsRequirePluralized = scripts.length === 1 ? 'script requires' : 'scripts require';
    const installed = await installMissingDependencies(
        `Your ${scriptsRequirePluralized} additional dependencies.`,
        externalDependencies,
    );
    if (!installed) {
        throw new CliError('Cannot proceed without missing dependencies.');
    }
}
