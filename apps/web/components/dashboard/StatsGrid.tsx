'use client';
import { FileText, Archive, Zap, Tag } from 'lucide-react';

interface StatsGridProps {
  totalRooms: number;
  archivedRooms: number;
  totalAICalls: number;
  totalTokens: number;
}

export function StatsGrid({
  totalRooms,
  archivedRooms,
  totalAICalls,
  totalTokens,
}: StatsGridProps) {
  const stats = [
    { label: 'Active notes', value: totalRooms, icon: FileText, color: 'text-blue-500' },
    { label: 'Archived', value: archivedRooms, icon: Archive, color: 'text-gray-500' },
    { label: 'AI calls', value: totalAICalls, icon: Zap, color: 'text-yellow-500' },
    { label: 'Tokens used', value: totalTokens.toLocaleString(), icon: Tag, color: 'text-purple-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="p-4 border rounded-xl bg-card space-y-2 hover:shadow-md transition-shadow">
          <s.icon size={18} className={s.color} />
          <div className="text-2xl font-semibold">{s.value}</div>
          <div className="text-xs text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
