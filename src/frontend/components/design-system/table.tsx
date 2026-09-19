import React from "react";
import { cn } from "@/lib/utils";

export function Table({
  className,
  containerClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & { containerClassName?: string }) {
  return (
    <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
      <table
        className={cn("w-full caption-bottom text-sm text-left", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-[#F7F6F2] border-b border-[#E3E5E0] text-[11px] text-[#5C6B68] uppercase tracking-wider font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("divide-y divide-[#F0EDE4] bg-white", className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-[#F7F9F8] data-[state=selected]:bg-[#E1EFEC]",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className,
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-10 px-4 text-left align-middle font-semibold text-[#5C6B68] select-none whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("p-4 align-middle text-[#102A27] whitespace-nowrap", className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableEmpty({
  message = "No operational records found.",
  colSpan = 8,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-32 text-center text-[#899491] font-normal"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}
