import { KinobiVersion } from '@kinobi-so/node-types';

type Version = KinobiVersion;

export function getVersion(): Version {
    return __VERSION__ as Version;
}
