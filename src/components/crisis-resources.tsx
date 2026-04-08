import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function CrisisResources({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You are not alone</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          If you&apos;re in crisis or struggling, please reach out for immediate support.
        </p>
        <ul className="space-y-3 mt-4">
          <li>
            <strong>988 Suicide & Crisis Lifeline</strong>
            <br />
            <span className="text-muted-foreground">Call or text <strong>988</strong> (US)</span>
          </li>
          <li>
            <strong>Crisis Text Line</strong>
            <br />
            <span className="text-muted-foreground">Text <strong>HOME</strong> to <strong>741741</strong></span>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          Your prayer request has been submitted and is being reviewed.
          We are praying for you.
        </p>
        <Button onClick={onClose} className="mt-2 w-full">Close</Button>
      </DialogContent>
    </Dialog>
  );
}
