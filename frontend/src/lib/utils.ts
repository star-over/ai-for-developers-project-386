import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getDurationColors = ({ duration }: { duration: number }) =>
  duration <= 15
    ? { border: 'border-l-sky-400', badge: 'bg-sky-50 text-sky-700 border border-sky-200' }
    : duration <= 20
      ? { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
      : duration <= 30
        ? { border: 'border-l-amber-400', badge: 'bg-amber-50 text-amber-700 border border-amber-200' }
        : { border: 'border-l-violet-400', badge: 'bg-violet-50 text-violet-700 border border-violet-200' };

export const formatDate = ({ isoStr }: { isoStr: string }) =>
  new Date(isoStr).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });

export const formatTime = ({ isoStr }: { isoStr: string }) =>
  new Date(isoStr).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
