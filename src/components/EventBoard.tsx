import { MonthlyEvent } from "../types";
import { useMemo } from "react";

interface Props {
  events: MonthlyEvent[];
}

export default function EventBoard({ events }: Props) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const getDay = (dateStr: string) => {
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          // If YYYY-MM-DD it's parts[2], if M-D it's parts[1]
          return parseInt(parts.length === 3 ? parts[2] : parts[1]);
        }
        return parseInt(dateStr);
      };
      return getDay(a.date) - getDay(b.date);
    });
  }, [events]);

  return (
    <div className="bg-white/60 rounded-2xl overflow-hidden border border-red-100 shadow-sm">
      {sortedEvents.length > 0 ? (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-50/50 text-[10px] font-black uppercase tracking-widest text-red-400 border-b border-red-100">
              <th className="px-4 py-2 w-16 text-center">날짜</th>
              <th className="px-4 py-2">학사 일정</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-50">
            {sortedEvents.map((e) => {
              const getDayDisplay = (dateStr: string) => {
                if (dateStr.includes("-")) {
                  const parts = dateStr.split("-");
                  return parts.length === 3 ? parts[2] : parts[1];
                }
                return dateStr;
              };
              const day = getDayDisplay(e.date);
              return (
                <tr key={e.id} className="hover:bg-red-50/30 transition-colors">
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-sm font-black text-rose-400 bg-white px-2 py-0.5 rounded-lg border border-rose-100 shadow-sm">
                      {String(day).padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-700 leading-snug">
                    {e.content}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-300 py-16 gap-3">
          <span className="text-base italic font-medium">특별한 일정이 없어요</span>
        </div>
      )}
    </div>
  );
}
