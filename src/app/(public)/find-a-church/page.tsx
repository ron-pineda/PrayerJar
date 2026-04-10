import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Find a Church | The Prayer Jar' };

export default function FindAChurchPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Find a Church Near You</h1>
      <p className="text-muted-foreground mb-8 text-lg">
        We&rsquo;re building this feature. Check back soon!
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        In the meantime, you can search for &ldquo;Bible-based churches near me&rdquo; on Google
        Maps or ask someone in your community.
      </p>
      <Button render={<Link href="/" />}>Back to the Prayer Jar</Button>
    </main>
  );
}
