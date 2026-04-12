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
          We see you. There are people who care and are ready to help right now.
        </p>

        <div className="max-h-96 overflow-y-auto mt-4 space-y-5">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-2">
              Immediate Crisis Support
            </h3>
            <ul className="space-y-3">
              <li>
                <strong>988 Suicide &amp; Crisis Lifeline</strong>
                <br />
                <span className="text-sm text-muted-foreground">Call or text 24/7 (US)</span>
                <br />
                <a
                  href="tel:988"
                  className="text-sm underline"
                >
                  Call or text 988
                </a>
              </li>
              <li>
                <strong>Crisis Text Line</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  Text <strong>HOME</strong> to <strong>741741</strong> (US &amp; UK)
                </span>
                <br />
                <a
                  href="https://www.crisistextline.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  crisistextline.org
                </a>
              </li>
              <li>
                <strong>International Association for Suicide Prevention</strong>
                <br />
                <span className="text-sm text-muted-foreground">Find local crisis centers worldwide</span>
                <br />
                <a
                  href="https://www.iasp.info/resources/Crisis_Centres/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  iasp.info — Crisis Centres
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground mb-2">
              Mental Health Support
            </h3>
            <ul className="space-y-3">
              <li>
                <strong>NAMI Helpline</strong>
                <br />
                <span className="text-sm text-muted-foreground">Mon–Fri 10am–10pm ET (US)</span>
                <br />
                <a
                  href="tel:18009506264"
                  className="text-sm underline"
                >
                  1-800-950-6264
                </a>
                {' · '}
                <a
                  href="https://www.nami.org/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  nami.org/help
                </a>
              </li>
              <li>
                <strong>BetterHelp</strong>
                <br />
                <span className="text-sm text-muted-foreground">Online therapy, accessible anywhere</span>
                <br />
                <a
                  href="https://www.betterhelp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  betterhelp.com
                </a>
              </li>
              <li>
                <strong>Open Path Collective</strong>
                <br />
                <span className="text-sm text-muted-foreground">Affordable therapy ($30–$80/session)</span>
                <br />
                <a
                  href="https://openpathcollective.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline"
                >
                  openpathcollective.org
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          Your prayer request has been received. Our community is praying for you — and we mean that.
        </p>
        <Button onClick={onClose} className="mt-2 w-full">Close</Button>
      </DialogContent>
    </Dialog>
  );
}
