export type Tier = 'reach' | 'match' | 'safety' | null;
export type StudentSchoolStatus =
  | 'considering'
  | 'applied'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'
  | 'enrolled'
  | null;

export interface Student {
  id: string;
  userId: string;
  name: string;
  graduationYear: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentWithCount extends Student {
  schoolCount: number;
}

export interface StudentSchool {
  id: string;
  studentId: string;
  schoolId: number;
  schoolName: string;
  tier: Tier;
  status: StudentSchoolStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function listStudents(): Promise<StudentWithCount[]> {
  const r = await api<{ students: StudentWithCount[] }>('/api/students');
  return r.students;
}

export async function createStudent(input: {
  name: string;
  graduationYear?: number | null;
  notes?: string | null;
}): Promise<string> {
  const r = await api<{ id: string }>('/api/students', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return r.id;
}

export async function getStudent(
  id: string,
): Promise<{ student: Student; schools: StudentSchool[] }> {
  return await api(`/api/students/${id}`);
}

export async function updateStudent(
  id: string,
  patch: { name?: string; graduationYear?: number | null; notes?: string | null },
): Promise<void> {
  await api(`/api/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await api(`/api/students/${id}`, { method: 'DELETE' });
}

export async function addSchoolToStudent(
  studentId: string,
  input: {
    schoolId: number;
    schoolName: string;
    tier?: Tier;
    status?: StudentSchoolStatus;
    note?: string | null;
  },
): Promise<string> {
  const r = await api<{ id: string }>(`/api/students/${studentId}/schools`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return r.id;
}

export async function updateStudentSchool(
  id: string,
  patch: { tier?: Tier; status?: StudentSchoolStatus; note?: string | null },
): Promise<void> {
  await api(`/api/student-schools/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function removeStudentSchool(id: string): Promise<void> {
  await api(`/api/student-schools/${id}`, { method: 'DELETE' });
}
