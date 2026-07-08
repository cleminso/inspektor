import { Button } from "@regarde/ui/button";
import { CopyButton } from "@regarde/ui/copyButton";
import { EmptyState } from "@regarde/ui/emptyState";
import { FieldError } from "@regarde/ui/field";

interface SchemaSwitcherProps {
  appId: string;
  errorMessage: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onSelectSchema: (schemaHash: string) => Promise<void>;
  schemaHashes: string[];
}

export function SchemaSwitcher({
  appId,
  errorMessage,
  isSubmitting,
  onBack,
  onCancel,
  onSelectSchema,
  schemaHashes,
}: SchemaSwitcherProps): React.ReactElement {
  const hasError = errorMessage !== null;
  const hasSchemas = schemaHashes.length > 0;
  const appLabel = appId.trim().length > 0 ? appId.trim() : "this connection";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground">Select schema</h3>
        <p className="text-sm text-muted-foreground">Choose the stored schema to open for {appLabel}.</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {hasSchemas === true ? (
          schemaHashes.map((schemaHash) => (
            <div key={schemaHash} className="flex items-center gap-1 rounded-xs border border-border px-2 py-1">
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start px-1 py-1 text-left"
                onClick={() => {
                  void onSelectSchema(schemaHash);
                }}
                disabled={isSubmitting === true}
                aria-label={`Open schema ${schemaHash}`}
              >
                <span className="truncate text-sm">{schemaHash}</span>
              </Button>
              <CopyButton text={schemaHash} className="shrink-0" />
            </div>
          ))
        ) : (
          <EmptyState title="No schemas found" description="Try a different server, app ID, or admin secret." />
        )}
      </div>
      <FieldError className="rounded-xs border border-destructive/20 bg-destructive/5 px-3 py-2" aria-live="polite">
        {hasError === true ? errorMessage : null}
      </FieldError>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isSubmitting === true}>
          Back
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting === true}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
