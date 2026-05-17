'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface NotesSearchProps {
  onFilter: (filters: any) => void;
  availableTags?: { id: string; name: string; count: number }[];
}

export function NotesSearch({ onFilter, availableTags = [] }: NotesSearchProps) {
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<'updated' | 'created'>('updated');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter({
        search,
        tags: activeTags.join(','),
        archived: showArchived ? 'true' : 'false',
        sort,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [search, activeTags, showArchived, sort, onFilter]);

  function toggleTag(tag: string) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  return (
    <div className="space-y-3 p-3 bg-card border-b">
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
        <Search size={14} className="text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      {/* Tag pills */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableTags.map(tag => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.name)}
              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                activeTags.includes(tag.name)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'hover:bg-accent border-border'
              }`}
              title={`${tag.count} items`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Sort and view options */}
      <div className="flex gap-3 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <button
            onClick={() => setSort('updated')}
            className={sort === 'updated' ? 'text-foreground font-medium' : 'hover:text-foreground'}
          >
            Last edited
          </button>
          <span>·</span>
          <button
            onClick={() => setSort('created')}
            className={sort === 'created' ? 'text-foreground font-medium' : 'hover:text-foreground'}
          >
            Created
          </button>
        </div>
        <span>·</span>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={showArchived ? 'text-foreground font-medium' : 'hover:text-foreground'}
        >
          {showArchived ? 'Show active' : 'Show archived'}
        </button>
      </div>
    </div>
  );
}
