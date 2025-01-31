import type { RootNode } from '@codama/nodes';
import { visit, type Visitor } from '@codama/visitors-core';
import { Command } from 'commander';

import { ScriptName } from '../config';
import { getParsedConfigFromCommand, ParsedConfig } from '../parsedConfig';
import { getRootNodeVisitors, logInfo, logSuccess, logWarning } from '../utils';

export function setRunCommand(program: Command): void {
    program
        .command('run')
        .argument('[scripts...]', 'The scripts to execute')
        .option('-a, --all', 'Run all scripts in the config file')
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
        throw new Error('There are no scripts or before visitors to run.');
    }

    const missingScripts = scripts.filter(script => !parsedConfig.scripts[script]);
    if (missingScripts.length > 0) {
        const scriptPluralized = missingScripts.length === 1 ? 'Script' : 'Scripts';
        const missingScriptsIdentifier = `${scriptPluralized} "${missingScripts.join(', ')}"`;
        const message = parsedConfig.configPath
            ? `${missingScriptsIdentifier} not found in config file "${parsedConfig.configPath}"`
            : `${missingScriptsIdentifier} not found because no config file was found`;
        throw new Error(message);
    }

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
