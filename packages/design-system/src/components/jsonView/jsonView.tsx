import * as stylex from "@stylexjs/stylex";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

import { CopyButton } from "../copyButton/copyButton";
import { jsonViewStyles } from "./jsonView.styles";

export type JsonViewPrimitive = string | number | boolean | null;

export interface JsonViewObject {
  readonly [key: string]: JsonViewValue;
}

export type JsonViewValue = JsonViewPrimitive | JsonViewObject | readonly JsonViewValue[];

export interface JsonViewProps {
  /** Contextual label for the JSON tree. */
  accessibilityLabel: string;
  /** JSON-compatible object or array to inspect. */
  data: JsonViewObject | readonly JsonViewValue[];
  /** Number of container levels expanded initially. */
  defaultExpandDepth?: 0 | 1 | 2;
  /** Literal terms highlighted in keys and primitive values. */
  searchTerms?: readonly string[];
}

const childBatchSize = 100;
const stringDisplayLimit = 4_000;
const visibleTreeItemLimit = 500;
const rootPath = "$";

type ContinuationKind = "batch" | "limit";

interface ContainerRenderPlan {
  continuationKind: ContinuationKind | null;
  visibleChildCount: number;
}

interface JsonRenderPlan {
  containers: ReadonlyMap<string, ContainerRenderPlan>;
  visiblePaths: ReadonlySet<string>;
}

interface DisplayedString {
  text: string;
  truncated: boolean;
}

interface JsonNodeProps {
  activePath: string;
  expandedPaths: ReadonlySet<string>;
  focusVisiblePath: string | null;
  keyName?: string;
  level: number;
  onActivePathChange: (path: string) => void;
  onChildBatchReveal: (path: string) => void;
  onFocusedPathChange: (path: string | null) => void;
  onStringReveal: (path: string) => void;
  onToggle: (path: string, item: HTMLElement) => void;
  path: string;
  position: number;
  revealedStrings: ReadonlySet<string>;
  renderPlan: ReadonlyMap<string, ContainerRenderPlan>;
  searchTerms: readonly string[];
  setSize: number;
  value: JsonViewValue;
}

interface SearchModel {
  expandedPaths: ReadonlySet<string>;
  firstMatchPath: string | undefined;
  matchCount: number;
  revealedChildCounts: ReadonlyMap<string, number>;
}

const emptySearchTerms: readonly string[] = [];

function isContainer(value: JsonViewValue): value is JsonViewObject | readonly JsonViewValue[] {
  return value !== null && typeof value === "object";
}

function getEntries(
  value: JsonViewObject | readonly JsonViewValue[],
): readonly [string, JsonViewValue][] {
  if (Array.isArray(value) === true) {
    return value.map((item, index) => [String(index), item] as const);
  }

  return Object.entries(value);
}

function getPath(parentPath: string, key: string): string {
  return `${parentPath}/${encodeURIComponent(key)}`;
}

function escapeJsonString(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function truncateString(value: string, codePointLimit: number): { text: string; truncated: boolean } {
  let codePointCount = 0;
  let endIndex = 0;

  while (endIndex < value.length && codePointCount < codePointLimit) {
    const codePoint = value.codePointAt(endIndex);
    endIndex += codePoint !== undefined && codePoint > 0xffff ? 2 : 1;
    codePointCount += 1;
  }

  return { text: value.slice(0, endIndex), truncated: endIndex < value.length };
}

function focusTreeItem(currentItem: HTMLElement, key: string): boolean {
  const tree = currentItem.closest('[role="tree"]');
  const items =
    tree === null ? [] : Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'));
  const index = items.indexOf(currentItem);
  const target =
    key === "ArrowDown"
      ? items[index + 1]
      : key === "ArrowUp"
        ? items[index - 1]
        : key === "Home"
          ? items[0]
          : key === "End"
            ? items.at(-1)
            : undefined;

  target?.focus();
  return target !== undefined;
}

function createInitialExpansion(
  data: JsonViewObject | readonly JsonViewValue[],
  defaultExpandDepth: 0 | 1 | 2,
): Set<string> {
  const paths = new Set<string>();

  function visit(value: JsonViewValue, path: string, depth: number): void {
    if (
      isContainer(value) === false ||
      getEntries(value).length === 0 ||
      depth >= defaultExpandDepth
    ) {
      return;
    }

    paths.add(path);
    for (const [key, child] of getEntries(value)) {
      visit(child, getPath(path, key), depth + 1);
    }
  }

  visit(data, rootPath, 0);
  return paths;
}

function includesSearchTerm(text: string, searchTerms: readonly string[]): boolean {
  const normalizedText = text.toLocaleLowerCase();
  return searchTerms.some(
    (term) => term.length > 0 && normalizedText.includes(term.toLocaleLowerCase()),
  );
}

function createSearchModel(
  data: JsonViewObject | readonly JsonViewValue[],
  searchTerms: readonly string[],
): SearchModel {
  if (searchTerms.some((term) => term.length > 0) === false) {
    return {
      expandedPaths: new Set(),
      firstMatchPath: undefined,
      matchCount: 0,
      revealedChildCounts: new Map(),
    };
  }

  const expandedPaths = new Set<string>();
  const revealedChildCounts = new Map<string, number>();
  let firstMatchPath: string | undefined;
  let matchCount = 0;

  function visit(value: JsonViewValue, path: string, keyName?: string): boolean {
    const container = isContainer(value);
    const keyMatches =
      keyName !== undefined && includesSearchTerm(escapeJsonString(keyName), searchTerms);
    const valueMatches =
      container === false &&
      includesSearchTerm(
        typeof value === "string"
          ? escapeJsonString(value)
          : value === null
            ? "null"
            : String(value),
        searchTerms,
      );
    const selfMatches = keyMatches || valueMatches;
    let descendantMatches = false;

    if (selfMatches === true) {
      matchCount += 1;
      firstMatchPath ??= path;
    }

    if (container === true) {
      for (const [index, [key, child]] of getEntries(value).entries()) {
        if (visit(child, getPath(path, key), key) === true) {
          descendantMatches = true;
          revealedChildCounts.set(path, Math.max(revealedChildCounts.get(path) ?? 0, index + 1));
        }
      }

      if (descendantMatches === true) {
        expandedPaths.add(path);
      }
    }

    return selfMatches || descendantMatches;
  }

  visit(data, rootPath);

  return {
    expandedPaths,
    firstMatchPath,
    matchCount,
    revealedChildCounts,
  };
}

function createRenderPlan(
  data: JsonViewObject | readonly JsonViewValue[],
  expandedPaths: ReadonlySet<string>,
  revealedChildCounts: ReadonlyMap<string, number>,
): JsonRenderPlan {
  const containers = new Map<string, ContainerRenderPlan>();
  const visiblePaths = new Set<string>([rootPath]);
  let remainingTreeItems = visibleTreeItemLimit - 1;

  function visit(value: JsonViewValue, path: string, reservedTreeItems: number): void {
    if (isContainer(value) === false || expandedPaths.has(path) === false) {
      return;
    }

    const entries = getEntries(value);
    const requestedChildCount = Math.min(
      revealedChildCounts.get(path) ?? childBatchSize,
      entries.length,
    );
    let visibleChildCount = 0;

    for (let index = 0; index < requestedChildCount; index += 1) {
      const entry = entries[index];
      if (entry === undefined) {
        break;
      }

      const hasFollowingEntry = index + 1 < entries.length;
      const continuationReserve = hasFollowingEntry === true ? 1 : 0;
      if (remainingTreeItems <= reservedTreeItems + continuationReserve) {
        break;
      }

      const [key, child] = entry;
      const childPath = getPath(path, key);
      remainingTreeItems -= 1;
      visibleChildCount += 1;
      visiblePaths.add(childPath);
      visit(child, childPath, reservedTreeItems + continuationReserve);
    }

    let continuationKind: ContinuationKind | null = null;
    if (visibleChildCount < entries.length && remainingTreeItems > reservedTreeItems) {
      remainingTreeItems -= 1;
      continuationKind = visibleChildCount < requestedChildCount ? "limit" : "batch";
    }

    containers.set(path, { continuationKind, visibleChildCount });
  }

  visit(data, rootPath, 0);
  return { containers, visiblePaths };
}

function getDisplayedString(
  value: string,
  revealed: boolean,
  searchTerms: readonly string[],
): DisplayedString {
  if (revealed === true) {
    return { text: value, truncated: false };
  }

  const bounded = truncateString(value, stringDisplayLimit);
  const hiddenMatch =
    bounded.truncated === true &&
    searchTerms.some((term) => term.length > 0) === true &&
    includesSearchTerm(escapeJsonString(value), searchTerms) === true &&
    includesSearchTerm(escapeJsonString(bounded.text), searchTerms) === false;

  return hiddenMatch === true ? { text: value, truncated: false } : bounded;
}

function HighlightedText({ searchTerms, text }: { searchTerms: readonly string[]; text: string }) {
  const terms = searchTerms.filter((term) => term.length > 0);
  if (terms.length === 0) {
    return text;
  }

  const lowerText = text.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let matchIndex = -1;
    let matchLength = 0;

    for (const term of terms) {
      const index = lowerText.indexOf(term.toLocaleLowerCase(), cursor);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
        matchLength = term.length;
      }
    }

    if (matchIndex === -1) {
      parts.push(text.slice(cursor));
      break;
    }

    if (matchIndex > cursor) {
      parts.push(text.slice(cursor, matchIndex));
    }
    parts.push(
      <mark key={`${matchIndex}-${parts.length}`} {...stylex.props(jsonViewStyles.mark)}>
        {text.slice(matchIndex, matchIndex + matchLength)}
      </mark>,
    );
    cursor = matchIndex + matchLength;
  }

  return parts;
}

function PrimitiveValue({
  displayedString,
  path,
  searchTerms,
  value,
  onReveal,
}: {
  displayedString: DisplayedString | null;
  path: string;
  searchTerms: readonly string[];
  value: JsonViewPrimitive;
  onReveal: (path: string) => void;
}) {
  if (typeof value === "string") {
    const bounded = displayedString?.text ?? value;
    const truncated = displayedString?.truncated ?? false;
    const escaped = escapeJsonString(bounded);
    return (
      <>
        <span {...stylex.props(jsonViewStyles.string)}>
          &quot;
          <HighlightedText searchTerms={searchTerms} text={escaped} />
          {truncated === true ? "…" : null}&quot;
        </span>
        {truncated === true ? (
          <button
            aria-label="Show full string"
            onClick={() => onReveal(path)}
            tabIndex={-1}
            type="button"
            {...stylex.props(jsonViewStyles.inlineAction)}
          >
            Show full
          </button>
        ) : null}
      </>
    );
  }

  const text = value === null ? "null" : String(value);
  const valueStyle =
    value === null
      ? jsonViewStyles.null
      : typeof value === "number"
        ? jsonViewStyles.number
        : jsonViewStyles.boolean;

  return (
    <span {...stylex.props(valueStyle)}>
      <HighlightedText searchTerms={searchTerms} text={text} />
    </span>
  );
}

function JsonNode({
  activePath,
  expandedPaths,
  focusVisiblePath,
  keyName,
  level,
  onActivePathChange,
  onChildBatchReveal,
  onFocusedPathChange,
  onStringReveal,
  onToggle,
  path,
  position,
  revealedStrings,
  renderPlan,
  searchTerms,
  setSize,
  value,
}: JsonNodeProps) {
  const container = isContainer(value);
  const entries = container === true ? getEntries(value) : [];
  const expandable = entries.length > 0;
  const expanded = expandable === true && expandedPaths.has(path);
  const displayedString =
    typeof value === "string"
      ? getDisplayedString(value, revealedStrings.has(path), searchTerms)
      : null;
  const containerPunctuation = Array.isArray(value) === true ? ["[", "]"] : ["{", "}"];
  const name =
    keyName === undefined
      ? Array.isArray(value) === true
        ? "JSON array"
        : "JSON object"
      : container === true
        ? `${keyName}: ${Array.isArray(value) === true ? "array" : "object"}`
        : `${keyName}: ${
            displayedString === null
              ? value === null
                ? "null"
                : String(value)
              : `${displayedString.text}${displayedString.truncated === true ? "…" : ""}`
          }`;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.currentTarget !== event.target) {
      return;
    }

    const tree = event.currentTarget.closest('[role="tree"]');
    const items =
      tree === null ? [] : Array.from(tree.querySelectorAll<HTMLElement>('[role="treeitem"]'));
    const index = items.indexOf(event.currentTarget);
    let target: HTMLElement | undefined;

    if (event.key === "ArrowDown") {
      target = items[index + 1];
    } else if (event.key === "ArrowUp") {
      target = items[index - 1];
    } else if (event.key === "Home") {
      target = items[0];
    } else if (event.key === "End") {
      target = items.at(-1);
    } else if (event.key === "ArrowRight" && expandable === true) {
      if (expanded === false) {
        onToggle(path, event.currentTarget);
      } else {
        target = items[index + 1];
      }
    } else if (event.key === "ArrowLeft") {
      if (expanded === true) {
        onToggle(path, event.currentTarget);
      } else {
        target =
          event.currentTarget.parentElement?.closest<HTMLElement>('[role="treeitem"]') ?? undefined;
      }
    } else if (event.key === "Enter" || event.key === " ") {
      if (expandable === true) {
        onToggle(path, event.currentTarget);
      } else if (displayedString?.truncated === true) {
        onStringReveal(path);
      } else {
        return;
      }
    } else {
      return;
    }

    event.preventDefault();
    onFocusedPathChange(target?.dataset.jsonPath ?? path);
    if (target !== undefined) {
      onActivePathChange(target.dataset.jsonPath ?? rootPath);
      target.focus();
    }
  }

  const nodeRenderPlan = renderPlan.get(path);
  const visibleChildCount = nodeRenderPlan?.visibleChildCount ?? 0;
  const continuationKind = nodeRenderPlan?.continuationKind ?? null;
  const continuationPath = `${path}#continuation`;

  function handleRowClick(event: MouseEvent<HTMLDivElement>): void {
    if (expandable === false) {
      return;
    }

    const item = event.currentTarget.closest<HTMLElement>('[role="treeitem"]');
    if (item !== null) {
      onActivePathChange(path);
      item.focus();
      onFocusedPathChange(null);
      onToggle(path, item);
    }
  }

  return (
    <div
      aria-expanded={expandable === true ? expanded : undefined}
      aria-label={name}
      aria-level={level}
      aria-posinset={position}
      aria-setsize={setSize}
      data-json-path={path}
      onFocus={(event) => {
        if (event.currentTarget === event.target) {
          onActivePathChange(path);
          onFocusedPathChange(event.currentTarget.matches(":focus-visible") ? path : null);
        }
      }}
      onBlur={(event) => {
        if (event.currentTarget === event.target) {
          onFocusedPathChange(null);
        }
      }}
      onKeyDown={handleKeyDown}
      role="treeitem"
      tabIndex={activePath === path ? 0 : -1}
      {...stylex.props(jsonViewStyles.item)}
    >
      <div
        data-focus-visible={focusVisiblePath === path ? "true" : undefined}
        onClick={handleRowClick}
        onMouseDown={(event) => {
          if (expandable === true) {
            event.preventDefault();
            onFocusedPathChange(null);
          }
        }}
        {...stylex.props(
          jsonViewStyles.row,
          expandable === true && jsonViewStyles.interactiveRow,
          focusVisiblePath === path && jsonViewStyles.focusedRow,
        )}
      >
        <span {...stylex.props(jsonViewStyles.disclosureSlot)}>
          {expandable === true ? (
            <button
              aria-label={`${expanded === true ? "Collapse" : "Expand"} ${keyName ?? "JSON"}`}
              onClick={(event) => {
                event.stopPropagation();
                const item = event.currentTarget.closest<HTMLElement>('[role="treeitem"]');
                if (item !== null) {
                  onActivePathChange(path);
                  item.focus();
                  onFocusedPathChange(null);
                  onToggle(path, item);
                }
              }}
              tabIndex={-1}
              type="button"
              {...stylex.props(jsonViewStyles.disclosure)}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                {...stylex.props(jsonViewStyles.disclosureIcon)}
              >
                <path
                  d={expanded === true ? "m2.5 4 3.5 3.5L9.5 4" : "m4 2.5 3.5 3.5L4 9.5"}
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : null}
        </span>
        <span {...stylex.props(jsonViewStyles.content)}>
          {keyName === undefined ? null : (
            <>
              <span {...stylex.props(jsonViewStyles.key)}>
                &quot;
                <HighlightedText searchTerms={searchTerms} text={escapeJsonString(keyName)} />
                &quot;
              </span>
              <span {...stylex.props(jsonViewStyles.punctuation)}>: </span>
            </>
          )}
          {container === true ? (
            <span {...stylex.props(jsonViewStyles.punctuation)}>
              {expandable === true && expanded === false
                ? `${containerPunctuation[0]}…${containerPunctuation[1]}`
                : containerPunctuation[0]}
              {expandable === false ? containerPunctuation[1] : null}
            </span>
          ) : (
            <PrimitiveValue
              displayedString={displayedString}
              onReveal={onStringReveal}
              path={path}
              searchTerms={searchTerms}
              value={value}
            />
          )}
        </span>
      </div>
      {container === true && expanded === true ? (
        <div role="group" {...stylex.props(jsonViewStyles.group)}>
          {entries.slice(0, visibleChildCount).map(([key, child], index) => (
            <JsonNode
              activePath={activePath}
              expandedPaths={expandedPaths}
              focusVisiblePath={focusVisiblePath}
              key={key}
              keyName={key}
              level={level + 1}
              onActivePathChange={onActivePathChange}
              onChildBatchReveal={onChildBatchReveal}
              onFocusedPathChange={onFocusedPathChange}
              onStringReveal={onStringReveal}
              onToggle={onToggle}
              path={getPath(path, key)}
              position={index + 1}
              revealedStrings={revealedStrings}
              renderPlan={renderPlan}
              searchTerms={searchTerms}
              setSize={entries.length}
              value={child}
            />
          ))}
          {continuationKind !== null ? (
            <div
              aria-label={
                continuationKind === "batch"
                  ? `Show more ${keyName ?? "JSON"} items`
                  : `Visible limit reached in ${keyName ?? "JSON"}`
              }
              aria-level={level + 1}
              aria-posinset={visibleChildCount + 1}
              aria-setsize={entries.length}
              data-json-path={continuationPath}
              onFocus={(event) => {
                if (event.currentTarget === event.target) {
                  onActivePathChange(continuationPath);
                  onFocusedPathChange(continuationPath);
                }
              }}
              onBlur={(event) => {
                if (event.currentTarget === event.target) {
                  onFocusedPathChange(null);
                }
              }}
              onKeyDown={(event) => {
                if (
                  continuationKind === "batch" &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  onChildBatchReveal(path);
                } else if (focusTreeItem(event.currentTarget, event.key) === true) {
                  event.preventDefault();
                }
              }}
              role="treeitem"
              tabIndex={activePath === continuationPath ? 0 : -1}
              {...stylex.props(jsonViewStyles.item)}
            >
              <div {...stylex.props(jsonViewStyles.row)}>
                <span {...stylex.props(jsonViewStyles.disclosureSlot)} />
                {continuationKind === "batch" ? (
                  <button
                    aria-label="Show more items"
                    onClick={() => onChildBatchReveal(path)}
                    tabIndex={-1}
                    type="button"
                    {...stylex.props(jsonViewStyles.inlineAction)}
                  >
                    Show more
                  </button>
                ) : (
                  <span {...stylex.props(jsonViewStyles.limitMessage)}>Visible limit reached</span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {container === true && expandable === true && expanded === true ? (
        <div aria-hidden="true" {...stylex.props(jsonViewStyles.row)}>
          <span {...stylex.props(jsonViewStyles.disclosureSlot)} />
          <span {...stylex.props(jsonViewStyles.punctuation)}>{containerPunctuation[1]}</span>
        </div>
      ) : null}
    </div>
  );
}

export function JsonView({
  accessibilityLabel,
  data,
  defaultExpandDepth = 1,
  searchTerms = [],
}: JsonViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    createInitialExpansion(data, defaultExpandDepth),
  );
  const [activePath, setActivePath] = useState(rootPath);
  const [focusVisiblePath, setFocusVisiblePath] = useState<string | null>(null);
  const [revealedChildCounts, setRevealedChildCounts] = useState<ReadonlyMap<string, number>>(
    new Map(),
  );
  const [revealedStrings, setRevealedStrings] = useState<ReadonlySet<string>>(new Set());
  const treeRef = useRef<HTMLDivElement>(null);
  const serializedData = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const normalizedSearchTerms = searchTerms.length === 0 ? emptySearchTerms : searchTerms;
  const searchModel = useMemo(
    () => createSearchModel(data, normalizedSearchTerms),
    [data, normalizedSearchTerms],
  );
  const effectiveExpandedPaths = useMemo(
    () => new Set([...expandedPaths, ...searchModel.expandedPaths]),
    [expandedPaths, searchModel.expandedPaths],
  );
  const effectiveRevealedChildCounts = useMemo(() => {
    const next = new Map(revealedChildCounts);
    for (const [path, count] of searchModel.revealedChildCounts) {
      next.set(path, Math.max(next.get(path) ?? childBatchSize, count));
    }
    return next;
  }, [revealedChildCounts, searchModel.revealedChildCounts]);
  const renderPlan = useMemo(
    () => createRenderPlan(data, effectiveExpandedPaths, effectiveRevealedChildCounts),
    [data, effectiveExpandedPaths, effectiveRevealedChildCounts],
  );
  const hasActiveSearch = normalizedSearchTerms.some((term) => term.length > 0);
  const searchMatchLimited =
    searchModel.firstMatchPath !== undefined &&
    renderPlan.visiblePaths.has(searchModel.firstMatchPath) === false;

  useEffect(() => {
    if (searchModel.firstMatchPath === undefined) {
      return;
    }

    const match = Array.from(
      treeRef.current?.querySelectorAll<HTMLElement>("[data-json-path]") ?? [],
    ).find((item) => item.dataset.jsonPath === searchModel.firstMatchPath);
    match?.scrollIntoView?.({ block: "nearest" });
  }, [searchModel.firstMatchPath]);

  useEffect(() => {
    const tree = treeRef.current;
    if (tree === null) {
      return;
    }

    const activeItem = Array.from(tree.querySelectorAll<HTMLElement>("[data-json-path]")).find(
      (item) => item.dataset.jsonPath === activePath,
    );
    if (activeItem !== undefined) {
      return;
    }

    let recoveryPath = activePath.includes("#") ? activePath.slice(0, activePath.indexOf("#")) : activePath;
    let recoveryItem: HTMLElement | undefined;
    while (recoveryItem === undefined) {
      recoveryItem = Array.from(tree.querySelectorAll<HTMLElement>("[data-json-path]")).find(
        (item) => item.dataset.jsonPath === recoveryPath,
      );
      if (recoveryItem !== undefined || recoveryPath === rootPath) {
        break;
      }
      recoveryPath = recoveryPath.slice(0, recoveryPath.lastIndexOf("/")) || rootPath;
    }

    if (recoveryItem === undefined) {
      return;
    }

    setActivePath(recoveryPath);
    if (focusVisiblePath !== null) {
      setFocusVisiblePath(recoveryPath);
      recoveryItem.focus();
    } else if (document.activeElement === document.body) {
      recoveryItem.focus();
    }
  }, [activePath, focusVisiblePath, renderPlan]);

  function toggle(path: string, item: HTMLElement): void {
    const tree = item.closest('[role="tree"]');
    const focusedPath = tree?.contains(document.activeElement)
      ? document.activeElement?.closest<HTMLElement>("[data-json-path]")?.dataset.jsonPath
      : undefined;
    const collapsingFocusedDescendant =
      expandedPaths.has(path) && focusedPath !== undefined && focusedPath.startsWith(`${path}/`);

    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });

    if (collapsingFocusedDescendant === true) {
      setActivePath(path);
      item.focus();
    }
  }

  return (
    <div {...stylex.props(jsonViewStyles.root)}>
      {hasActiveSearch === true && searchModel.matchCount === 0 ? (
        <div role="status" {...stylex.props(jsonViewStyles.status)}>
          No matches
        </div>
      ) : searchMatchLimited === true ? (
        <div role="status" {...stylex.props(jsonViewStyles.status)}>
          Match outside visible limit
        </div>
      ) : null}
      <div {...stylex.props(jsonViewStyles.copyActionLayer)}>
        <div {...stylex.props(jsonViewStyles.copyAction)}>
          <CopyButton
            label="Copy JSON"
            size="s"
            textToCopy={serializedData}
            tooltipSide="bottom"
          />
        </div>
      </div>
      <div
        aria-label={accessibilityLabel}
        ref={treeRef}
        role="tree"
        {...stylex.props(jsonViewStyles.tree)}
      >
        <JsonNode
          activePath={activePath}
          expandedPaths={effectiveExpandedPaths}
          focusVisiblePath={focusVisiblePath}
          level={1}
          onActivePathChange={setActivePath}
          onChildBatchReveal={(path) => {
            setRevealedChildCounts((current) => {
              const next = new Map(current);
              next.set(path, (current.get(path) ?? childBatchSize) + childBatchSize);
              return next;
            });
          }}
          onFocusedPathChange={setFocusVisiblePath}
          onStringReveal={(path) => {
            setRevealedStrings((current) => new Set(current).add(path));
          }}
          onToggle={toggle}
          path={rootPath}
          position={1}
          revealedStrings={revealedStrings}
          renderPlan={renderPlan.containers}
          searchTerms={normalizedSearchTerms}
          setSize={1}
          value={data}
        />
      </div>
    </div>
  );
}
