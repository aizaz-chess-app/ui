import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pad(value: number, length = 2): string {
  return value.toString().padStart(length, '0');
}

export function plural(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`;
}
