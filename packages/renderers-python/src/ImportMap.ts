import { logWarn } from '@codama/errors';
import { LinkNodeType, type LinkNode } from '@codama/nodes';

export type LinkDestination = 'accounts' | 'definedTypes' | 'errors' | 'instructions' | 'pdas' | 'programs' | 'resolvers';

export type LinkOverrides = Partial<Record<LinkDestination, Record<string, string>>>;

export class ImportMap {
  private _linkMap = new Map<string, Set<string>>();

  constructor(
    private readonly _overrides: LinkOverrides = {},
    private readonly _dependencyMap: Record<string, string> = {},
  ) {}

  addFromLinkNode(node: LinkNode): void {
    const nodeName = node.name;
    const name = nodeName.replace(/^@[^/]+\//, '');
    const destination = this.getPathDestination(nodeName);

    if (!destination) {
      logWarn(`Could not find path destination for ${nodeName}`);
      return;
    }

    this.add(destination, name);
  }

  add(destination: string, name: string): void {
    const currentNames = this._linkMap.get(destination) ?? new Set<string>();
    currentNames.add(name);
    this._linkMap.set(destination, currentNames);
  }

  getPathDestination(name: string): string | null {
    if (name.startsWith('@')) {
      return this.getImportAliasPath(name);
    }

    for (const [destination, names] of Object.entries(this._overrides)) {
      if (names && Object.hasOwn(names, name)) {
        return names[name];
      }
    }

    return this.getDefaultPathDestination(name);
  }

  private getImportAliasPath(name: string): string | null {
    const aliasMatch = name.match(/^@([^/]+)\//);
    if (aliasMatch && aliasMatch[1] && this._dependencyMap[aliasMatch[1]]) {
      return this._dependencyMap[aliasMatch[1]];
    }
    return null;
  }

  private getDefaultPathDestination(name: string): string | null {
    const type = this.getLinkDestinationByName(name);
    if (type === 'programs') return 'programs';
    if (type === 'accounts') return 'accounts';
    if (type === 'instructions') return 'instructions';
    if (type === 'pdas') return 'pdas';
    if (type === 'definedTypes') return 'types';
    if (type === 'errors') return 'errors';
    if (type === 'resolvers') return 'resolvers';
    return null;
  }

  private getLinkDestinationByName(name: string): LinkDestination | null {
    for (const [destination, overrides] of Object.entries(this._overrides)) {
      if (overrides && Object.keys(overrides).includes(name)) {
        return destination as LinkDestination;
      }
    }
    return null;
  }

  get imports(): Record<string, string[]> {
    const imports: Record<string, string[]> = {};
    for (const [destination, names] of this._linkMap.entries()) {
      imports[destination] = [...names].sort();
    }
    return imports;
  }
} 