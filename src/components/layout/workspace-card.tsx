export function WorkspaceCard() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid size-8 place-items-center rounded-full bg-command text-[11px] font-semibold text-primary ring-1 ring-primary/15">BT</span>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-medium">Bid Team</p>
        <p className="truncate text-[11px] text-muted-foreground">Public demo workspace</p>
      </div>
    </div>
  );
}
