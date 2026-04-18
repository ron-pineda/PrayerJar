'use client';

import { useState } from 'react';

export interface FaqItem {
  q: string;
  a: string;
}

function FaqAccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b last:border-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-4 text-sm font-medium text-left select-none"
      >
        {item.q}
        <span
          className={`shrink-0 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>
      {isOpen && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {item.a}
        </p>
      )}
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <FaqAccordionItem key={item.q} item={item} />
      ))}
    </div>
  );
}
