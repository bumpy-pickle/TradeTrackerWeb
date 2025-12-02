import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TriangleIcon, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { PersonSummary } from "@shared/schema";

interface SummaryTableProps {
  data: PersonSummary[];
}

type SortColumn = "name" | "youWorked" | "theyWorked" | "total";
type SortDirection = "asc" | "desc";

export function SummaryTable({ data }: SummaryTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedData = useMemo(() => {
    if (data.length === 0) return data;
    
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a[sortColumn] - b[sortColumn];
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground" data-testid="table-empty-summary">
        No summary data to display
      </div>
    );
  }

  const getTotalColor = (total: number) => {
    if (total > 0) return "text-chart-3";
    if (total < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <ScrollArea className="h-[400px]" data-testid="table-summary">
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10">
          <TableRow className="hover:bg-transparent">
            <TableHead 
              className="font-semibold cursor-pointer select-none hover-elevate" 
              onClick={() => handleSort("name")}
              data-testid="header-name"
            >
              <div className="flex items-center gap-1.5">
                Name
                <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead 
              className="font-semibold text-right cursor-pointer select-none hover-elevate" 
              onClick={() => handleSort("youWorked")}
              data-testid="header-you-worked"
            >
              <div className="flex items-center justify-end gap-1.5">
                You Worked
                <SortIcon column="youWorked" />
              </div>
            </TableHead>
            <TableHead 
              className="font-semibold text-right cursor-pointer select-none hover-elevate" 
              onClick={() => handleSort("theyWorked")}
              data-testid="header-they-worked"
            >
              <div className="flex items-center justify-end gap-1.5">
                They Worked
                <SortIcon column="theyWorked" />
              </div>
            </TableHead>
            <TableHead 
              className="font-semibold text-right cursor-pointer select-none hover-elevate" 
              onClick={() => handleSort("total")}
              data-testid="header-total"
            >
              <div className="flex items-center justify-end gap-1.5">
                Total
                <SortIcon column="total" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={row.name}
              className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}
              data-testid={`row-summary-${index}`}
            >
              <TableCell className="font-medium" data-testid={`cell-name-${index}`}>
                {row.name}
              </TableCell>
              <TableCell className="text-right tabular-nums" data-testid={`cell-you-worked-${index}`}>
                {row.youWorked > 0 ? row.youWorked : ""}
              </TableCell>
              <TableCell className="text-right tabular-nums" data-testid={`cell-they-worked-${index}`}>
                {row.theyWorked > 0 ? row.theyWorked : ""}
              </TableCell>
              <TableCell className="text-right" data-testid={`cell-total-${index}`}>
                <div className="flex items-center justify-end gap-1">
                  <TriangleIcon 
                    className={`w-3 h-3 fill-current ${getTotalColor(row.total)}`} 
                    style={{ 
                      transform: row.total >= 0 ? 'rotate(0deg)' : 'rotate(180deg)' 
                    }}
                  />
                  <span className={`font-semibold tabular-nums ${getTotalColor(row.total)}`}>
                    {Math.abs(row.total)}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
