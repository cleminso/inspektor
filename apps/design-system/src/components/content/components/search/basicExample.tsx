import { Search } from "@inspector/ds";
import { type ReactElement, useState } from "react";

export default function BasicExample(): ReactElement {
  const [query, setQuery] = useState("");

  return (
    <Search
      aria-label="Search tables"
      placeholder="Search tables"
      value={query}
      onValueChange={setQuery}
    />
  );
}
