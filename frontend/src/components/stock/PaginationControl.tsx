import { Button } from '@/components/ui/button';

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  pageSize: number | 'all';
  totalFiltered: number;
  shownCount: number;
  onPageChange: (page: number | ((p: number) => number)) => void;
  onPageSizeChange: (size: number | 'all') => void;
}

export const PaginationControl = ({
  currentPage,
  totalPages,
  pageSize,
  totalFiltered,
  shownCount,
  onPageChange,
  onPageSizeChange
}: PaginationControlProps) => (
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Showing {shownCount} of {totalFiltered} filaments</span>
      <div className="flex items-center gap-1 ml-4">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="bg-transparent border rounded px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          {[20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
          <option value="all">All</option>
        </select>
        <span>per page</span>
      </div>
    </div>

    {pageSize !== 'all' && totalPages > 1 && (
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(p => Math.max(1, (p as number) - 1))} disabled={currentPage === 1}>
          Previous
        </Button>
        <div className="flex items-center gap-1 px-4 text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(p => Math.min(totalPages, (p as number) + 1))} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>
    )}
  </div>
);
