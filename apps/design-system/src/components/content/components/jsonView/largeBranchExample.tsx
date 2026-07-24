import { JsonView } from "@inspector/ds";

const records = Array.from({ length: 205 }, (_, index) => ({
  id: `record_${String(index + 1).padStart(3, "0")}`,
  active: index % 2 === 0,
}));

export default function LargeBranchExample() {
  return <JsonView accessibilityLabel="Large record branch" data={records} />;
}
