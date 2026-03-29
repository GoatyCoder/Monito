import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PurgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  itemName: string;
  pending?: boolean;
  onConfirm: (reason: string) => Promise<void>;
}

export function PurgeDialog({
  open,
  onOpenChange,
  entityLabel,
  itemName,
  pending = false,
  onConfirm,
}: PurgeDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (reason.trim().length < 3) {
      setError('Inserisci una motivazione valida (almeno 3 caratteri)');
      return;
    }

    setError('');
    await onConfirm(reason.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="purge-description">
        <DialogHeader>
          <DialogTitle>Eliminazione definitiva {entityLabel}</DialogTitle>
          <DialogDescription id="purge-description">
            Elimini definitivamente &quot;{itemName}&quot;. Questa azione e' irreversibile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="purge-reason">Motivazione</Label>
          <Input
            id="purge-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Inserisci il motivo dell'eliminazione definitiva"
            aria-describedby={error ? 'purge-reason-error' : undefined}
          />
          {error && (
            <p id="purge-reason-error" className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending} aria-busy={pending}>
            {pending ? 'Eliminazione in corso...' : 'Conferma eliminazione'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
