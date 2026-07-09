export function StorageLink({
  url,
  label = "View in storage",
}: {
  url?: string;
  label?: string;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm0 2h12v10H4V5z" />
      </svg>
      {label}
    </a>
  );
}
