import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JsonView } from "./jsonView";

afterEach(cleanup);

function getTreeItem(name: RegExp): HTMLElement {
  return screen.getByRole("treeitem", { name });
}

function getRootTreeItem(): HTMLElement {
  const root = screen.getAllByRole("treeitem")[0];

  if (root === undefined) {
    throw new Error("Expected a root tree item");
  }

  return root;
}

function getDisclosure(item: HTMLElement): HTMLButtonElement {
  const disclosure = item.querySelector("button");

  if (disclosure === null) {
    throw new Error(`Expected a disclosure button for ${item.getAttribute("aria-label")}`);
  }

  return disclosure;
}

function expectFocused(item: HTMLElement): void {
  expect(document.activeElement).toBe(item);
}

describe("JsonView", () => {
  it("updates query text urgently while deferring search traversal", async () => {
    const onResultsChange = vi.fn();

    function SearchHarness() {
      const [query, setQuery] = useState("Ada");

      return (
        <>
          <input
            aria-label="Find JSON"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <JsonView
            accessibilityLabel="Deferred search"
            data={{ first: "Ada", second: "Grace" }}
            search={{ activeMatchIndex: 0, onResultsChange, query }}
          />
        </>
      );
    }

    const { container } = render(<SearchHarness />);
    const input = screen.getByRole("textbox", { name: "Find JSON" });

    fireEvent.change(input, { target: { value: "Grace" } });

    expect(onResultsChange).toHaveBeenCalledWith(expect.objectContaining({ pending: true }));
    await waitFor(() => expect(container.querySelector("mark")?.textContent).toBe("Grace"));
    await waitFor(() =>
      expect(onResultsChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ pending: false }),
      ),
    );
  });

  it("renders an expanded object with JSON punctuation and every primitive type", () => {
    render(
      <JsonView
        accessibilityLabel="Row data"
        data={{
          name: "Ada",
          count: 3,
          active: true,
          archived: false,
          optional: null,
        }}
      />,
    );

    const tree = screen.getByRole("tree", { name: "Row data" });

    expect(tree.textContent).toContain("{");
    expect(tree.textContent).toContain("}");
    expect(tree.textContent).toContain('"name"');
    expect(tree.textContent).toContain('"Ada"');
    expect(tree.textContent).toContain("3");
    expect(tree.textContent).toContain("true");
    expect(tree.textContent).toContain("false");
    expect(tree.textContent).toContain("null");
    expect(getRootTreeItem().getAttribute("aria-expanded")).toBe("true");
  });

  it("copies the complete formatted JSON from a sticky action outside the tree", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(
      <JsonView
        accessibilityLabel="Row JSON"
        data={{ profile: { name: "Ada" }, active: true }}
      />,
    );

    const tree = screen.getByRole("tree", { name: "Row JSON" });
    const root = getRootTreeItem();
    const copyButton = screen.getByRole("button", { name: "Copy JSON" });

    expect(tree.contains(copyButton)).toBe(false);
    fireEvent.click(copyButton);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        [
          "{",
          '  "profile": {',
          '    "name": "Ada"',
          "  },",
          '  "active": true',
          "}",
        ].join("\n"),
      ),
    );
    expect(root.getAttribute("aria-expanded")).toBe("true");
  });

  it("escapes string keys and values as valid JSON text", () => {
    render(
      <JsonView
        accessibilityLabel="Escaped JSON"
        data={{ 'quoted"key': 'line one\n"line two"' }}
      />,
    );

    const tree = screen.getByRole("tree", { name: "Escaped JSON" });

    expect(tree.textContent).toContain('"quoted\\"key"');
    expect(tree.textContent).toContain('"line one\\n\\"line two\\""');
  });

  it("renders an expanded array with indices, delimiters, and ordered values", () => {
    render(<JsonView accessibilityLabel="Array data" data={["first", 2, false, null]} />);

    const tree = screen.getByRole("tree", { name: "Array data" });
    const items = screen.getAllByRole("treeitem");

    expect(tree.textContent).toContain("[");
    expect(tree.textContent).toContain("]");
    expect(tree.textContent).toContain('"first"');
    expect(items).toHaveLength(5);
    expect(items.slice(1).map((item) => item.getAttribute("aria-posinset"))).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("renders empty containers inline without disclosure state", () => {
    render(
      <JsonView
        accessibilityLabel="Empty values"
        data={{ emptyObject: {}, emptyArray: [], emptyString: "" }}
      />,
    );

    const emptyObject = getTreeItem(/emptyObject/i);
    const emptyArray = getTreeItem(/emptyArray/i);
    const emptyString = getTreeItem(/emptyString/i);

    expect(emptyObject.textContent).toContain("{}");
    expect(emptyArray.textContent).toContain("[]");
    expect(emptyString.textContent).toContain('""');
    expect(emptyObject.hasAttribute("aria-expanded")).toBe(false);
    expect(emptyArray.hasAttribute("aria-expanded")).toBe(false);
    expect(emptyObject.querySelector("button")).toBeNull();
    expect(emptyArray.querySelector("button")).toBeNull();
  });

  it("uses expansion depth one by default", () => {
    render(
      <JsonView
        accessibilityLabel="Default depth"
        data={{ profile: { name: "Ada" }, tags: ["admin"] }}
      />,
    );

    expect(getRootTreeItem().getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/profile/i).getAttribute("aria-expanded")).toBe("false");
    expect(getTreeItem(/tags/i).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("treeitem", { name: /name/i })).toBeNull();
    expect(screen.queryByText('"admin"')).toBeNull();
  });

  it("supports initial expansion depths zero, one, and two", () => {
    const data = { profile: { contact: { email: "ada@example.com" } } };
    const { rerender } = render(
      <JsonView accessibilityLabel="Depth zero" data={data} defaultExpandDepth={0} />,
    );

    expect(screen.getAllByRole("treeitem")).toHaveLength(1);
    expect(getRootTreeItem().getAttribute("aria-expanded")).toBe("false");

    rerender(
      <JsonView key="depth-one" accessibilityLabel="Depth one" data={data} defaultExpandDepth={1} />,
    );

    expect(getRootTreeItem().getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/profile/i).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("treeitem", { name: /contact/i })).toBeNull();

    rerender(
      <JsonView key="depth-two" accessibilityLabel="Depth two" data={data} defaultExpandDepth={2} />,
    );

    expect(getTreeItem(/profile/i).getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/contact/i).getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("treeitem", { name: /email/i })).toBeNull();
  });

  it("keeps user expansion when equivalent data receives a new identity", () => {
    const { rerender } = render(
      <JsonView accessibilityLabel="Stable expansion" data={{ profile: { name: "Ada" } }} />,
    );
    const profile = getTreeItem(/profile/i);

    fireEvent.click(within(profile).getByText('"profile"'));
    expect(profile.getAttribute("aria-expanded")).toBe("true");

    rerender(
      <JsonView accessibilityLabel="Stable expansion" data={{ profile: { name: "Ada" } }} />,
    );

    expect(getTreeItem(/profile/i).getAttribute("aria-expanded")).toBe("true");
  });

  it("toggles a container from its complete pointer row", () => {
    render(
      <JsonView
        accessibilityLabel="Pointer disclosure"
        data={{ profile: { name: "Ada" } }}
        defaultExpandDepth={1}
      />,
    );

    const profile = getTreeItem(/profile/i);
    fireEvent.click(within(profile).getByText('"profile"'));
    expect(profile.getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/name/i)).toBeTruthy();

    fireEvent.click(within(profile).getByText('"profile"'));
    expect(profile.getAttribute("aria-expanded")).toBe("false");
  });

  it("prevents repeated pointer presses from selecting expandable row text", () => {
    render(
      <JsonView
        accessibilityLabel="Pointer selection"
        data={{ profile: { name: "Ada" } }}
        defaultExpandDepth={1}
      />,
    );

    const profileKey = within(getTreeItem(/profile/i)).getByText('"profile"');

    expect(fireEvent.mouseDown(profileKey, { detail: 2 })).toBe(false);
  });

  it("shows row focus only for keyboard navigation, not pointer disclosure", () => {
    render(
      <JsonView
        accessibilityLabel="Focus visibility"
        data={{ profile: { name: "Ada" }, active: true }}
        defaultExpandDepth={1}
      />,
    );

    const root = getRootTreeItem();
    const profile = getTreeItem(/profile/i);
    const profileKey = within(profile).getByText('"profile"');

    fireEvent.click(profileKey);
    expect(profile.querySelector('[data-focus-visible="true"]')).toBeNull();

    root.focus();
    fireEvent.keyDown(root, { key: "ArrowDown" });
    expect(profile.querySelector('[data-focus-visible="true"]')).toBeTruthy();
  });

  it("exposes complete WAI-ARIA tree structure and logical sibling metadata", () => {
    render(
      <JsonView
        accessibilityLabel="Account JSON"
        data={{ profile: { name: "Ada" }, active: true, roles: ["admin", "owner"] }}
        defaultExpandDepth={2}
      />,
    );

    const tree = screen.getByRole("tree", { name: "Account JSON" });
    const root = getRootTreeItem();
    const profile = getTreeItem(/profile/i);
    const active = getTreeItem(/active/i);
    const roles = getTreeItem(/roles/i);

    expect(root.getAttribute("aria-level")).toBe("1");
    expect(root.getAttribute("aria-posinset")).toBe("1");
    expect(root.getAttribute("aria-setsize")).toBe("1");
    expect(profile.getAttribute("aria-level")).toBe("2");
    expect(profile.getAttribute("aria-posinset")).toBe("1");
    expect(profile.getAttribute("aria-setsize")).toBe("3");
    expect(active.getAttribute("aria-posinset")).toBe("2");
    expect(roles.getAttribute("aria-posinset")).toBe("3");
    expect(profile.getAttribute("aria-expanded")).toBe("true");
    expect(active.hasAttribute("aria-expanded")).toBe(false);
    expect(within(tree).getAllByRole("group")).toHaveLength(3);
    expect(tree.querySelector('[aria-selected="true"]')).toBeNull();
  });

  it("keeps one roving Tab stop while Arrow, Home, and End navigate visible items", () => {
    render(
      <JsonView
        accessibilityLabel="Keyboard tree"
        data={{ profile: { name: "Ada", address: { city: "London" } }, active: true }}
        defaultExpandDepth={1}
      />,
    );

    const root = getRootTreeItem();
    const profile = getTreeItem(/profile/i);
    const active = getTreeItem(/active/i);

    expect(screen.getAllByRole("treeitem").filter((item) => item.tabIndex === 0)).toEqual([root]);
    expect(screen.getAllByRole("treeitem").filter((item) => item.tabIndex === -1)).toHaveLength(2);

    root.focus();
    fireEvent.keyDown(root, { key: "ArrowDown" });
    expectFocused(profile);

    fireEvent.keyDown(profile, { key: "ArrowRight" });
    expect(profile.getAttribute("aria-expanded")).toBe("true");
    expectFocused(profile);

    fireEvent.keyDown(profile, { key: "ArrowRight" });
    expectFocused(getTreeItem(/name/i));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expectFocused(getTreeItem(/address/i));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowLeft" });
    expectFocused(profile);

    fireEvent.keyDown(profile, { key: "End" });
    expectFocused(active);

    fireEvent.keyDown(active, { key: "Home" });
    expectFocused(root);
    expect(screen.getAllByRole("treeitem").filter((item) => item.tabIndex === 0)).toEqual([root]);
  });

  it("toggles the focused container with Enter and Space", () => {
    render(
      <JsonView
        accessibilityLabel="Toggle tree"
        data={{ profile: { name: "Ada" } }}
        defaultExpandDepth={1}
      />,
    );

    const profile = getTreeItem(/profile/i);
    profile.focus();

    fireEvent.keyDown(profile, { key: "Enter" });
    expect(profile.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(profile, { key: " " });
    expect(profile.getAttribute("aria-expanded")).toBe("false");
    expectFocused(profile);
  });

  it("recovers focus to an ancestor collapsed while its descendant is focused", () => {
    render(
      <JsonView
        accessibilityLabel="Focus recovery"
        data={{ profile: { name: "Ada" }, active: true }}
        defaultExpandDepth={2}
      />,
    );

    const profile = getTreeItem(/profile/i);
    getTreeItem(/name/i).focus();

    fireEvent.click(getDisclosure(profile));

    expect(profile.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("treeitem", { name: /name/i })).toBeNull();
    expectFocused(profile);
    expect(profile.tabIndex).toBe(0);
  });

  it("recovers focus within the tree that owns the collapsed branch", () => {
    render(
      <>
        <JsonView
          accessibilityLabel="First tree"
          data={{ profile: { name: "First" } }}
          defaultExpandDepth={2}
        />
        <JsonView
          accessibilityLabel="Second tree"
          data={{ profile: { name: "Second" } }}
          defaultExpandDepth={2}
        />
      </>,
    );

    const secondTree = screen.getByRole("tree", { name: "Second tree" });
    const secondProfile = within(secondTree).getByRole("treeitem", { name: /profile/i });
    within(secondTree)
      .getByRole("treeitem", { name: /name: Second/i })
      .focus();

    fireEvent.click(getDisclosure(secondProfile));

    expectFocused(secondProfile);
  });

  it("reports and highlights ordered literal occurrences", async () => {
    const onResultsChange = vi.fn();
    const { container } = render(
      <JsonView
        accessibilityLabel="Search results"
        data={{ "profile.name": "Ada.Lovelace", untouched: "No match" }}
        search={{ query: ".", activeMatchIndex: 1, onResultsChange }}
      />,
    );

    const marks = Array.from(container.querySelectorAll("mark"));

    expect(marks).toHaveLength(2);
    expect(marks.map((mark) => mark.textContent)).toEqual([".", "."]);
    expect(marks[0]?.hasAttribute("data-active")).toBe(false);
    expect(marks[1]?.hasAttribute("data-active")).toBe(true);
    expect(getTreeItem(/profile\.name/i).textContent).toContain('"profile.name"');
    expect(getTreeItem(/profile\.name/i).textContent).toContain('"Ada.Lovelace"');
    expect(getTreeItem(/untouched/i).querySelector("mark")).toBeNull();
    await waitFor(() => {
      expect(onResultsChange).toHaveBeenLastCalledWith({ activeIndex: 1, count: 2, pending: false });
    });
  });

  it("supports case-sensitive, whole-word, and regular-expression searches", async () => {
    const onResultsChange = vi.fn();
    const { container, rerender } = render(
      <JsonView
        accessibilityLabel="Search options"
        data={{ message: "User username user_01 user_02" }}
        search={{
          query: "User",
          activeMatchIndex: 0,
          caseSensitive: true,
          wholeWord: false,
          regularExpression: false,
          onResultsChange,
        }}
      />,
    );

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      "User",
    ]);
    await waitFor(() => {
      expect(onResultsChange).toHaveBeenLastCalledWith({ activeIndex: 0, count: 1, pending: false });
    });

    rerender(
      <JsonView
        accessibilityLabel="Search options"
        data={{ message: "User username user_01 user_02" }}
        search={{
          query: "user",
          activeMatchIndex: 0,
          caseSensitive: false,
          wholeWord: true,
          regularExpression: false,
          onResultsChange,
        }}
      />,
    );

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      "User",
    ]);

    rerender(
      <JsonView
        accessibilityLabel="Search options"
        data={{ message: "User username user-01 user-02" }}
        search={{
          query: "user-\\d+",
          activeMatchIndex: 0,
          caseSensitive: false,
          wholeWord: false,
          regularExpression: true,
          onResultsChange,
        }}
      />,
    );

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      "user-01",
      "user-02",
    ]);

    rerender(
      <JsonView
        accessibilityLabel="Search options"
        data={{ message: "User username user-01 user-02" }}
        search={{
          query: "[",
          activeMatchIndex: 0,
          caseSensitive: false,
          wholeWord: false,
          regularExpression: true,
          onResultsChange,
        }}
      />,
    );

    expect(container.querySelector("mark")).toBeNull();
    await waitFor(() => {
      expect(onResultsChange).toHaveBeenLastCalledWith({ activeIndex: null, count: 0, pending: false });
    });
  });

  it("wraps an active occurrence index outside the result range", async () => {
    const onResultsChange = vi.fn();
    const { container } = render(
      <JsonView
        accessibilityLabel="Wrapped search results"
        data={{ message: "match match" }}
        search={{ query: "match", activeMatchIndex: -1, onResultsChange }}
      />,
    );

    const marks = Array.from(container.querySelectorAll("mark"));
    expect(marks).toHaveLength(2);
    expect(marks[0]?.hasAttribute("data-active")).toBe(false);
    expect(marks[1]?.hasAttribute("data-active")).toBe(true);
    await waitFor(() => {
      expect(onResultsChange).toHaveBeenLastCalledWith({ activeIndex: 1, count: 2, pending: false });
    });
  });

  it("opens collapsed ancestors to expose a search match without moving focus", () => {
    render(
      <JsonView
        accessibilityLabel="Collapsed search"
        data={{ profile: { contact: { email: "needle@example.com" } } }}
        defaultExpandDepth={0}
        search={{ query: "needle", activeMatchIndex: 0, onResultsChange: () => undefined }}
      />,
    );

    expect(getRootTreeItem().getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/profile/i).getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/contact/i).getAttribute("aria-expanded")).toBe("true");
    expect(getTreeItem(/email/i).querySelector("mark")?.textContent).toBe("needle");
    expect(document.activeElement).toBe(document.body);
  });

  it("reports when an active search has no matches", async () => {
    const onResultsChange = vi.fn();
    render(
      <JsonView
        accessibilityLabel="No search results"
        data={{ profile: { name: "Ada" } }}
        search={{ query: "missing", activeMatchIndex: 0, onResultsChange }}
      />,
    );

    await waitFor(() => {
      expect(onResultsChange).toHaveBeenLastCalledWith({ activeIndex: null, count: 0, pending: false });
    });
  });

  it("bounds expanded children and reveals them through keyboard-ordered continuation nodes", () => {
    const data = Object.fromEntries(
      Array.from({ length: 500 }, (_, index) => [`field-${index}`, index]),
    );
    render(<JsonView accessibilityLabel="Large object" data={data} />);

    const initialItems = screen.getAllByRole("treeitem");
    const first = getTreeItem(/field-0/i);
    const continuation = screen.getByRole("treeitem", { name: /show more/i });
    const showMore = within(continuation).getByRole("button", { name: /show more/i });

    expect(initialItems.length).toBeLessThan(501);
    expect(first.getAttribute("aria-posinset")).toBe("1");
    expect(first.getAttribute("aria-setsize")).toBe("500");
    expect(continuation.getAttribute("aria-level")).toBe("2");
    expect(continuation.tabIndex).toBe(-1);

    fireEvent.click(showMore);

    const secondBatchItems = screen.getAllByRole("treeitem");
    expect(secondBatchItems.length).toBeGreaterThan(initialItems.length);
    expect(secondBatchItems.length).toBeLessThan(501);

    fireEvent.click(screen.getByRole("button", { name: /show more items/i }));

    expect(screen.getAllByRole("treeitem").length).toBeGreaterThan(secondBatchItems.length);
    expect(screen.getAllByRole("treeitem").length).toBeLessThanOrEqual(500);
  });

  it("bounds the complete visible tree across simultaneously expanded branches", () => {
    const data = Object.fromEntries(
      Array.from({ length: 10 }, (_, groupIndex) => [
        `group-${groupIndex}`,
        Object.fromEntries(
          Array.from({ length: 100 }, (_, fieldIndex) => [
            `group-${groupIndex}-field-${fieldIndex}`,
            fieldIndex,
          ]),
        ),
      ]),
    );
    render(
      <JsonView accessibilityLabel="Wide expanded tree" data={data} defaultExpandDepth={2} />,
    );

    expect(screen.getAllByRole("treeitem").length).toBeLessThanOrEqual(500);
    const limitItems = screen.getAllByRole("treeitem", { name: /visible limit reached/i });
    expect(limitItems.length).toBeGreaterThan(0);
    expect(within(limitItems[0] as HTMLElement).queryByRole("button")).toBeNull();
    expect(screen.queryByRole("treeitem", { name: /group-4-field-99/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Collapse group-0" }));

    expect(screen.getByRole("treeitem", { name: /group-4-field-99/i })).toBeTruthy();
    expect(screen.getAllByRole("treeitem").length).toBeLessThanOrEqual(500);
  });

  it("communicates when a search match is outside the visible tree budget", () => {
    const data = Object.fromEntries(
      Array.from({ length: 600 }, (_, index) => [
        `field-${index}`,
        index === 599 ? "unique-target" : index,
      ]),
    );
    render(
      <JsonView
        accessibilityLabel="Budgeted search"
        data={data}
        search={{ query: "unique-target", activeMatchIndex: 0, onResultsChange: () => undefined }}
      />,
    );

    expect(screen.getByRole("status").textContent).toBe("Match outside visible limit");
    expect(screen.queryByText("unique-target")).toBeNull();
  });

  it("recovers keyboard focus when a render-budget change removes the active item", () => {
    const data = {
      huge: Object.fromEntries(
        Array.from({ length: 600 }, (_, index) => [`field-${index}`, index]),
      ),
      ...Object.fromEntries(Array.from({ length: 89 }, (_, index) => [`filler-${index}`, index])),
      target: "focused value",
    };
    const { rerender } = render(
      <JsonView accessibilityLabel="Budget focus" data={data} defaultExpandDepth={1} />,
    );
    const target = getTreeItem(/target: focused value/i);
    const root = getRootTreeItem();
    root.focus();
    fireEvent.keyDown(root, { key: "End" });
    expectFocused(target);

    rerender(
      <JsonView
        accessibilityLabel="Budget focus"
        data={data}
        defaultExpandDepth={1}
        search={{ query: "field-599", activeMatchIndex: 0, onResultsChange: () => undefined }}
      />,
    );

    expect(screen.queryByRole("treeitem", { name: /target: focused value/i })).toBeNull();
    expectFocused(getRootTreeItem());
    expect(getRootTreeItem().tabIndex).toBe(0);
  });

  it("keeps continuation identity separate from a property named more", () => {
    const data = {
      more: "property value",
      ...Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`field-${index}`, index])),
    };
    render(<JsonView accessibilityLabel="Reserved paths" data={data} />);

    fireEvent.focus(getTreeItem(/more: property value/i));

    expect(screen.getAllByRole("treeitem").filter((item) => item.tabIndex === 0)).toHaveLength(1);
  });

  it("bounds long strings until their explicit continuation is activated", () => {
    const longValue = `${"segment-".repeat(2_000)}final-marker`;
    render(<JsonView accessibilityLabel="Long string" data={{ description: longValue }} />);

    const description = getTreeItem(/description/i);

    expect(description.textContent?.length).toBeLessThan(longValue.length);
    expect(description.textContent).not.toContain("final-marker");

    fireEvent.click(within(description).getByRole("button", { name: /show (more|full)/i }));

    expect(description.textContent).toContain("final-marker");
  });

  it("reveals a truncated string from its tree item with the keyboard", () => {
    const longValue = `${"segment-".repeat(2_000)}final-marker`;
    render(<JsonView accessibilityLabel="Keyboard reveal" data={{ description: longValue }} />);
    const description = getTreeItem(/description/i);

    fireEvent.keyDown(description, { key: "Enter" });

    expect(description.textContent).toContain("final-marker");
  });

  it("reveals and highlights a search match beyond the string display limit", () => {
    const longValue = `${"segment-".repeat(2_000)}final-marker`;
    render(
      <JsonView
        accessibilityLabel="Long string search"
        data={{ description: longValue }}
        search={{ query: "final-marker", activeMatchIndex: 0, onResultsChange: () => undefined }}
      />,
    );

    expect(within(getTreeItem(/description/i)).getByText("final-marker", { selector: "mark" })).toBeTruthy();
  });

  it("reveals every occurrence when a long string matches before and after the display limit", () => {
    const longValue = `needle-${"segment-".repeat(1_000)}needle`;
    const { container, rerender } = render(
      <JsonView
        accessibilityLabel="Repeated long-string search"
        data={{ description: longValue }}
        search={{ query: "needle", activeMatchIndex: 0, onResultsChange: () => undefined }}
      />,
    );

    expect(Array.from(container.querySelectorAll("mark"), (mark) => mark.textContent)).toEqual([
      "needle",
    ]);
    expect(screen.getByRole("button", { name: "Show full string" })).toBeTruthy();

    rerender(
      <JsonView
        accessibilityLabel="Repeated long-string search"
        data={{ description: longValue }}
        search={{ query: "needle", activeMatchIndex: 1, onResultsChange: () => undefined }}
      />,
    );

    const marks = Array.from(container.querySelectorAll("mark"));
    expect(marks.map((mark) => mark.textContent)).toEqual(["needle", "needle"]);
    expect(marks[1]?.hasAttribute("data-active")).toBe(true);
    expect(screen.queryByRole("button", { name: "Show full string" })).toBeNull();
  });

  it("bounds highlighted nodes while retaining an active occurrence beyond the highlight limit", () => {
    const onResultsChange = vi.fn();
    const { container } = render(
      <JsonView
        accessibilityLabel="Dense search results"
        data={{ description: "a".repeat(600) }}
        search={{ query: "a", activeMatchIndex: 599, onResultsChange }}
      />,
    );

    const marks = Array.from(container.querySelectorAll("mark"));
    expect(marks).toHaveLength(501);
    expect(marks.at(-1)?.hasAttribute("data-active")).toBe(true);
    expect(onResultsChange).toHaveBeenLastCalledWith({
      activeIndex: 599,
      count: 600,
      pending: false,
    });
  });

  it("keeps bounded string content out of the tree item label", () => {
    const longValue = `${"segment-".repeat(2_000)}final-marker`;
    render(<JsonView accessibilityLabel="Bounded label" data={{ description: longValue }} />);

    expect(getTreeItem(/description/i).getAttribute("aria-label")).not.toContain("final-marker");
  });

  it("does not split a Unicode code point at the string display boundary", () => {
    const value = `${"a".repeat(3_999)}😀tail`;
    render(<JsonView accessibilityLabel="Unicode boundary" data={{ value }} />);

    const displayedValue = getTreeItem(/value/i).textContent ?? "";
    expect(displayedValue).toContain("😀…");
    expect(displayedValue).not.toContain("\\ud83d");
  });
});
