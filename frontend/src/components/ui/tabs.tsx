'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className, ...props }: TabsProps) {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const value = controlledValue !== undefined ? controlledValue : internalValue;

    const handleValueChange = React.useCallback((newValue: string) => {
        if (controlledValue === undefined) {
            setInternalValue(newValue);
        }
        onValueChange?.(newValue);
    }, [controlledValue, onValueChange]);

    return (
        <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
            <div className={cn('', className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
                className
            )}
            {...props}
        />
    );
}

export function TabsTrigger({ value, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsTrigger must be used within Tabs');

    const isActive = context.value === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? 'active' : 'inactive'}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
                isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50',
                className
            )}
            onClick={() => context.onValueChange(value)}
            {...props}
        />
    );
}

export function TabsContent({ value, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error('TabsContent must be used within Tabs');

    if (context.value !== value) return null;

    return (
        <div
            role="tabpanel"
            data-state={context.value === value ? 'active' : 'inactive'}
            className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
            {...props}
        />
    );
}
