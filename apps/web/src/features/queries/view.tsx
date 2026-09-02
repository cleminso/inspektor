import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Accordion,
  Box,
  Button,
  JsonView,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ShellLayout,
  SwimlaneTimeline,
  Text,
  Tooltip,
  type JsonViewObject,
  type JsonViewValue,
} from '@inspector/ds'

import type { StoredConnection } from '@app/connections/connections'
import {
  getConnectionProfileToken,
  useInspectorSessionState,
} from '@app/providers/inspectorProvider'

import type { QuerySubscriptionGroup, QuerySubscriptionsCapture } from './querySubscriptions'
import {
  useQuerySubscriptionsTelemetry,
  type QuerySubscriptionsTelemetry,
} from './useQuerySubscriptionsTelemetry'

interface QuerySelection {
  captureId: string
  groupKey: string
}

interface SelectedQueryDetails {
  capture: Extract<QuerySubscriptionsCapture, { kind: 'success' }>
  group: QuerySubscriptionGroup
}

const captureTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  hour12: true,
  minute: '2-digit',
  second: '2-digit',
})

function formatCaptureHeaderTime(marker: number): string {
  return captureTimeFormatter
    .formatToParts(marker)
    .filter(({ type }) => type !== 'dayPeriod')
    .map(({ value }) => value)
    .join('')
    .trim()
}

function getCaptureMarker(capture: QuerySubscriptionsCapture): number {
  return capture.kind === 'success' ? capture.generatedAt : capture.attemptedAt
}

function findSelectedDetails(
  history: readonly QuerySubscriptionsCapture[],
  selection: QuerySelection | null,
): SelectedQueryDetails | null {
  if (selection === null) {
    return null
  }

  const capture = history.find(({ id }) => id === selection.captureId)
  if (capture?.kind !== 'success') {
    return null
  }

  const group = capture.groups.find(({ groupKey }) => groupKey === selection.groupKey)
  return group === undefined ? null : { capture, group }
}

function getQueryData(query: string): JsonViewObject | readonly JsonViewValue[] | null {
  let parsed: JsonViewValue
  try {
    parsed = JSON.parse(query) as JsonViewValue
  } catch {
    return null
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return parsed
  }
  return { value: parsed }
}

function getSchemaSourceScope(branches: readonly string[], environment: string) {
  const environmentPrefix = `${environment}-`
  const sources = branches.map((branch) => {
    const match = /^([0-9a-f]{12})-(.+)$/iu.exec(
      branch.startsWith(environmentPrefix) ? branch.slice(environmentPrefix.length) : '',
    )
    return match === null ? null : { schemaVersion: match[1]!, branch: match[2]! }
  })
  const first = sources[0]
  if (first === undefined || first === null) {
    return null
  }

  const schemaVersions: string[] = []
  for (const source of sources) {
    if (source === null || source.branch !== first.branch) {
      return null
    }
    schemaVersions.push(source.schemaVersion)
  }

  return {
    branch: first.branch,
    schemaVersions,
  }
}

function CenteredStatus({
  children,
  role = 'status',
}: {
  children: React.ReactNode
  role?: 'alert' | 'status'
}): React.ReactElement {
  return (
    <Box
      alignItems="center"
      backgroundColor="surface-background"
      flex={1}
      height="full"
      justifyContent="center"
      role={role}
    >
      <Box
        alignItems="center"
        flexDirection="column"
        gap="s"
      >
        {children}
      </Box>
    </Box>
  )
}

function ObservationRow({
  label,
  monospace = false,
  value,
}: {
  label: string
  monospace?: boolean
  value: React.ReactNode
}) {
  return (
    <Box
      alignItems="baseline"
      gap="s"
      justifyContent="between"
    >
      <Text
        color="muted"
        variant="caption"
      >
        {label}
      </Text>
      <Text
        align="right"
        monospace={monospace}
        tabularNums
        variant="caption"
      >
        {value}
      </Text>
    </Box>
  )
}

function QueryDetails({
  details,
  environment,
  onClose,
}: {
  details: SelectedQueryDetails
  environment: string
  onClose: () => void
}): React.ReactElement {
  const { capture, group } = details
  const queryData = useMemo(() => getQueryData(group.query), [group.query])
  const schemaSourceScope = getSchemaSourceScope(group.branches, environment)
  const marker = getCaptureMarker(capture)
  const groupKeyLabel =
    group.groupKey.length > 12 ? `${group.groupKey.slice(0, 12)}…` : group.groupKey

  return (
    <Box
      as="aside"
      aria-label="Query details"
      flex={1}
      flexDirection="column"
      height="full"
      minHeight={0}
      overflow="hidden"
    >
      <Box
        borderBottomWidth={1}
        borderColor="subtle"
        borderStyle="solid"
        flexShrink={0}
        height="control-height-xl"
        paddingHorizontal="s"
        alignItems="center"
      >
        <Text
          aria-label={group.groupKey}
          monospace
          truncate
          title={group.groupKey}
          variant="label"
        >
          {groupKeyLabel}
        </Text>
      </Box>
      <Box
        flex={1}
        flexDirection="column"
        gap="xs"
        minHeight={0}
        overflow="hidden"
        padding="xs"
      >
        <Accordion defaultValue={['observation']}>
          <Accordion.Item value="observation">
            <Accordion.Header level={2}>
              <Accordion.Trigger>OBSERVATION</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>
              <Box
                borderBottomWidth={1}
                borderColor="subtle"
                borderStyle="solid"
                gap="s"
                padding="s"
              >
                <Box
                  flex={1}
                  flexDirection="column"
                  gap="xxs"
                  minWidth={0}
                >
                  <Text
                    color="muted"
                    variant="caption"
                  >
                    Table
                  </Text>
                  <Text
                    monospace
                    truncate
                    variant="label"
                  >
                    {group.table}
                  </Text>
                </Box>
                <Box
                  alignItems="end"
                  flexDirection="column"
                  gap="xxs"
                >
                  <Text
                    color="muted"
                    variant="caption"
                  >
                    Subscriptions
                  </Text>
                  <Text
                    tabularNums
                    variant="label"
                  >
                    {group.count}
                  </Text>
                </Box>
              </Box>
              <Box
                flexDirection="column"
                gap="xs"
                padding="s"
              >
                <ObservationRow
                  label="Snapshot"
                  value={captureTimeFormatter.format(marker)}
                />
                <ObservationRow
                  label="Propagation"
                  value={group.propagation}
                />
                {group.branches.length === 0 ? (
                  <ObservationRow
                    label="Resolved sources"
                    value="Not reported"
                  />
                ) : schemaSourceScope === null ? (
                  <ObservationRow
                    label="Resolved sources"
                    monospace
                    value={group.branches.join(', ')}
                  />
                ) : (
                  <>
                    <ObservationRow
                      label="Resolved sources"
                      value={`${schemaSourceScope.schemaVersions.length} schema version${schemaSourceScope.schemaVersions.length === 1 ? '' : 's'}`}
                    />
                    <ObservationRow
                      label="Scope"
                      monospace
                      value={`${environment} / ${schemaSourceScope.branch}`}
                    />
                    <ObservationRow
                      label="Schema versions"
                      monospace
                      value={schemaSourceScope.schemaVersions.join(', ')}
                    />
                  </>
                )}
              </Box>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Box
          flex={1}
          minHeight={0}
          overflow="hidden"
        >
          <Accordion
            defaultValue={['query']}
            layout="fill"
          >
            <Accordion.Item value="query">
              <Accordion.Header level={2}>
                <Accordion.Trigger>QUERY</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>
                <Box padding="s">
                  {queryData === null ? (
                    <Text
                      as="pre"
                      monospace
                      wrap="wrap"
                    >
                      {group.query}
                    </Text>
                  ) : (
                    <JsonView
                      accessibilityLabel="Query JSON"
                      data={queryData}
                      defaultExpandDepth="all"
                    />
                  )}
                </Box>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Box>
      </Box>
      <Box
        borderColor="subtle"
        borderStyle="solid"
        borderTopWidth={1}
        flexShrink={0}
        padding="xs"
      >
        <Button
          aria-keyshortcuts="Escape"
          layout="fill"
          size="s"
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
      </Box>
    </Box>
  )
}

function QueryTimeline({
  refreshButtonRef,
  selectedCellRef,
  selection,
  telemetry,
  onSelect,
}: {
  refreshButtonRef: React.RefObject<HTMLButtonElement | null>
  selectedCellRef: React.RefObject<HTMLTableCellElement | null>
  selection: QuerySelection | null
  telemetry: QuerySubscriptionsTelemetry
  onSelect: (selection: QuerySelection) => void
}): React.ReactElement {
  const { history, refresh, state, timeline } = telemetry
  const isRefreshing = state.kind === 'refreshing'
  const staleHistory = state.kind === 'stale-history'

  return (
    <Box
      aria-busy={isRefreshing}
      flex={1}
      flexDirection="column"
      height="full"
      minHeight={0}
      overflow="hidden"
    >
      <Box
        aria-label="Query subscription controls"
        alignItems="center"
        backgroundColor="surface-background"
        borderBottomWidth={1}
        borderColor="subtle"
        borderStyle="solid"
        flexShrink={0}
        gap="s"
        height="control-height-xl"
        paddingHorizontal="s"
        role="toolbar"
        width="full"
      >
        <Box
          flex={1}
          minWidth={0}
        >
          {staleHistory === true ? (
            <Box role="alert">
              <Text color="error">
                Couldn't refresh query subscriptions. Showing retained history.
              </Text>
            </Box>
          ) : isRefreshing === true ? (
            <Box role="status">
              <Text color="muted">Refreshing query subscriptions…</Text>
            </Box>
          ) : null}
        </Box>
        <Button
          ref={refreshButtonRef}
          disabled={isRefreshing}
          size="s"
          variant="ghost"
          onClick={refresh}
        >
          Refresh
        </Button>
      </Box>
      {timeline.lanes.length === 0 ? (
        <Box
          alignItems="center"
          flex={1}
          justifyContent="center"
          role={isRefreshing === false && staleHistory === false ? 'status' : undefined}
        >
          <Text color="muted">
            {staleHistory === true
              ? 'Last successful snapshot contained no active query subscriptions'
              : 'No active query subscriptions'}
          </Text>
        </Box>
      ) : (
        <SwimlaneTimeline aria-label="Query subscriptions">
          <SwimlaneTimeline.Header label="Tables / queries">
            {history.map((capture) => {
              const marker = getCaptureMarker(capture)
              return (
                <time
                  dateTime={new Date(marker).toISOString()}
                  key={capture.id}
                >
                  {formatCaptureHeaderTime(marker)}
                </time>
              )
            })}
          </SwimlaneTimeline.Header>
          {timeline.lanes.map((lane) => (
            <SwimlaneTimeline.Lane key={lane.table}>
              <SwimlaneTimeline.LaneTrigger
                suffix={
                  <Tooltip.Root>
                    <Tooltip.Trigger render={<span>{lane.tracks.length}</span>} />
                    <Tooltip.Content>Unique query groups observed for this table</Tooltip.Content>
                  </Tooltip.Root>
                }
              >
                {lane.table}
              </SwimlaneTimeline.LaneTrigger>
              {lane.tracks.map((track) => (
                <SwimlaneTimeline.Track
                  key={track.groupKey}
                  label={track.groupKey}
                >
                  {track.cells.map((cell, index) => {
                    const capture = history[index]
                    const captureLabel =
                      capture === undefined
                        ? 'unknown time'
                        : captureTimeFormatter.format(getCaptureMarker(capture))
                    const labelPrefix = `${track.groupKey} at ${captureLabel}`
                    const isSelected =
                      selection?.captureId === cell.captureId &&
                      selection.groupKey === track.groupKey
                    return cell.state === 'present' ? (
                      <SwimlaneTimeline.Cell
                        key={cell.captureId}
                        label={`Open ${labelPrefix}`}
                        ref={isSelected === true ? selectedCellRef : undefined}
                        onActivate={() =>
                          onSelect({ captureId: cell.captureId, groupKey: track.groupKey })
                        }
                        selected={isSelected}
                        status="active"
                      />
                    ) : (
                      <SwimlaneTimeline.Cell
                        key={cell.captureId}
                        label={`${labelPrefix} was ${
                          cell.state === 'absent' ? 'absent' : 'unavailable'
                        }`}
                        status={cell.state === 'absent' ? 'inactive' : 'unknown'}
                      />
                    )
                  })}
                </SwimlaneTimeline.Track>
              ))}
            </SwimlaneTimeline.Lane>
          ))}
        </SwimlaneTimeline>
      )}
    </Box>
  )
}

function ConnectedQueriesView({ connection }: { connection: StoredConnection }) {
  const telemetry = useQuerySubscriptionsTelemetry(connection)
  const [selection, setSelection] = useState<QuerySelection | null>(null)
  const selectedCellRef = useRef<HTMLTableCellElement | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null)
  const selectedDetails = findSelectedDetails(telemetry.history, selection)
  const hasSelectedDetails = selectedDetails !== null
  const isSelectionMissing = selection !== null && selectedDetails === null
  const keepSelectedCellVisible = useCallback(() => {
    selectedCellRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [])

  useLayoutEffect(() => {
    if (isSelectionMissing === true) {
      setSelection(null)
      refreshButtonRef.current?.focus()
    }
  }, [isSelectionMissing])

  useLayoutEffect(() => {
    if (selection !== null) {
      keepSelectedCellVisible()
    }
  }, [keepSelectedCellVisible, selection])

  const selectQuery = (nextSelection: QuerySelection) => {
    if (
      selection?.captureId === nextSelection.captureId &&
      selection.groupKey === nextSelection.groupKey
    ) {
      setSelection(null)
      return
    }

    setSelection(nextSelection)
  }

  const closeDetails = useCallback(() => {
    const selectedCell = selectedCellRef.current
    const selectedButton = selectedCell?.querySelector('button') ?? null
    if (
      selectedCell?.isConnected === true &&
      selectedCell.closest('[hidden]') === null &&
      selectedButton !== null
    ) {
      selectedButton.focus()
    } else {
      refreshButtonRef.current?.focus()
    }
    setSelection(null)
  }, [])

  useEffect(() => {
    if (hasSelectedDetails === false) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        event.defaultPrevented === false &&
        event.isComposing === false
      ) {
        event.preventDefault()
        event.stopPropagation()
        closeDetails()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeDetails, hasSelectedDetails])

  let content: React.ReactNode
  if (telemetry.state.kind === 'initial-loading') {
    content = (
      <CenteredStatus>
        <Text color="muted">Loading query subscriptions…</Text>
      </CenteredStatus>
    )
  } else if (telemetry.state.kind === 'failed-initial-load') {
    content = (
      <CenteredStatus role="alert">
        <Text color="error">Couldn't load query subscriptions</Text>
        <Text color="muted">Check the connection and try again.</Text>
        <Button
          ref={refreshButtonRef}
          size="s"
          variant="secondary"
          onClick={telemetry.refresh}
        >
          Try again
        </Button>
      </CenteredStatus>
    )
  } else {
    content = (
      <QueryTimeline
        refreshButtonRef={refreshButtonRef}
        selectedCellRef={selectedCellRef}
        selection={selection}
        telemetry={telemetry}
        onSelect={selectQuery}
      />
    )
  }

  return (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel onResize={keepSelectedCellVisible}>{content}</ResizablePanel>
      {selectedDetails === null ? null : (
        <>
          <ResizableHandle />
          <ResizablePanel
            defaultSize={420}
            minSize={240}
          >
            <QueryDetails
              details={selectedDetails}
              environment={connection.env}
              onClose={closeDetails}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

export function QueriesView(): React.ReactElement {
  const { activeConnection } = useInspectorSessionState()

  let content: React.ReactNode
  if (activeConnection === null) {
    content = (
      <CenteredStatus>
        <Text color="muted">No active connection</Text>
      </CenteredStatus>
    )
  } else {
    content = (
      <ConnectedQueriesView
        connection={activeConnection}
        key={getConnectionProfileToken(activeConnection)}
      />
    )
  }

  return (
    <ShellLayout.Body>
      <ShellLayout.LeftDock>{null}</ShellLayout.LeftDock>
      <ShellLayout.View>{content}</ShellLayout.View>
    </ShellLayout.Body>
  )
}
