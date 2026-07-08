interface DetailPaneProps {
  children: React.ReactNode;
  title: React.ReactNode;
}

export function DetailPane({
  children,
  title,
}: DetailPaneProps): React.ReactElement {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <h2 className="flex min-w-0 flex-1 items-center text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        {children}
      </div>
    </div>
  );
}
