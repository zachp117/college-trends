import { useEffect, useRef, useState } from 'react';
import { addSchoolToStudent, listStudents } from '../lib/studentsApi';
import type { StudentWithCount, Tier } from '../lib/studentsApi';

interface Props {
  schoolId: number;
  schoolName: string;
}

export function AddToStudentMenu({ schoolId, schoolName }: Props) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<StudentWithCount[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null);
  const [tier, setTier] = useState<Tier>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || students !== null) return;
    setLoading(true);
    listStudents()
      .then((s) => setStudents(s))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [open, students]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleAdd = async (studentId: string, studentName: string) => {
    try {
      await addSchoolToStudent(studentId, {
        schoolId,
        schoolName,
        tier,
      });
      setRecentlyAdded(studentName);
      setTimeout(() => setRecentlyAdded(null), 2000);
      setOpen(false);
    } catch {
      // ignore — could show a toast
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs px-3 py-1.5 rounded-md border font-medium bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition"
        title="Add this school to one of your students' lists"
      >
        {recentlyAdded ? `✓ Added to ${recentlyAdded}` : '👥 Add to a student'}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-md shadow-lg z-50 p-2 text-xs">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-500">
            Tier (optional)
          </div>
          <div className="flex gap-1 px-2 pb-2 border-b border-slate-100">
            {(['reach', 'match', 'safety'] as const).map((t) => {
              const active = tier === t;
              const colors: Record<string, string> = {
                reach: active ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700',
                match: active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700',
                safety: active ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700',
              };
              return (
                <button
                  key={t}
                  onClick={() => setTier(active ? null : t)}
                  className={`flex-1 px-2 py-1 rounded text-[11px] font-medium ${colors[t]}`}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              );
            })}
          </div>
          <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-500 mt-1">
            Add to which student?
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-2 py-3 text-slate-400">Loading students…</div>
            ) : students && students.length > 0 ? (
              students.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleAdd(s.id, s.name)}
                  className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded flex justify-between items-center"
                >
                  <span className="font-medium text-slate-800">{s.name}</span>
                  <span className="text-slate-400 text-[10px]">
                    {s.schoolCount} school{s.schoolCount === 1 ? '' : 's'}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-2 py-3 text-slate-500">
                No students yet.{' '}
                <a
                  href="/app/students"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Create one →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
