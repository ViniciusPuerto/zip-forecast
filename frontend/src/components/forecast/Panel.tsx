import { useId, type ReactNode } from 'react'

type PanelProps = {
  title: string
  children: ReactNode
}

export function Panel({ title, children }: PanelProps) {
  const headingId = useId()
  return (
    <section
      className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-sm"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="mb-3 text-base font-semibold text-[color:var(--text)]">
        {title}
      </h3>
      {children}
    </section>
  )
}
