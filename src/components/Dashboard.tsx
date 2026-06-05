import { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SchoolSettings, ClassData, MonthlyEvent, Notice } from "../types";
import ClassBoard from "./ClassBoard";
import ScheduleBoard from "./ScheduleBoard";
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

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, "settings", "config"), (doc) => {
      if (doc.exists()) setSettings(doc.data() as SchoolSettings);
    });

    const unsubClasses = onSnapshot(collection(db, "classes"), (snapshot) => {
      setClasses(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ClassData)));
    });

    const unsubEvents = onSnapshot(collection(db, "events"), (snapshot) => {
      setEvents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MonthlyEvent)));
    });

    const unsubNotices = onSnapshot(collection(db, "notices"), (snapshot) => {
      setNotices(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Notice)));
    });

    return () => {
      unsubSettings();
      unsubClasses();
      unsubEvents();
      unsubNotices();
    };
  }, []);

  if (!settings) {
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
      <main className="grid grid-cols-12 gap-10 p-12">
        
        {/* Left Column: Vision & Notices */}
        <div className="col-span-3 flex flex-col gap-10">
          {/* Vision Block */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[3rem] border border-blue-50 bg-blue-50/40 p-12 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-2.5 rounded-full bg-blue-200"></div>
              <h3 className="text-base font-black tracking-widest text-blue-400 uppercase">School Vision</h3>
            </div>
            <div className="text-center px-4">
              <p className="text-xl font-black leading-relaxed text-slate-700 italic underline decoration-blue-100 decoration-4 underline-offset-8">
                "{settings.schoolVision}"
              </p>
            </div>
          </motion.div>
          
          {/* Notice Block */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[3rem] border border-orange-50 bg-orange-50/40 p-12 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-2.5 rounded-full bg-orange-200"></div>
                <h3 className="text-base font-black tracking-widest text-orange-400 uppercase">Notice</h3>
              </div>
              <span className="font-mono text-xs font-black text-orange-200">전달사항</span>
            </div>
            <div>
              <NoticeBoard notices={notices} />
            </div>
          </motion.div>

          {/* Events Block - Moved here */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[3rem] border border-red-50 bg-red-50/40 p-12 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-2.5 rounded-full bg-red-200"></div>
              <h3 className="text-base font-black tracking-widest text-red-400 uppercase">{settings.currentMonth || new Date().getMonth() + 1}월중 계획</h3>
            </div>
            <div>
              <EventBoard events={events} />
            </div>
          </motion.div>
        </div>

        {/* Center: Class Status Board */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-6 rounded-[3.5rem] border border-indigo-50 bg-indigo-50/20 p-12 shadow-sm backdrop-blur-sm"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-2.5 rounded-full bg-indigo-200"></div>
              <h3 className="text-base font-black tracking-widest text-indigo-400 uppercase">Class Status</h3>
            </div>
            <div className="flex gap-4">
              <span className="rounded-2xl bg-white px-6 py-2 text-sm font-black text-slate-600 shadow-sm border border-indigo-50/50">
                총 {classes.length}학급
              </span>
              <span className="rounded-2xl bg-indigo-400 text-white px-6 py-2 text-sm font-black shadow-lg">
                전체 {classes.reduce((acc, c) => acc + c.boysCount + c.girlsCount, 0)}명
              </span>
            </div>
          </div>
          
          <div>
            <ClassBoard classes={classes} />
          </div>
        </motion.div>

        {/* Right Column: Timetable */}
        <div className="col-span-3 flex flex-col gap-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[3rem] border border-emerald-50 bg-emerald-50/40 p-12 shadow-sm backdrop-blur-sm"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="h-10 w-2.5 rounded-full bg-emerald-200"></div>
              <h3 className="text-base font-black tracking-widest text-emerald-400 uppercase">시정표</h3>
            </div>
            <div>
              <ScheduleBoard settings={settings} />
            </div>
          </motion.div>
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
