import React from 'react';
import {  Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationProps {
  message: string;
  onAcknowledge: () => void;
  className?: string;
  index?: number;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  onAcknowledge,
  className,
  index = 0,
}) => {
  return (
    <div
      className={cn(
        'fixed right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm w-full',
        'border border-gray-200 dark:border-gray-700',
        'animate-slide-up z-50',
        className
      )}
      style={{ bottom: `${1 + index * 4.5}rem` }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-sm text-gray-700 dark:text-gray-300 mr-4"
          dangerouslySetInnerHTML={{ __html: message }}
        ></span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onAcknowledge}
            className="p-1.5 rounded-md text-gray-500 hover:text-green-500 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 focus:outline-none transition-colors"
            title="Tamam"
          >
            <Check size={16} />
          </button>
         
        </div>
      </div>
    </div>
  );
};
