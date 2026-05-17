'use client';
import { useMemo } from 'react';

interface WeeklyChartProps {
  data: { date: string; calls: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const maxCalls = useMemo(() => {
    if (!data || data.length === 0) return 10;
    const max = Math.max(...data.map(d => d.calls));
    return max > 0 ? max : 10;
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border rounded-xl bg-gray-900 border-gray-800 text-gray-500">
        No data available for this week.
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-xl bg-gray-900 border-gray-800">
      <h3 className="text-lg font-medium mb-6">AI Usage This Week</h3>
      <div className="h-48 flex items-end justify-between gap-2">
        {data.map((day, i) => {
          const heightPct = Math.max((day.calls / maxCalls) * 100, 2);
          const dateObj = new Date(day.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          
          return (
            <div key={i} className="flex flex-col items-center flex-1 gap-2 group">
              <div className="relative w-full flex justify-center">
                <div 
                  className="w-full max-w-[40px] bg-blue-500 rounded-t-sm transition-all duration-300 group-hover:bg-blue-400"
                  style={{ height: `${heightPct}%`, minHeight: '4px' }}
                />
                {/* Tooltip */}
                <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-xs px-2 py-1 rounded text-white pointer-events-none whitespace-nowrap z-10">
                  {day.calls} calls
                </div>
              </div>
              <span className="text-xs text-gray-400">{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
