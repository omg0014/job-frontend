import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn/ui's class merger: clsx for conditionals, tailwind-merge so a
 * later utility wins over an earlier conflicting one (`p-2` + `p-4` → `p-4`).
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
