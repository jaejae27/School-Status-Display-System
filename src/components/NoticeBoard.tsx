import { Notice } from "../types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Megaphone } from "lucide-react";

interface Props {
  notices: Notice[];
}

export default function NoticeBoard({ notices }: Props) {
  const sortedNotices = [...notices].sort((a, b) => b.createdAt - a.createdAt);

  if (sortedNotices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-slate-400">
        <Megaphone size={32} className="mb-2 opacity-20" />
        <p className="text-sm font-medium">등록된 공지사항이 없습니다.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {sortedNotices.map((notice) => (
        <li key={notice.id} className="group flex gap-3 text-base">
          <span className="shrink-0 text-orange-400 font-black text-lg">•</span>
          <span className="text-slate-700 leading-relaxed font-semibold">
            {notice.content}
          </span>
        </li>
      ))}
    </ul>
  );
}
