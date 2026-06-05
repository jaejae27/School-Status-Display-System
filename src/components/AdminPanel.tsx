import React, { useState, useEffect } from "react";
import { storage } from "../lib/storage";
import { SchoolSettings, ClassData, MonthlyEvent, Notice } from "../types";
import { ArrowLeft, Save, Upload, Download, Plus, Trash2, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as xlsx from "xlsx";
import { doc, collection, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

type Tab = "general" | "classes" | "events" | "notices";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: "",
    schoolVision: "",
    address: "",
    logoUrl: "",
    schoolType: "high",
    firstPeriodStartTime: "08:30",
    assemblyTime: "08:10",
  });

  const [classes, setClasses] = useState<ClassData[]>([]);
  const [events, setEvents] = useState<MonthlyEvent[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const s = await storage.getSettings();
      if (s) setSettings(s);
      
      const c = await storage.getClasses();
      setClasses(c);
      
      const e = await storage.getEvents();
      setEvents(e);
      
      const n = await storage.getNotices();
      setNotices(n);
    };

    fetchData();

    const unsubscribe = storage.onDataUpdate((data) => {
      if (data.settings) setSettings(data.settings);
      setClasses(data.classes);
      setEvents(data.events);
      setNotices(data.notices);
    });

    return () => unsubscribe();
  }, []);

  const saveSettings = async () => {
    await storage.saveSettings(settings);
    alert("설정이 저장되었습니다.");
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Class Management
  const addClass = async () => {
    const newClass: ClassData = {
      id: Math.random().toString(36).substr(2, 9),
      grade: 1,
      classNumber: classes.length + 1,
      homeroomTeacher: "",
      assistantTeacher: "",
      boysCount: 0,
      girlsCount: 0,
    };
    await storage.updateClass(newClass);
  };

  const downloadClassTemplate = () => {
    const data = [
      ["학년", "반", "담임", "부담임", "남", "여"],
      [1, 1, "홍길동", "이순신", 15, 15],
    ];
    const ws = xlsx.utils.aoa_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Classes");
    xlsx.writeFile(wb, "class_template.xlsx");
  };

  const uploadClasses = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const dataBuffer = event.target?.result as ArrayBuffer;
        const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Use defval to ensure all keys exist even if cell is empty
        const rawData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        const formattedClasses = rawData.map((row: any) => {
          // Normalize keys by trimming
          const normalizedRow: any = {};
          Object.keys(row).forEach(key => {
            normalizedRow[key.trim()] = row[key];
          });

          return {
            grade: parseInt(normalizedRow["학년"]),
            classNumber: parseInt(normalizedRow["반"]),
            homeroomTeacher: String(normalizedRow["담임"] || "").trim(),
            assistantTeacher: String(normalizedRow["부담임"] || "").trim(),
            boysCount: parseInt(normalizedRow["남"]) || 0,
            girlsCount: parseInt(normalizedRow["여"]) || 0,
          };
        }).filter(c => !isNaN(c.grade) && !isNaN(c.classNumber));

        if (formattedClasses.length === 0) {
          alert("데이터가 없거나 양식이 올바르지 않습니다.");
          return;
        }

        const isGAS = typeof window !== 'undefined' && (window as any).google && (window as any).google.script;
        if (isGAS) {
          await storage.saveClasses(formattedClasses.map((c: any) => ({ ...c, id: Math.random().toString(36).substr(2, 9) })));
        } else {
          const batch = writeBatch(db);
          // Delete existing classes
          classes.forEach((c) => batch.delete(doc(db, "classes", c.id)));
          // Add new classes
          formattedClasses.forEach((c: any) => {
            const newRef = doc(collection(db, "classes"));
            batch.set(newRef, c);
          });
          await batch.commit();
        }
        alert(`학급 정보 ${formattedClasses.length}개가 업데이트되었습니다.`);
      } catch (err) {
        console.error("Excel parse error:", err);
        alert("엑셀 파일 파싱에 실패했습니다.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Event Management
  const uploadEvents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isGAS = typeof window !== 'undefined' && (window as any).google && (window as any).google.script;
    if (isGAS) {
      alert("AI 일정 추출 기능은 AI Studio 환경에서만 지원됩니다. GAS 환경에서는 수동으로 입력해주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/events", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      const isGAS = typeof window !== 'undefined' && (window as any).google && (window as any).google.script;
      const newEvents = Object.entries(data).filter(([_, content]) => !!content).map(([day, content]) => ({
        id: Math.random().toString(36).substr(2, 9),
        date: day,
        content: content as string
      }));

      if (isGAS) {
        await storage.saveEvents(newEvents);
      } else {
        const batch = writeBatch(db);
        events.forEach((ev) => batch.delete(doc(db, "events", ev.id)));
        newEvents.forEach((ev) => {
          const newRef = doc(collection(db, "events"));
          batch.set(newRef, { date: ev.date, content: ev.content });
        });
        await batch.commit();
      }
      alert("월중 행사가 업데이트되었습니다.");
    }
  };

  // Notice Management
  const addNotice = async (content: string) => {
    if (!content) return;
    const newNotice: Notice = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      createdAt: Date.now(),
    };
    await storage.addNotice(newNotice);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl p-6 lg:p-10">
      <header className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="rounded-full bg-white p-2 text-slate-400 shadow-sm transition-all hover:text-slate-900 border"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none">관리자 설정</h1>
            <p className="mt-2 text-slate-500 font-medium flex items-center gap-1.5">
              <ShieldCheck size={16} /> Dashboard Configuration Panel
            </p>
          </div>
        </div>
        <button 
          onClick={saveSettings}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
        >
          <Save size={18} />
          모든 변경사항 저장
        </button>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <nav className="flex flex-col gap-2">
          {[
            { id: "general", label: "일반 설정", icon: "⚙️" },
            { id: "classes", label: "학급 관리", icon: "🏫" },
            { id: "events", label: "월중 행사", icon: "🗓️" },
            { id: "notices", label: "공지사항", icon: "📢" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 shadow-sm outline outline-1 outline-blue-100"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </span>
              <ChevronRight size={16} className={activeTab === tab.id ? "opacity-100" : "opacity-0"} />
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/50 outline outline-1 outline-slate-100">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">학교명</label>
                    <input 
                      type="text" 
                      value={settings.schoolName}
                      onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                      placeholder="OO고등학교"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">학교 유형</label>
                    <select 
                      value={settings.schoolType}
                      onChange={(e) => setSettings({ ...settings, schoolType: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    >
                      <option value="elementary">초등학교 (40분)</option>
                      <option value="middle">중학교 (45분)</option>
                      <option value="high">고등학교 (50분)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">학교 구분 (성별)</label>
                    <select 
                      value={settings.genderType || "coed"}
                      onChange={(e) => setSettings({ ...settings, genderType: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    >
                      <option value="coed">남녀공학</option>
                      <option value="boys">남학교</option>
                      <option value="girls">여학교</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">학교 비전</label>
                    <input 
                      type="text" 
                      value={settings.schoolVision}
                      onChange={(e) => setSettings({ ...settings, schoolVision: e.target.value })}
                      placeholder="꿈을 키우는 행복한 학교"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">주소</label>
                    <input 
                      type="text" 
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder="도시, 거리 정보"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">전화번호</label>
                    <input 
                      type="text" 
                      value={settings.phoneNumber || ""}
                      onChange={(e) => setSettings({ ...settings, phoneNumber: e.target.value })}
                      placeholder="02-123-4567"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">팩스번호</label>
                    <input 
                      type="text" 
                      value={settings.faxNumber || ""}
                      onChange={(e) => setSettings({ ...settings, faxNumber: e.target.value })}
                      placeholder="02-123-4568"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">1교시 시작 시간</label>
                    <input 
                      type="time" 
                      value={settings.firstPeriodStartTime}
                      onChange={(e) => setSettings({ ...settings, firstPeriodStartTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">조회 시간 (미입력 시 제외)</label>
                    <input 
                      type="time" 
                      value={settings.assemblyTime}
                      onChange={(e) => setSettings({ ...settings, assemblyTime: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">표시 월 (월중 계획 제목)</label>
                    <select 
                      value={settings.currentMonth || new Date().getMonth() + 1}
                      onChange={(e) => setSettings({ ...settings, currentMonth: parseInt(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}월</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-700">학교 마크 (정사각형 권장)</label>
                  <div className="flex items-center gap-6">
                    <div className="h-24 w-24 overflow-hidden rounded-2xl bg-slate-100 border-2 border-slate-100 shadow-inner flex items-center justify-center">
                      {settings.logoUrl ? (
                        <img src={settings.logoUrl} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-slate-300 text-xs">No Image</span>
                      )}
                    </div>
                    <label className="cursor-pointer rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95">
                      이미지 선택
                      <input type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "classes" && (
              <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={addClass}
                      className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95"
                    >
                      <Plus size={16} /> 학급 추가
                    </button>
                    <button 
                      onClick={downloadClassTemplate}
                      className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                    >
                      <Download size={16} /> 양식 다운로드
                    </button>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-slate-100 bg-slate-50 px-5 py-2 text-sm font-bold text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600">
                    <Upload size={16} /> 엑셀 파일 올리기
                    <input type="file" onChange={uploadClasses} className="hidden" accept=".xlsx,.xls" />
                  </label>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3">학년/반</th>
                        <th className="px-4 py-3">담임</th>
                        <th className="px-4 py-3">부담임</th>
                        {(settings.genderType === "coed" || settings.genderType === "boys" || !settings.genderType) && <th className="px-4 py-3">남</th>}
                        {(settings.genderType === "coed" || settings.genderType === "girls" || !settings.genderType) && <th className="px-4 py-3">여</th>}
                        <th className="w-10 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {classes.sort((a,b) => a.grade - b.grade || a.classNumber - b.classNumber).map((cls) => (
                        <tr key={cls.id}>
                          <td className="px-4 py-2">
                            <div className="flex gap-1 items-center">
                              <input 
                                type="number" 
                                value={cls.grade}
                                onChange={(e) => storage.updateClass({ ...cls, grade: parseInt(e.target.value) })}
                                className="w-12 rounded-lg bg-slate-50 px-2 py-1 outline-none text-center font-bold"
                              />
                              <span className="text-slate-400">/</span>
                              <input 
                                type="number" 
                                value={cls.classNumber}
                                onChange={(e) => storage.updateClass({ ...cls, classNumber: parseInt(e.target.value) })}
                                className="w-12 rounded-lg bg-slate-50 px-2 py-1 outline-none text-center font-bold"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              defaultValue={cls.homeroomTeacher}
                              onBlur={(e) => {
                                if (e.target.value !== cls.homeroomTeacher) {
                                  storage.updateClass({ ...cls, homeroomTeacher: e.target.value });
                                }
                              }}
                              className="w-full rounded-lg bg-slate-50 px-3 py-1 outline-none font-bold"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              defaultValue={cls.assistantTeacher}
                              onBlur={(e) => {
                                if (e.target.value !== cls.assistantTeacher) {
                                  storage.updateClass({ ...cls, assistantTeacher: e.target.value });
                                }
                              }}
                              className="w-full rounded-lg bg-slate-50 px-3 py-1 outline-none"
                            />
                          </td>
                          {(settings.genderType === "coed" || settings.genderType === "boys" || !settings.genderType) && (
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={cls.boysCount}
                                onChange={(e) => storage.updateClass({ ...cls, boysCount: parseInt(e.target.value) || 0 })}
                                className="w-16 rounded-lg bg-slate-50 px-2 py-1 outline-none text-center"
                              />
                            </td>
                          )}
                          {(settings.genderType === "coed" || settings.genderType === "girls" || !settings.genderType) && (
                            <td className="px-4 py-2">
                              <input 
                                type="number" 
                                value={cls.girlsCount}
                                onChange={(e) => storage.updateClass({ ...cls, girlsCount: parseInt(e.target.value) || 0 })}
                                className="w-16 rounded-lg bg-slate-50 px-2 py-1 outline-none text-center"
                              />
                            </td>
                          )}
                          <td className="p-2">
                            <button 
                              onClick={() => storage.deleteClass(cls.id)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "events" && (
              <div className="space-y-6">
                <div className="rounded-xl bg-blue-50 p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-900">월중 행사 일정 관리</h3>
                  <p className="text-sm text-blue-700/70 font-medium">1일부터 31일까지 각 날짜의 행사 내용을 입력하세요.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const event = events.find(e => parseInt(e.date) === day);
                    return (
                      <div key={day} className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <label className="text-xs font-black text-slate-400 flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-slate-600 text-[10px]">{day}</span>
                          날짜
                        </label>
                        <input 
                          type="text" 
                          defaultValue={event?.content || ""}
                          onBlur={async (e) => {
                            const val = e.target.value;
                            if (event) {
                              if (val !== event.content) {
                                await storage.updateEvent({ ...event, content: val });
                              }
                            } else if (val) {
                              await storage.updateEvent({ id: Math.random().toString(36).substr(2, 9), date: day.toString(), content: val });
                            }
                          }}
                          placeholder="행사 내용 입력"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all font-bold text-slate-700"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "notices" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-slate-700">공지 내용</label>
                  <textarea 
                    id="noticeContent"
                    placeholder="교직원에게 전달할 내용을 입력하세요..."
                    className="h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                  <button 
                    onClick={() => {
                      const el = document.getElementById("noticeContent") as HTMLTextAreaElement;
                      addNotice(el.value);
                      el.value = "";
                    }}
                    className="self-end rounded-xl bg-slate-900 px-6 py-2.5 font-bold text-white transition-all hover:bg-slate-800 active:scale-95"
                  >
                    공유하기
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-700">등록된 공지 목록</h3>
                  {notices.sort((a,b) => b.createdAt - a.createdAt).map((notice) => (
                    <div key={notice.id} className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">{notice.content}</p>
                      <button 
                        onClick={() => storage.deleteNotice(notice.id)}
                        className="shrink-0 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
