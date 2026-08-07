import { ModeToggle } from "./mode-toggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-1.5 rounded-full bg-alert-high" />
          <span className="font-mono font-semibold text-sm tracking-tight">ohgee</span>
          <span className="eyebrow">Store order monitor</span>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}
