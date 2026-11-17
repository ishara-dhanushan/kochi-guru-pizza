import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-brand-wash dark:bg-brand-wash/25 flex items-center justify-center">
        <Construction className="size-8 text-brand" aria-hidden="true" />
      </div>
      <div className="text-center">
        <h1 className="text-xl font-bold text-content-main">Coming Soon</h1>
        <p className="text-sm text-content-muted mt-2">
          This section is under construction.
        </p>
      </div>
    </div>
  );
}
