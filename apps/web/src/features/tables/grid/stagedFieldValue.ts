export function resolveStagedFieldValue(
  sourceValues: Readonly<Record<string, unknown>>,
  stagedValues: Readonly<Record<string, unknown>> | undefined,
  fieldName: string,
): unknown {
  return stagedValues !== undefined && Object.hasOwn(stagedValues, fieldName)
    ? stagedValues[fieldName]
    : sourceValues[fieldName]
}
