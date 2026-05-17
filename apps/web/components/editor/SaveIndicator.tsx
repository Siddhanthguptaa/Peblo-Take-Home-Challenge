'use client';
import { Check, Loader2, AlertCircle, Save } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveIndicatorProps {
  status: SaveStatus;
  error?: string;
}

export function SaveIndicator({ status, error }: SaveIndicatorProps) {
  if (status === 'idle') {
    return (
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <Save size={12} />
        <span>All changes saved</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
      status === 'saving'
        ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950'
        : status === 'saved'
        ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
        : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
    }`}>
      {status === 'saving' && <Loader2 size={12} className="animate-spin" />}
      {status === 'saved' && <Check size={12} />}
      {status === 'error' && <AlertCircle size={12} />}
      <span>
        {status === 'saving' && 'Saving...'}
        {status === 'saved' && 'Saved'}
        {status === 'error' && error ? error : 'Save failed'}
      </span>
    </div>
  );
}
