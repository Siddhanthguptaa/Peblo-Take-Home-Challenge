import { useState, useEffect, useRef } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(
  roomId: string,
  content: string,
  title: string,
  onSave: (id: string, data: object) => Promise<void>,
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new save timeout
    setStatus('saving');
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave(roomId, { content, title });
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
    }, 800); // 800ms debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, title, roomId, onSave]);

  return status;
}
