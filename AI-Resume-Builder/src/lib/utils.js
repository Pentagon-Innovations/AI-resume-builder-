import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(date) {
  if (!date) return 'Present';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Present';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
