import { forwardRef } from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../lib/cn.js';

/**
 * Radix gives keyboard support for free: arrows step, Home/End jump to the
 * ends, and each thumb is individually focusable.
 */
export const Slider = forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-ink-200">
      <SliderPrimitive.Range className="absolute h-full bg-purple-700" />
    </SliderPrimitive.Track>
    {(props.value ?? props.defaultValue ?? []).map((_, index) => (
      <SliderPrimitive.Thumb
        // eslint-disable-next-line react/no-array-index-key -- thumb count is fixed
        key={index}
        className={cn(
          'block h-4 w-4 rounded-full border-2 border-purple-700 bg-surface shadow-card',
          'transition-[transform,box-shadow] duration-150 ease-out',
          'hover:scale-110',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
        )}
      />
    ))}
  </SliderPrimitive.Root>
));
Slider.displayName = 'Slider';
