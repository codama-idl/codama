import { getCodamaVersionMajor, type RootNode } from '@codama/nodes';
import { Command } from 'commander';
import pico from 'picocolors';

import { CliError, importOptionalDependency, isRootNode, logInfo, logSuccess, readJson, writeFile } from '../utils';

type Upgrade = (root: RootNode) => RootNode;

export function setUpgradeCommand(program: Command): void {
    program
        .command('upgrade')
        .argument('<idlPath>', 'Path to the Codama IDL file to upgrade')
        .argument('[outPath]', 'Path for the upgraded Codama IDL file. Defaults to overwriting the input file')
        .description('Upgrade a Codama IDL using the @codama/upgrade package of your project')
        .action(doUpgrade);
}

async function doUpgrade(idlPath: string, outPath?: string) {
    const idl = await readJson(idlPath);
    if (!isRootNode(idl)) {
        throw new CliError('Only Codama IDLs can be upgraded.', [
            `${pico.bold('Convert other IDLs with')}: ${pico.yellow(`codama convert ${idlPath} <outPath>`)}`,
        ]);
    }

    // The upgrade package is the user's own, so the major it upgrades to follows their Codama packages.
    const upgrade = await importOptionalDependency<Upgrade>({
        feature: 'IDL upgrade',
        from: '@codama/upgrade',
        installMessage: 'Upgrading Codama IDLs requires additional dependencies.',
        item: 'upgrade',
        npxCommandArgs: ['upgrade', idlPath, ...(outPath === undefined ? [] : [outPath])],
    });
    const upgraded = upgrade(idl);

    // Both majors come from the user's side, so the CLI stays independent of Codama spec versions.
    // Writing nothing keeps the file as is, rather than reformatting it or restamping its version.
    if (getCodamaVersionMajor(idl.version) === getCodamaVersionMajor(upgraded.version)) {
        logInfo(
            `The IDL is already on the latest major of the Codama spec (version ${idl.version}), so it was left untouched.`,
        );
        return;
    }

    const destination = outPath ?? idlPath;
    await writeFile(destination, JSON.stringify(upgraded, null, 2));
    logSuccess(`Upgraded the IDL to version ${upgraded.version}, written to ${destination}.`);
}
