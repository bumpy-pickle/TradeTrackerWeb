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
import { Button } from "@/components/ui/button";
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

  const MobileSortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3 h-3" />
      : <ArrowDown className="w-3 h-3" />;
  };

  const getSortLabel = (column: SortColumn) => {
    switch (column) {
      case "name": return "Name";
      case "youWorked": return "You";
      case "theyWorked": return "They";
      case "total": return "Total";
    }
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

  const sortColumns: SortColumn[] = ["name", "youWorked", "theyWorked", "total"];

  return (
    <div className="relative" data-testid="table-summary">
      {/* Mobile card view */}
      <div className="block md:hidden">
        {/* Mobile sort controls */}
        <div className="flex items-center gap-1 p-2 border-b bg-muted/30 overflow-x-auto" data-testid="mobile-sort-controls">
          <span className="text-xs text-muted-foreground whitespace-nowrap mr-1">Sort:</span>
          {sortColumns.map((column) => (
            <Button
              key={column}
              variant={sortColumn === column ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort(column)}
              className="h-7 px-2 text-xs gap-1 flex-shrink-0"
              data-testid={`button-sort-mobile-${column}`}
            >
              {getSortLabel(column)}
              <MobileSortIcon column={column} />
            </Button>
          ))}
        </div>
        
        {/* Mobile cards list */}
        <div className="max-h-[350px] overflow-y-auto divide-y">
          {sortedData.map((row, index) => (
            <div
              key={row.name}
              className={`p-3 ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
              data-testid={`row-summary-mobile-${index}`}
            >
              <div className="flex justify-between items-center gap-2 mb-2">
                <span className="font-medium text-sm truncate flex-1" data-testid={`cell-name-mobile-${index}`}>
                  {row.name}
                </span>
                <div className="flex items-center gap-1" data-testid={`cell-total-mobile-${index}`}>
                  <TriangleIcon 
                    className={`w-3 h-3 fill-current ${getTotalColor(row.total)}`} 
                    style={{ 
                      transform: row.total >= 0 ? 'rotate(0deg)' : 'rotate(180deg)' 
                    }}
                  />
                  <span className={`font-semibold text-sm tabular-nums ${getTotalColor(row.total)}`}>
                    {row.total >= 0 ? '+' : '-'}{Math.abs(row.total)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4 text-xs text-muted-foreground">
                <span data-testid={`cell-you-worked-mobile-${index}`}>
                  You worked: <span className="font-medium text-foreground">{row.youWorked || 0}</span>
                </span>
                <span data-testid={`cell-they-worked-mobile-${index}`}>
                  They worked: <span className="font-medium text-foreground">{row.theyWorked || 0}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop table view */}
      <ScrollArea className="h-[400px] hidden md:block">
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
    </div>
  );
}
