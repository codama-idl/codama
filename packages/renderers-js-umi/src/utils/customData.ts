import {
    AccountNode,
    camelCase,
    CamelCaseString,
    DefinedTypeLinkNode,
    definedTypeLinkNode,
    DefinedTypeNode,
    definedTypeNode,
    InstructionNode,
    isNode,
    structTypeNodeFromInstructionArgumentNodes,
} from '@kinobi-so/nodes';

export type CustomDataOptions =
    | string
    | {
          extract?: boolean;
          extractAs?: string;
          importAs?: string;
          importFrom?: string;
          name: string;
      };

export type ParsedCustomDataOptions = Map<
    CamelCaseString,
    {
        extract: boolean;
        extractAs: CamelCaseString;
        importAs: CamelCaseString;
        importFrom: string;
        linkNode: DefinedTypeLinkNode;
    }
>;

export const parseCustomDataOptions = (
    customDataOptions: CustomDataOptions[],
    defaultSuffix: string,
): ParsedCustomDataOptions =>
    new Map(
        customDataOptions.map(o => {
            const options = typeof o === 'string' ? { name: o } : o;
            const importAs = camelCase(options.importAs ?? `${options.name}${defaultSuffix}`);
            const importFrom = options.importFrom ?? 'hooked';
            return [
                camelCase(options.name),
                {
                    extract: options.extract ?? false,
                    extractAs: options.extractAs ? camelCase(options.extractAs) : importAs,
                    importAs,
                    importFrom,
                    linkNode: definedTypeLinkNode(importAs),
                },
            ];
        }),
    );

export const getDefinedTypeNodesToExtract = (
    nodes: AccountNode[] | InstructionNode[],
    parsedCustomDataOptions: ParsedCustomDataOptions,
): DefinedTypeNode[] =>
    nodes.flatMap(node => {
        const options = parsedCustomDataOptions.get(node.name);
        if (!options || !options.extract) return [];

        if (isNode(node, 'accountNode')) {
            return [definedTypeNode({ name: options.extractAs, type: { ...node.data } })];
        }

        return [
            definedTypeNode({
                name: options.extractAs,
                type: structTypeNodeFromInstructionArgumentNodes(node.arguments),
            }),
        ];
    });
