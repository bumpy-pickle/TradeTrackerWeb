import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TriangleIcon } from "lucide-react";
import type { PersonSummary } from "@shared/schema";

interface SummaryTableProps {
  data: PersonSummary[];
}

export function SummaryTable({ data }: SummaryTableProps) {
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
            <TableHead className="font-semibold" data-testid="header-name">
              Name
            </TableHead>
            <TableHead className="font-semibold text-right" data-testid="header-you-worked">
              You Worked
            </TableHead>
            <TableHead className="font-semibold text-right" data-testid="header-they-worked">
              They Worked
            </TableHead>
            <TableHead className="font-semibold text-right" data-testid="header-total">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
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
