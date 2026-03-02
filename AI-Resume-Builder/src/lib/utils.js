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

export function formatDateForInput(date) {
  if (!date || date === 'Present') return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
