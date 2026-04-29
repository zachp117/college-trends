import { useEffect, useMemo, useState } from 'react';
import {
  getStudent,
  removeStudentSchool,
  updateStudent,
  updateStudentSchool,
} from '../lib/studentsApi';
import type {
  Student,
  StudentSchool,
  StudentSchoolStatus,
  Tier,
} from '../lib/studentsApi';

interface Props {
  studentId: string;
  onBack: () => void;
  onOpenSchoolDetail: (schoolId: number) => void;
}

const TIERS: { value: Tier; label: string; color: string }[] = [
  { value: null, label: '—', color: 'bg-slate-100 text-slate-500' },
  { value: 'reach', label: 'Reach', color: 'bg-rose-100 text-rose-700' },
  { value: 'match', label: 'Match', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'safety', label: 'Safety', color: 'bg-emerald-100 text-emerald-700' },
];

const STATUSES: { value: StudentSchoolStatus; label: string }[] = [
  { value: null, label: '—' },
  { value: 'considering', label: 'Considering' },
  { value: 'applied', label: 'Applied' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waitlisted', label: 'Waitlisted' },
  { value: 'enrolled', label: 'Enrolled' },
];

export function StudentDetailPage({ studentId, onBack, onOpenSchoolDetail }: Props) {
  const [student, setStudent] = useState<Student | null>(null);
  const [schools, setSchools] = useState<StudentSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await getStudent(studentId);
      setStudent(r.student);
      setSchools(r.schools);
      setName(r.student.name);
      setGraduationYear(r.student.graduationYear?.toString() ?? '');
      setNotes(r.student.notes ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load student');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const grouped = useMemo(() => {
    const groups: Record<string, StudentSchool[]> = {
      reach: [],
      match: [],
      safety: [],
      untagged: [],
    };
    for (const s of schools) {
      if (s.tier === 'reach') groups.reach.push(s);
      else if (s.tier === 'match') groups.match.push(s);
      else if (s.tier === 'safety') groups.safety.push(s);
      else groups.untagged.push(s);
    }
    return groups;
  }, [schools]);

  const saveProfile = async () => {
    if (!student) return;
    try {
      await updateStudent(student.id, {
        name: name.trim(),
        graduationYear: graduationYear ? Number(graduationYear) : null,
        notes: notes.trim() || null,
      });
      setEditingProfile(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const setTier = async (id: string, tier: Tier) => {
    setSchools((cur) => cur.map((s) => (s.id === id ? { ...s, tier } : s)));
    try {
      await updateStudentSchool(id, { tier });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const setStatus = async (id: string, status: StudentSchoolStatus) => {
    setSchools((cur) => cur.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await updateStudentSchool(id, { status });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const setNote = async (id: string, note: string) => {
    setSchools((cur) =>
      cur.map((s) => (s.id === id ? { ...s, note: note || null } : s)),
    );
    try {
      await updateStudentSchool(id, { note: note || null });
    } catch {
      // ignore — local state already updated
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the list?`)) return;
    try {
      await removeStudentSchool(id);
      setSchools((cur) => cur.filter((s) => s.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Remove failed');
    }
  };

  if (loading && !student) {
    return <div className="text-sm text-slate-500 py-8 text-center">Loading…</div>;
  }
  if (error && !student) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
        {error}
        <button
          onClick={onBack}
          className="block mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          ← Back
        </button>
      </div>
    );
  }
  if (!student) return null;

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
      >
        ← Back to students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
        {editingProfile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Graduation year
                </label>
                <input
                  type="number"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveProfile}
                className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingProfile(false);
                  setName(student.name);
                  setGraduationYear(student.graduationYear?.toString() ?? '');
                  setNotes(student.notes ?? '');
                }}
                className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">{student.name}</h1>
              <div className="text-sm text-slate-500 mt-1">
                Graduation: {student.graduationYear ?? '—'}
              </div>
              {student.notes && (
                <div className="text-sm text-slate-700 mt-2">{student.notes}</div>
              )}
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Edit profile
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
          {error}
        </div>
      )}

      {/* School list */}
      {schools.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <div className="text-base font-medium text-slate-700 mb-1">No schools on the list yet</div>
          <div className="text-sm">
            Browse the dashboard, click any school name, then use{' '}
            <span className="font-medium text-slate-700">+ Add to a student's list</span>{' '}
            on the school detail page.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {(['reach', 'match', 'safety', 'untagged'] as const).map((group) => {
            const items = grouped[group];
            if (items.length === 0) return null;
            const tierMeta = TIERS.find((t) =>
              group === 'untagged' ? t.value === null : t.value === group,
            );
            return (
              <div
                key={group}
                className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      tierMeta?.color ?? 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {group === 'untagged' ? 'Untagged' : tierMeta?.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {items.length} school{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50/50 text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">School</th>
                      <th className="px-3 py-2 text-left font-medium w-32">Tier</th>
                      <th className="px-3 py-2 text-left font-medium w-40">Status</th>
                      <th className="px-3 py-2 text-left font-medium">Note</th>
                      <th className="px-3 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s) => (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onOpenSchoolDetail(s.schoolId)}
                            className="text-slate-800 hover:text-indigo-700 hover:underline font-medium text-left"
                          >
                            {s.schoolName}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={s.tier ?? ''}
                            onChange={(e) =>
                              setTier(
                                s.id,
                                (e.target.value || null) as Tier,
                              )
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
                          >
                            {TIERS.map((t) => (
                              <option key={t.value ?? 'none'} value={t.value ?? ''}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={s.status ?? ''}
                            onChange={(e) =>
                              setStatus(
                                s.id,
                                (e.target.value || null) as StudentSchoolStatus,
                              )
                            }
                            className="rounded border border-slate-300 px-2 py-1 text-xs bg-white"
                          >
                            {STATUSES.map((st) => (
                              <option key={st.value ?? 'none'} value={st.value ?? ''}>
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            defaultValue={s.note ?? ''}
                            onBlur={(e) => {
                              if ((s.note ?? '') !== e.target.value) {
                                setNote(s.id, e.target.value);
                              }
                            }}
                            placeholder="Add a note…"
                            className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleRemove(s.id, s.schoolName)}
                            className="text-xs text-slate-400 hover:text-rose-700"
                            title="Remove from list"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
