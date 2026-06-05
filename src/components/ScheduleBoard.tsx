import { SchoolSettings } from "../types";
import { calculateSchedule } from "../utils/schedule";
import React, { useMemo } from "react";
import { Clock } from "lucide-react";

interface Props {
  settings: SchoolSettings;
}

export default function ScheduleBoard({ settings }: Props) {
  const schedule = useMemo(() => {
    return calculateSchedule(
      settings.schoolType,
      settings.firstPeriodStartTime,
      !!settings.assemblyTime,
      settings.assemblyTime || ""
    );
  }, [settings]);

  return (
    <div className="space-y-3">
      {schedule.map((item, idx) => (
        <div 
          key={idx} 
          className={`flex justify-between items-center text-lg py-3.5 px-5 rounded-2xl shadow-sm border ${
            item.name.includes("점심") 
              ? "bg-slate-200/40 italic border-slate-200 font-bold" 
              : item.name.includes("조회")
              ? "bg-amber-100/60 border-amber-200 font-black"
              : "bg-white/60 border-indigo-50 font-bold"
          }`}
        >
          <span className={`flex items-center gap-2.5 ${item.name.includes("조회") ? "text-amber-800" : "text-slate-700"}`}>
            {item.name}
          </span>
          <span className="font-mono text-sm font-black text-slate-500 bg-slate-100/50 px-2.5 py-1 rounded-lg">
            {item.startTime} - {item.endTime}
          </span>
        </div>
      ))}
    </div>
  );
}
