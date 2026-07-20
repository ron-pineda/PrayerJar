import {
  Briefcase,
  Compass,
  Feather,
  Heart,
  HeartPulse,
  LayoutGrid,
  Leaf,
  Sparkles,
  Star,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * Canonical Lucide icon per prayer category (brand-guide §4.5).
 * Shared by /browse, /pray (category-picker), prayer-card, and praise-card
 * so the grids cannot drift. Fallback for unknown categories is `Star`.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  any: LayoutGrid,
  health: HeartPulse,
  family: Users,
  financial: Wallet,
  grief: Feather,
  gratitude: Sparkles,
  guidance: Compass,
  relationships: Heart,
  work_career: Briefcase,
  spiritual_growth: Leaf,
  other: Star,
};
