import { useEffect, useState } from 'react';
import {
  createStudent,
  deleteStudent,
  listStudents,
} from '../lib/studentsApi';
import type { StudentWithCount } from '../lib/studentsApi';

interface Props {
  onOpenStudent: (id: string) => void;
  onBack: () => void;
}

export function StudentsPage({ onOpenStudent, onBack }: Props) {
  const [students, setStudents] = useState<StudentWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listStudents();
      setStudents(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createStudent({
        name: newName.trim(),
        graduationYear: newYear ? Number(newYear) : null,
        notes: newNotes.trim() || null,
      });
      setShowAdd(false);
      setNewName('');
      setNewYear('');
      setNewNotes('');
      await refresh();
      onOpenStudent(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create student');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This removes their school list. Cannot be undone.`)) return;
    try {
      await deleteStudent(id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-2"
          >
            ← Back to dashboard
          </button>
          <h2 className="text-xl font-semibold text-slate-900">Your students</h2>
          <p className="text-sm text-slate-500">
            Each student has their own school list with Reach/Match/Safety tags, status, and per-school notes.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
        >
          + Add student
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded p-3">
          {error}
        </div>
      )}

      {showAdd && (
        <form
          onSubmit={submit}
          className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Maya Chen"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Graduation year
              </label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="2026"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Interested in CS, no math anxiety"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="text-sm px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium"
            >
              {creating ? 'Adding…' : 'Add student'}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 py-8 text-center">Loading students…</div>
      ) : students.length === 0 && !showAdd ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500">
          <div className="text-base font-medium text-slate-700 mb-1">No students yet</div>
          <div className="text-sm">
            Add your first student to start building college lists for them.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Graduation
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Schools on list
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Notes
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <button
                      onClick={() => onOpenStudent(s.id)}
                      className="font-medium text-slate-800 hover:text-indigo-700 hover:underline"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s.graduationYear ?? '—'}</td>
                  <td className="px-4 py-2 text-slate-600 tabular-nums">{s.schoolCount}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs max-w-xs truncate">
                    {s.notes ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      className="text-xs text-slate-400 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
