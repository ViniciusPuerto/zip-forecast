import type { ReactNode } from 'react'

const thClass =
  'border-b border-[color:var(--border)] px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]'
const tdClass =
  'border-b border-[color:var(--border)] px-3 py-2 text-left align-middle text-sm tabular-nums text-[color:var(--text)]'

type DataTableProps = {
  children: ReactNode
  className?: string
}

export function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-[color:var(--border)] ${className}`}>
      <table className="w-full min-w-[16rem] border-collapse text-sm [&>tbody>tr:last-child>td]:border-b-0">
        {children}
      </table>
    </div>
  )
}

type RowProps = { children: ReactNode }

export function DataTableHeadRow({ children }: RowProps) {
  return <tr className="bg-[color:var(--bg)]">{children}</tr>
}

export function DataTableHeaderCell({ children }: { children: ReactNode }) {
  return <th scope="col" className={thClass}>{children}</th>
}

export function DataTableBodyRow({ children }: RowProps) {
  return <tr>{children}</tr>
}

export function DataTableCell({ children }: { children: ReactNode }) {
  return <td className={tdClass}>{children}</td>
}
