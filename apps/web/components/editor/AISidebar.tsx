'use client';
import { useState } from 'react';
import { Loader2, Check, CheckCircle2 } from 'lucide-react';

interface ActionItemsPanelProps {
  roomId: string;
  onGenerate: () => void;
}

export function ActionItemsPanel({ roomId, onGenerate }: ActionItemsPanelProps) {
  const [items, setItems] = useState<string[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/room-advanced/${roomId}/ai/action-items`,
        { method: 'POST' }
      );
      const data = await res.json();
      setItems(data.actionItems ?? []);
      setChecked(new Set());
    } catch (error) {
      console.error('Error generating action items:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Action items</h3>
        <button
          onClick={() => {
            generate();
            onGenerate();
          }}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {loading ? 'Extracting...' : 'Extract'}
        </button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => {
                  const next = new Set(checked);
                  next.has(i) ? next.delete(i) : next.add(i);
                  setChecked(next);
                }}
                className="mt-0.5 cursor-pointer"
              />
              <span className={checked.has(i) ? 'line-through text-muted-foreground' : ''}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      )}
      {items.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground italic">No action items extracted yet</p>
      )}
    </div>
  );
}

interface TitleSuggestionPanelProps {
  roomId: string;
  onApply: (title: string) => void;
}

export function TitleSuggestionPanel({ roomId, onApply }: TitleSuggestionPanelProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/room-advanced/${roomId}/ai/title`,
        { method: 'POST' }
      );
      const data = await res.json();
      setTitle(data.suggestedTitle ?? '');
    } catch (error) {
      console.error('Error suggesting title:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 p-3 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Title suggestion</h3>
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Suggest'}
        </button>
      </div>
      {title && (
        <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg text-sm">
          <span className="flex-1 italic truncate">"{title}"</span>
          <button
            onClick={() => {
              onApply(title);
              setTitle('');
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            Apply
          </button>
        </div>
      )}
      {!title && !loading && (
        <p className="text-xs text-muted-foreground italic">No title suggestion yet</p>
      )}
    </div>
  );
}
