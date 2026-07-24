import { JsonView } from "@inspector/ds";

const result = {
  account: { id: "account_01", status: "active" },
  relatedAccountIds: ["account_02", "account_03"],
};
const searchTerms = ["account", "active"] as const;

export default function SearchHighlightingExample() {
  return (
    <JsonView
      accessibilityLabel="Account search result"
      data={result}
      searchTerms={searchTerms}
    />
  );
}
