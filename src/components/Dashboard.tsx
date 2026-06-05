import { useEffect, useState } from "react";
import { storage } from "../lib/storage";
import { SchoolSettings, ClassData, MonthlyEvent, Notice } from "../types";
import ClassBoard from "./ClassBoard";
import EventBoard from "./EventBoard";
import NoticeBoard from "./NoticeBoard";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { motion } from "motion/react";

export default function Dashboard() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [events, setEvents] = useState<MonthlyEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      try {
        const s = await storage.getSettings();
        const c = await storage.getClasses();
        const e = await storage.getEvents();
        const n = await storage.getNotices();
        
        setSettings(s);
        setClasses(c);
        setEvents(e);
        setNotices(n);
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup update listener (polling for GAS, real-time for Firebase)
    const unsubscribe = storage.onDataUpdate((data) => {
      if (data.settings) setSettings(data.settings);
      setClasses(data.classes);
      setEvents(data.events);
      setNotices(data.notices);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-slate-500 font-bold animate-pulse">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!settings || !settings.schoolName) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">학교 정보를 설정해주세요</h2>
          <Link to="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
            관리자 설정으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col font-sans bg-[#fdfeff]">
      {/* Header */}
      <header className="flex h-28 shrink-0 items-center justify-between border-b border-pink-50 bg-white/70 backdrop-blur-xl px-12 shadow-sm z-20 sticky top-0">
        <div className="flex items-center gap-10">
          {settings.logoUrl ? (
            <img 
              src={settings.logoUrl} 
              alt="School Logo" 
              className="h-20 w-20 rounded-3xl border border-pink-100 object-cover shadow-sm bg-white" 
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-100 to-indigo-100 text-slate-800 font-black text-2xl shadow-inner">
              {settings.schoolName?.charAt(0) || "S"}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">
              {settings.schoolName} 현황판
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs font-bold text-slate-400">
              <span className="bg-indigo-50 text-indigo-500 px-2.5 py-0.5 rounded-full ring-1 ring-indigo-100 uppercase tracking-widest">{settings.schoolType === 'elementary' ? 'Elementary' : settings.schoolType === 'middle' ? 'Middle' : 'High'} School</span>
              <span className="opacity-70">📍 {settings.address}</span>
              {settings.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <span className="opacity-60 text-[9px]">📞</span> {settings.phoneNumber}
                </span>
              )}
              {settings.faxNumber && (
                <span className="flex items-center gap-1.5">
                  <span className="opacity-60 text-[9px]">📠</span> {settings.faxNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-10 text-right">
          <div>
            <div className="text-2xl font-black text-slate-800 tracking-tighter">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
            <div className="text-lg font-bold text-slate-400 mt-1 flex items-center justify-end gap-3">
              <span>현재시각</span>
              <span className="text-pink-400 font-black">{new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>
          </div>
          <Link 
            to="/admin" 
            className="rounded-[2rem] p-5 text-slate-300 transition-all hover:bg-pink-50 hover:text-pink-500 border border-transparent hover:border-pink-100 shadow-sm"
            title="Settings"
          >
            <Settings size={36} />
          </Link>
        </div>
      </header>

      {/* Main Dashboard Area */}
      <main className="flex flex-col gap-8 p-10">
        {/* Top Info Row */}
        <div className="grid grid-cols-12 gap-8">
          {/* Vision Block */}
          <div className="col-span-3 rounded-[2.5rem] border border-blue-50 bg-blue-50/20 p-8 shadow-sm backdrop-blur-sm flex flex-col justify-center">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-300"></div>
              <h3 className="text-xs font-black tracking-widest text-blue-400 uppercase">Vision</h3>
            </div>
            <div className="text-center">
              <p className="text-base font-black leading-relaxed text-slate-700 italic underline decoration-blue-100 decoration-2 underline-offset-4">
                "{settings.schoolVision}"
              </p>
            </div>
          </div>
          
          {/* Notice Block */}
          {/* Notice Block */}
          <div className="col-span-3 rounded-[2.5rem] border border-orange-50 bg-orange-50/20 p-8 shadow-sm backdrop-blur-sm overflow-hidden flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1.5 rounded-full bg-orange-300"></div>
                <h3 className="text-xs font-black tracking-widest text-orange-500 uppercase">Notice</h3>
              </div>
              <span className="font-mono text-[10px] font-black text-orange-200">전달사항</span>
            </div>
            <div className="overflow-y-auto px-4 flex-1">
              <NoticeBoard notices={notices} />
            </div>
          </div>
        </div>

        {/* Classes Board: 3 Columns for 3 Grades */}
        <div className="grid grid-cols-3 gap-8">
          {[1, 2, 3].map((grade, idx) => (
            <motion.div 
              key={grade}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="flex flex-col"
            >
              <ClassBoard classes={classes} grade={grade} />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex h-20 shrink-0 items-center justify-between bg-slate-900 px-12 text-sm tracking-widest text-slate-400 mt-auto border-t-[8px] border-pink-100/50">
        <div className="flex flex-col gap-1">
          <div className="text-xs opacity-50 font-bold">School Status Display System v2.2 • © {settings.schoolName}</div>
        </div>
        <div className="flex items-center gap-8 text-right">
          <a 
            href="https://www.instagram.com/jae2_ethics?igsh=MXFxbTRxNHF0a3h4NQ%3D%3D&utm_source=qr" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex flex-col group hover:opacity-80 transition-opacity"
          >
            <span className="text-[10px] uppercase tracking-tighter opacity-50 group-hover:opacity-70 transition-opacity">Designer & Developer</span>
            <div className="text-slate-300 font-bold">
              개발자 : 허재이 <span className="text-xs opacity-50 ml-2 font-medium">Instagram @jae2_ethics</span>
            </div>
          </a>
        </div>
      </footer>
    </div>
  );
}
