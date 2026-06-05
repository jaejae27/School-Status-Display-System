import { ClassData } from "../types";
import { useMemo } from "react";

interface Props {
  classes: ClassData[];
}

export default function ClassBoard({ classes }: Props) {
  const grades = [1, 2, 3];

  const getGradeTheme = (grade: number) => {
    switch (grade) {
      case 1:
        return {
          bg: "bg-green-50/40",
          border: "border-green-100",
          header: "bg-green-400/90",
          text: "text-green-800",
          accent: "bg-green-50",
          rowHover: "hover:bg-green-100/40"
        };
      case 2:
        return {
          bg: "bg-sky-50/40",
          border: "border-sky-100",
          header: "bg-sky-400/90",
          text: "text-sky-800",
          accent: "bg-sky-50",
          rowHover: "hover:bg-sky-100/40"
        };
      case 3:
        return {
          bg: "bg-pink-50/40",
          border: "border-pink-100",
          header: "bg-pink-400/90",
          text: "text-pink-800",
          accent: "bg-pink-50",
          rowHover: "hover:bg-pink-100/40"
        };
      default:
        return {
          bg: "bg-slate-50/40",
          border: "border-slate-100",
          header: "bg-slate-400/90",
          text: "text-slate-800",
          accent: "bg-slate-50",
          rowHover: "hover:bg-slate-100/40"
        };
    }
  };

  return (
    <div className="space-y-12">
      {grades.map((grade) => {
        const gradeClasses = classes
          .filter((c) => c.grade === grade)
          .sort((a, b) => a.classNumber - b.classNumber);
        
        if (gradeClasses.length === 0) return null;
        const theme = getGradeTheme(grade);

        return (
          <div key={grade} className={`rounded-[2.5rem] border-2 ${theme.border} ${theme.bg} overflow-hidden shadow-sm backdrop-blur-sm`}>
            <div className={`px-8 py-4 ${theme.header} text-white flex items-center justify-between shadow-md`}>
              <h4 className="text-2xl font-black">
                {grade}학년 현황판
              </h4>
              <span className="text-sm font-black opacity-90 uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                {gradeClasses.length} CLASSES
              </span>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className={`${theme.accent} text-sm font-black uppercase tracking-widest ${theme.text} border-b ${theme.border} opacity-80`}>
                  <th className="px-6 py-4 text-center w-24">학급</th>
                  <th className="px-6 py-4 text-left">담임 교사</th>
                  <th className="px-6 py-4 text-left">부담임 교사</th>
                  <th className="px-6 py-4 text-center w-40">인원 (남/여)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white bg-white/40">
                {gradeClasses.map((cls) => (
                  <tr key={cls.id} className={`${theme.rowHover} transition-colors group`}>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-block w-14 h-14 leading-[3.5rem] rounded-2xl bg-white shadow-sm font-black text-2xl ${theme.text} group-hover:scale-110 transition-transform`}>
                        {cls.classNumber}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-800 font-bold text-lg whitespace-nowrap">
                      {cls.homeroomTeacher}
                    </td>
                    <td className="px-6 py-5 text-slate-500 font-bold italic text-sm opacity-80 whitespace-nowrap">
                      {cls.assistantTeacher || "—"}
                    </td>
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className="font-black text-slate-800 text-2xl">{cls.boysCount + cls.girlsCount}</span>
                      <span className="ml-2 text-base text-slate-400 font-mono font-black">({cls.boysCount}/{cls.girlsCount})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
      {classes.length === 0 && (
        <div className="py-20 flex items-center justify-center text-slate-300 italic text-lg bg-white rounded-3xl border border-dashed border-slate-200">
          등록된 학급 정보가 없습니다.
        </div>
      )}
    </div>
  );
}

