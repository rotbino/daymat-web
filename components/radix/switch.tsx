// components/radix/rtl-switch.tsx
'use client';

import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import * as React from 'react';

const switchVariants = cva(
    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-input',
    {
        variants: {
            variant: {
                default: '',
                destructive: 'data-[state=checked]:bg-destructive',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const SwitchThumb = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Thumb>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Thumb>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Thumb
        ref={ref}
        className={cn(
            'pointer-events-none block h-6 w-6 rounded-full bg-orange-400 shadow-lg ring-1 transition-transform border border-orange-800',
            className
        )}
        {...props}
    />
));
SwitchThumb.displayName = SwitchPrimitives.Thumb.displayName;

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> &
    VariantProps<typeof switchVariants>
>(({ className, variant, ...props }, ref) => {
    // تشخیص جهت RTL از طریق ویژگی dir در عنصر html
    const isRTL = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';

    return (
        <SwitchPrimitives.Root
            className={cn(
                switchVariants({ variant }),
                isRTL && '[&>[data-state=checked]]:bg-orange-700 [&>[data-state=unchecked]]:bg-input',
                className
            )}
            {...props}
            ref={ref}
        >
            <SwitchThumb
                className={cn(
                    isRTL
                        ? 'data-[state=checked]:translate-x-[-20px] data-[state=unchecked]:translate-x-0'
                        : 'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
                )}
            />
        </SwitchPrimitives.Root>
    );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };