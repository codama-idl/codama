import { getPlatform, getVersion } from '@kinobi-so/nodes';

export function getInfo(): string {
    return `Platform: ${getPlatform()}, Version: ${getVersion()}`;
}
