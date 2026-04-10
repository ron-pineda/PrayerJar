'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SalvationCross } from '@/components/salvation-cross';
import { logSalvationDecisionAction } from '@/app/actions/salvation.actions';

type Verse = { text: string; reference: string };

export function SalvationClient({
  initialCount,
  verse,
}: {
  initialCount: number;
  verse: Verse;
}) {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDecision() {
    setLoading(true);
    setError('');
    try {
      const newCount = await logSalvationDecisionAction(name.trim() || undefined);
      setCount(newCount);
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Cross visual */}
      <div className="flex justify-center mb-4">
        <SalvationCross count={count} />
      </div>
      <p className="text-2xl font-bold text-primary mb-1 text-center">{count.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mb-10 text-center">lives transformed</p>

      {/* Daily verse */}
      <div className="border-t border-b py-4 mb-10 max-w-md mx-auto text-center">
        <p className="text-sm italic text-muted-foreground leading-relaxed">
          &ldquo;{verse.text}&rdquo;
        </p>
        <p className="text-xs text-primary mt-2">{verse.reference}</p>
      </div>

      {/* Gospel sections */}
      <div className="space-y-8 max-w-xl mx-auto mb-12">
        <section>
          <h2 className="text-xl font-semibold mb-3">God loves you</h2>
          <p className="text-muted-foreground leading-relaxed">
            Before you had a name, God knew you. Before you made a single choice, good or bad,
            he loved you.{' '}
            <em>
              &ldquo;For God so loved the world that he gave his one and only Son, that whoever
              believes in him shall not perish but have eternal life.&rdquo;
            </em>{' '}
            — John 3:16
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">We all drift</h2>
          <p className="text-muted-foreground leading-relaxed">
            Here&rsquo;s something honest: every one of us has wandered. Not because we&rsquo;re
            terrible — but because we&rsquo;re human.{' '}
            <em>
              &ldquo;For all have sinned and fall short of the glory of God.&rdquo;
            </em>{' '}
            — Romans 3:23. That&rsquo;s not shame. That&rsquo;s just the truth about all of us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Jesus is the bridge</h2>
          <p className="text-muted-foreground leading-relaxed">
            God didn&rsquo;t leave us there. He sent Jesus — not to judge, but to rescue. Jesus
            lived the life we couldn&rsquo;t live, died the death we deserved, and rose again.{' '}
            <em>
              &ldquo;But God demonstrates his own love for us in this: while we were still
              sinners, Christ died for us.&rdquo;
            </em>{' '}
            — Romans 5:8
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">It&rsquo;s a gift, not an earning</h2>
          <p className="text-muted-foreground leading-relaxed">
            You don&rsquo;t have to clean yourself up first. You don&rsquo;t have to be good
            enough.{' '}
            <em>
              &ldquo;For it is by grace you have been saved, through faith — and this is not from
              yourselves, it is the gift of God — not by works, so that no one can boast.&rdquo;
            </em>{' '}
            — Ephesians 2:8-9
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How to receive it</h2>
          <p className="text-muted-foreground leading-relaxed">
            <em>
              &ldquo;If you declare with your mouth, &lsquo;Jesus is Lord,&rsquo; and believe in
              your heart that God raised him from the dead, you will be saved.&rdquo;
            </em>{' '}
            — Romans 10:9. That&rsquo;s it. A prayer, a turning, a yes.
          </p>
        </section>
      </div>

      {/* Salvation prayer */}
      <div className="border-t border-b py-6 mb-8 max-w-md mx-auto text-center">
        <p className="text-base italic text-muted-foreground leading-relaxed">
          &ldquo;Jesus, I believe you died for me and rose again. I turn from my own way and ask
          you to come into my life. Thank you for forgiving me. I&rsquo;m yours. Amen.&rdquo;
        </p>
      </div>

      {!submitted ? (
        <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name (optional)"
            className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={50}
          />
          <Button
            size="lg"
            className="w-full"
            onClick={handleDecision}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'I prayed this prayer'}
          </Button>
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>
      ) : (
        <div className="text-center max-w-sm mx-auto">
          <p className="text-lg font-semibold mb-2">
            Welcome to the family{name.trim() ? `, ${name.trim()}` : ''}. 🙏
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Heaven is celebrating right now. — Luke 15:7
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" render={<Link href="/find-a-church" />}>
              Find a Church Near Me
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/" />}>
              Go to the Prayer Jar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
