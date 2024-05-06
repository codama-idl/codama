import {
    assertIsNestedTypeNode,
    fixedSizeTypeNode,
    isNestedTypeNode,
    NestedTypeNode,
    Node,
    NumberTypeNode,
    numberTypeNode,
    resolveNestedTypeNode,
    StringTypeNode,
    stringTypeNode,
    transformNestedTypeNode,
} from '../../src';

// [DESCRIBE] NestedTypeNode.
{
    // It constraints the nested type of a node.
    {
        const stringNestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 32);
        const numberNestedNode = fixedSizeTypeNode(numberTypeNode('u32'), 32);
        stringNestedNode satisfies NestedTypeNode<StringTypeNode>;
        numberNestedNode satisfies NestedTypeNode<NumberTypeNode>;
        // @ts-expect-error The nested type is not a number.
        stringNestedNode satisfies NestedTypeNode<NumberTypeNode>;
        // @ts-expect-error The nested type is not a string.
        numberNestedNode satisfies NestedTypeNode<StringTypeNode>;
    }
}

// [DESCRIBE] resolveNestedTypeNode.
{
    // It unwraps the nested type of a node.
    {
        const stringNestedNode = fixedSizeTypeNode(stringTypeNode('utf8'), 32);
        const numberNestedNode = fixedSizeTypeNode(numberTypeNode('u32'), 32);
        resolveNestedTypeNode(stringNestedNode) satisfies StringTypeNode;
        resolveNestedTypeNode(numberNestedNode) satisfies NumberTypeNode;
        // @ts-expect-error The nested type is not a number.
        resolveNestedTypeNode(stringNestedNode) satisfies NumberTypeNode;
        // @ts-expect-error The nested type is not a string.
        resolveNestedTypeNode(numberNestedNode) satisfies StringTypeNode;
    }
}

// [DESCRIBE] transformNestedTypeNode.
{
    // It transforms the nested type of a nested node.
    {
        const transformedNode = transformNestedTypeNode(fixedSizeTypeNode(stringTypeNode('utf8'), 32), () =>
            numberTypeNode('u32'),
        );
        transformedNode satisfies NestedTypeNode<NumberTypeNode>;
        // @ts-expect-error The nested type is not a number.
        transformedNode satisfies NestedTypeNode<StringTypeNode>;
    }
}

// [DESCRIBE] isNestedTypeNode.
{
    // It narrows the type of a node to a nested type node.
    {
        const node = {} as Node;
        if (isNestedTypeNode(node, 'numberTypeNode')) {
            node satisfies NestedTypeNode<NumberTypeNode>;
            // @ts-expect-error The nested type is not a string.
            node satisfies NestedTypeNode<StringTypeNode>;
        }
        if (isNestedTypeNode(node, 'stringTypeNode')) {
            node satisfies NestedTypeNode<StringTypeNode>;
            // @ts-expect-error The nested type is not a number.
            node satisfies NestedTypeNode<NumberTypeNode>;
        }
    }
}

// [DESCRIBE] assertIsNestedTypeNode.
{
    // It narrows the type of a node to a nested type node.
    {
        {
            const node = {} as Node;
            assertIsNestedTypeNode(node, 'numberTypeNode');
            node satisfies NestedTypeNode<NumberTypeNode>;
            // @ts-expect-error The nested type is not a string.
            node satisfies NestedTypeNode<StringTypeNode>;
        }
        {
            const node = {} as Node;
            assertIsNestedTypeNode(node, 'stringTypeNode');
            node satisfies NestedTypeNode<StringTypeNode>;
            // @ts-expect-error The nested type is not a number.
            node satisfies NestedTypeNode<NumberTypeNode>;
        }
    }
}
