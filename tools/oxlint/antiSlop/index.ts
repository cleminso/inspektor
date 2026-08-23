import { eslintCompatPlugin } from '@oxlint/plugins'

import { noChainedTypeAssertionsRule } from './rules/noChainedTypeAssertions'
import { noConditionalEmptyObjectSpreadRule } from './rules/noConditionalEmptyObjectSpread'
import { noReflectApplyRule } from './rules/noReflectApply'
import { noReflectGetRule } from './rules/noReflectGet'
import { noForbiddenTermInSymbolNamesRule } from './rules/noShapeInSymbolNames'

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
