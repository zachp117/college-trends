export interface Pin {
  schoolId: number;
  schoolName: string;
}

export async function fetchPins(): Promise<Pin[]> {
  const res = await fetch('/api/pins', { credentials: 'include' });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error(`pins fetch failed: ${res.status}`);
  }
  const json = (await res.json()) as { pins: Pin[] };
  return json.pins;
}

export async function addPin(schoolId: number, schoolName: string): Promise<void> {
  const res = await fetch('/api/pins', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolId, schoolName }),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error ?? `pin add failed: ${res.status}`);
  }
}

export async function removePin(schoolId: number): Promise<void> {
  const res = await fetch(`/api/pins/${schoolId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`pin remove failed: ${res.status}`);
  }
}
