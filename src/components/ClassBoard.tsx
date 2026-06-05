import { ClassData } from "../types";
import { useMemo } from "react";

interface Props {
  classes: ClassData[];
  grade?: number; // Optional grade filter
}

export default function ClassBoard({ classes, grade: filterGrade }: Props) {
  const grades = filterGrade ? [filterGrade] : [1, 2, 3];

  const getGradeTheme = (grade: number) => {
    switch (grade) {
      case 1:
        return {
          bg: "bg-green-50/10",
          border: "border-green-100",
          header: "bg-green-500",
          text: "text-green-800",
          accent: "bg-green-50/50",
          rowHover: "hover:bg-green-50/80"
        };
      case 2:
        return {
          bg: "bg-sky-50/10",
          border: "border-sky-100",
          header: "bg-sky-500",
          text: "text-sky-800",
          accent: "bg-sky-50/50",
          rowHover: "hover:bg-sky-50/80"
        };
      case 3:
        return {
          bg: "bg-pink-50/10",
          border: "border-pink-100",
          header: "bg-pink-500",
          text: "text-pink-800",
          accent: "bg-pink-50/50",
          rowHover: "hover:bg-pink-50/80"
        };
      default:
        return {
          bg: "bg-slate-50/10",
          border: "border-slate-100",
          header: "bg-slate-500",
          text: "text-slate-800",
          accent: "bg-slate-50/50",
          rowHover: "hover:bg-slate-50/80"
        };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {grades.map((grade) => {
        const gradeClasses = classes
          .filter((c) => c.grade === grade)
          .sort((a, b) => a.classNumber - b.classNumber);
        
        if (gradeClasses.length === 0) return null;
        const theme = getGradeTheme(grade);
        const gradeTotal = gradeClasses.reduce((acc, c) => acc + (c.boysCount || 0) + (c.girlsCount || 0), 0);

        return (
          <div key={grade} className={`rounded-[2rem] border ${theme.border} ${theme.bg} overflow-hidden shadow-sm backdrop-blur-sm flex flex-col h-full`}>
            <div className={`px-6 py-3 ${theme.header} text-white flex items-center justify-between`}>
              <h4 className="text-xl font-black">
                {grade}학년
              </h4>
              <span className="text-[10px] font-black opacity-90 uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                {gradeTotal}명
              </span>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className={`${theme.accent} text-[10px] font-black uppercase tracking-widest ${theme.text} border-b ${theme.border} opacity-80`}>
                  <th className="px-3 py-3 text-center w-14">학급</th>
                  <th className="px-3 py-3 text-left">담임</th>
                  <th className="px-3 py-3 text-left">부담임</th>
                  <th className="px-3 py-3 text-center w-24">인원</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {gradeClasses.map((cls) => (
                  <tr key={cls.id} className={`${theme.rowHover} transition-colors group`}>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-block w-10 h-10 leading-10 rounded-xl bg-white shadow-sm font-black text-lg ${theme.text} group-hover:scale-105 transition-transform`}>
                        {cls.classNumber}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-800 font-bold text-lg whitespace-nowrap">
                      {cls.homeroomTeacher}
                    </td>
                    <td className="px-3 py-3 text-slate-500 font-bold italic text-sm opacity-80 whitespace-nowrap">
                      {cls.assistantTeacher || "—"}
                    </td>
                    <td className="px-3 py-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center">
                        <span className="font-black text-slate-800 text-lg">{cls.boysCount + cls.girlsCount}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-black">({cls.boysCount}/{cls.girlsCount})</span>
                      </div>
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

