import { eslintCompatPlugin } from '@oxlint/plugins'

import { noChainedTypeAssertionsRule } from './rules/noChainedTypeAssertions.ts'
import { noConditionalEmptyObjectSpreadRule } from './rules/noConditionalEmptyObjectSpread.ts'
import { noReflectApplyRule } from './rules/noReflectApply.ts'
import { noReflectGetRule } from './rules/noReflectGet.ts'
import { noForbiddenTermInSymbolNamesRule } from './rules/noShapeInSymbolNames.ts'

// Vendored subset of https://github.com/dmmulroy/anti-slop.
const antiSlopPlugin = eslintCompatPlugin({
  meta: { name: 'anti-slop' },
  rules: {
    'no-chained-type-assertions': noChainedTypeAssertionsRule,
    'no-conditional-empty-object-spread': noConditionalEmptyObjectSpreadRule,
    'no-reflect-apply': noReflectApplyRule,
    'no-reflect-get': noReflectGetRule,
    'no-shape-in-symbol-names': noForbiddenTermInSymbolNamesRule,
  },
})

export default antiSlopPlugin
