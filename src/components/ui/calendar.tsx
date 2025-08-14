'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn('p-2 sm:p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-between items-center px-2 sm:px-4',
        caption_label: 'text-base sm:text-lg font-semibold',
        nav: 'flex space-x-1 sm:space-x-2',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 sm:h-8 sm:w-8 p-0 bg-transparent opacity-80 hover:opacity-100'
        ),
        table: 'w-full border-collapse',
        head_row: 'flex justify-between px-1 sm:px-2',
        head_cell:
          'text-muted-foreground text-xs sm:text-sm font-medium w-8 sm:w-9 text-center',
        row: 'flex justify-between',
        cell: 'h-8 w-8 sm:h-9 sm:w-9 text-center text-xs sm:text-sm p-0 relative',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100'
        ),
        day_selected:
          'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
        day_today: 'bg-accent text-accent-foreground',
        day_outside: 'text-muted-foreground opacity-50',
        day_disabled: 'text-muted-foreground opacity-50',
        day_range_middle: 'bg-accent text-accent-foreground',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />,
        IconRight: () => <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />,
      } as any}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
