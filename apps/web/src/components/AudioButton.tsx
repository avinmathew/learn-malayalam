interface AudioButtonProps {
  onClick: () => void | Promise<unknown>
  label?: string
  compact?: boolean
  disabled?: boolean
}

export function AudioButton({
  onClick,
  compact = false,
  disabled = false,
}: AudioButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        void onClick()
      }}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? 'px-3 py-2 text-sm font-medium' : 'px-4 py-3 text-sm font-semibold'
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M3 10v4c0 .55.45 1 1 1h3l4.59 4.59c.63.63 1.71.18 1.71-.71V5.12c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1Zm13.5 2c0-1.77-1-3.29-2.45-4.03v8.05A4.493 4.493 0 0 0 16.5 12Zm-2.45-9.43v2.06c3.39.86 5.9 3.93 5.9 7.37s-2.51 6.5-5.9 7.37v2.06c4.5-.91 7.9-4.88 7.9-9.43s-3.4-8.52-7.9-9.43Z" />
      </svg>
    </button>
  )
}
