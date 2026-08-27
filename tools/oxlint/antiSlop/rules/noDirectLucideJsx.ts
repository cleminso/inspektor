import { defineRule } from '@oxlint/plugins'
import type { ESTree, Scope, SourceCode, Variable } from '@oxlint/plugins'

function resolveVariable(
  sourceCode: SourceCode,
  node: ESTree.Node & { name: string },
): Variable | null {
  let scope: Scope | null = sourceCode.getScope(node)
  while (scope !== null) {
    const variable = scope.set.get(node.name)
    if (variable !== undefined) return variable
    scope = scope.upper
  }
  return null
}

function isLucideImport(variable: Variable | null): boolean {
  return (
    variable?.defs.some(
      (definition) =>
        definition.type === 'ImportBinding' &&
        (definition.node.type === 'ImportSpecifier' ||
          definition.node.type === 'ImportNamespaceSpecifier') &&
        definition.node.parent.type === 'ImportDeclaration' &&
        definition.node.parent.source.value === 'lucide-react',
    ) === true
  )
}

function getRootObject(node: ESTree.JSXMemberExpression): ESTree.JSXIdentifier {
  let current = node.object
  while (current.type === 'JSXMemberExpression') current = current.object
  return current
}

export const noDirectLucideJsxRule = defineRule({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require Lucide icons to pass through a design-system artwork prop.',
    },
    messages: {
      direct: 'Pass Lucide icons to a design-system `artwork` prop instead of using them directly.',
    },
  },
  createOnce(context) {
    return {
      JSXOpeningElement(node) {
        const identifier =
          node.name.type === 'JSXIdentifier'
            ? node.name
            : node.name.type === 'JSXMemberExpression'
              ? getRootObject(node.name)
              : null
        if (
          identifier !== null &&
          isLucideImport(resolveVariable(context.sourceCode, identifier))
        ) {
          context.report({ node: node.name, messageId: 'direct' })
        }
      },
    }
  },
})
