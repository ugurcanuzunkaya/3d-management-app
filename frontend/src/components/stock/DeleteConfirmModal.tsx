import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import type { Filament } from '@/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filament: Filament | null;
  isPending?: boolean;
}

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  filament,
  isPending
}: DeleteConfirmModalProps) => {
  if (!isOpen || !filament) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-xl border shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Filament
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete <span className="font-bold text-foreground">{filament.name}</span>?
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
