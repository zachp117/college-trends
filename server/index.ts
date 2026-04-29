import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { eq, and } from 'drizzle-orm';
import { auth } from './auth';
import { db, schema } from './db';

type AuthContext = {
  user: { id: string; email: string; name: string } | null;
  session: { id: string; userId: string } | null;
};

const app = new Hono<{ Variables: AuthContext }>();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }),
);

// ---- Better Auth: mount its handler at /api/auth/* ----
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// ---- Middleware: hydrate the user/session for every request ----
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) {
    c.set('user', session.user as AuthContext['user']);
    c.set('session', session.session as AuthContext['session']);
  } else {
    c.set('user', null);
    c.set('session', null);
  }
  await next();
});

// Helper guard
function requireUser(c: Parameters<Parameters<typeof app.get>[1]>[0]) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return user;
}

// ---- Pinned-schools API ----
app.get('/api/pins', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await db
    .select()
    .from(schema.pinnedSchool)
    .where(eq(schema.pinnedSchool.userId, user.id));
  return c.json({ pins: rows });
});

app.post('/api/pins', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = (await c.req.json()) as { schoolId: number; schoolName: string };
  if (typeof body.schoolId !== 'number' || typeof body.schoolName !== 'string') {
    return c.json({ error: 'Invalid body' }, 400);
  }
  // Cap at 5 pins per user
  const existing = await db
    .select()
    .from(schema.pinnedSchool)
    .where(eq(schema.pinnedSchool.userId, user.id));
  if (existing.find((p) => p.schoolId === body.schoolId)) {
    return c.json({ ok: true, alreadyPinned: true });
  }
  if (existing.length >= 5) {
    return c.json({ error: 'Pin limit reached (5)' }, 400);
  }
  await db.insert(schema.pinnedSchool).values({
    id: crypto.randomUUID(),
    userId: user.id,
    schoolId: body.schoolId,
    schoolName: body.schoolName,
    createdAt: new Date(),
  });
  return c.json({ ok: true });
});

app.delete('/api/pins/:schoolId', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const schoolId = Number(c.req.param('schoolId'));
  if (Number.isNaN(schoolId)) return c.json({ error: 'Invalid id' }, 400);
  await db
    .delete(schema.pinnedSchool)
    .where(
      and(
        eq(schema.pinnedSchool.userId, user.id),
        eq(schema.pinnedSchool.schoolId, schoolId),
      ),
    );
  return c.json({ ok: true });
});

// ---- Students API ----

// List all students for the logged-in counselor
app.get('/api/students', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const rows = await db
    .select()
    .from(schema.student)
    .where(eq(schema.student.userId, user.id));
  // Attach a count of schools per student
  const withCounts = await Promise.all(
    rows.map(async (s) => {
      const schools = await db
        .select({ id: schema.studentSchool.id })
        .from(schema.studentSchool)
        .where(eq(schema.studentSchool.studentId, s.id));
      return { ...s, schoolCount: schools.length };
    }),
  );
  return c.json({ students: withCounts });
});

// Create a student
app.post('/api/students', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const body = (await c.req.json()) as {
    name: string;
    graduationYear?: number | null;
    notes?: string | null;
  };
  if (!body.name || typeof body.name !== 'string') {
    return c.json({ error: 'name is required' }, 400);
  }
  const now = new Date();
  const id = crypto.randomUUID();
  await db.insert(schema.student).values({
    id,
    userId: user.id,
    name: body.name.trim(),
    graduationYear: body.graduationYear ?? null,
    notes: body.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return c.json({ id });
});

// Get a single student + their school list
app.get('/api/students/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const rows = await db
    .select()
    .from(schema.student)
    .where(and(eq(schema.student.id, id), eq(schema.student.userId, user.id)));
  if (rows.length === 0) return c.json({ error: 'Not found' }, 404);
  const schools = await db
    .select()
    .from(schema.studentSchool)
    .where(eq(schema.studentSchool.studentId, id));
  return c.json({ student: rows[0], schools });
});

// Update a student
app.patch('/api/students/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const body = (await c.req.json()) as {
    name?: string;
    graduationYear?: number | null;
    notes?: string | null;
  };
  // Verify ownership
  const owned = await db
    .select({ id: schema.student.id })
    .from(schema.student)
    .where(and(eq(schema.student.id, id), eq(schema.student.userId, user.id)));
  if (owned.length === 0) return c.json({ error: 'Not found' }, 404);
  const patch: Partial<typeof schema.student.$inferInsert> = { updatedAt: new Date() };
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if ('graduationYear' in body) patch.graduationYear = body.graduationYear ?? null;
  if ('notes' in body) patch.notes = body.notes ?? null;
  await db.update(schema.student).set(patch).where(eq(schema.student.id, id));
  return c.json({ ok: true });
});

// Delete a student
app.delete('/api/students/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  await db
    .delete(schema.student)
    .where(and(eq(schema.student.id, id), eq(schema.student.userId, user.id)));
  return c.json({ ok: true });
});

// ---- Student-school list management ----

// Add a school to a student's list
app.post('/api/students/:id/schools', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const studentId = c.req.param('id');
  const body = (await c.req.json()) as {
    schoolId: number;
    schoolName: string;
    tier?: string | null;
    status?: string | null;
    note?: string | null;
  };
  // Verify the student belongs to this user
  const owned = await db
    .select({ id: schema.student.id })
    .from(schema.student)
    .where(and(eq(schema.student.id, studentId), eq(schema.student.userId, user.id)));
  if (owned.length === 0) return c.json({ error: 'Not found' }, 404);
  if (typeof body.schoolId !== 'number' || typeof body.schoolName !== 'string') {
    return c.json({ error: 'Invalid body' }, 400);
  }
  // Idempotent: skip if already on the list
  const existing = await db
    .select({ id: schema.studentSchool.id })
    .from(schema.studentSchool)
    .where(
      and(
        eq(schema.studentSchool.studentId, studentId),
        eq(schema.studentSchool.schoolId, body.schoolId),
      ),
    );
  if (existing.length > 0) return c.json({ ok: true, alreadyOnList: true });
  const now = new Date();
  const id = crypto.randomUUID();
  await db.insert(schema.studentSchool).values({
    id,
    studentId,
    schoolId: body.schoolId,
    schoolName: body.schoolName,
    tier: body.tier ?? null,
    status: body.status ?? null,
    note: body.note ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return c.json({ id });
});

// Update tier / status / note on a list entry
app.patch('/api/student-schools/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const body = (await c.req.json()) as {
    tier?: string | null;
    status?: string | null;
    note?: string | null;
  };
  // Verify ownership via join: studentSchool → student → userId
  const owned = await db
    .select({ id: schema.studentSchool.id })
    .from(schema.studentSchool)
    .innerJoin(
      schema.student,
      eq(schema.studentSchool.studentId, schema.student.id),
    )
    .where(
      and(eq(schema.studentSchool.id, id), eq(schema.student.userId, user.id)),
    );
  if (owned.length === 0) return c.json({ error: 'Not found' }, 404);
  const patch: Partial<typeof schema.studentSchool.$inferInsert> = {
    updatedAt: new Date(),
  };
  if ('tier' in body) patch.tier = body.tier ?? null;
  if ('status' in body) patch.status = body.status ?? null;
  if ('note' in body) patch.note = body.note ?? null;
  await db.update(schema.studentSchool).set(patch).where(eq(schema.studentSchool.id, id));
  return c.json({ ok: true });
});

// Remove a school from a student's list
app.delete('/api/student-schools/:id', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  // Verify ownership
  const owned = await db
    .select({ id: schema.studentSchool.id })
    .from(schema.studentSchool)
    .innerJoin(
      schema.student,
      eq(schema.studentSchool.studentId, schema.student.id),
    )
    .where(
      and(eq(schema.studentSchool.id, id), eq(schema.student.userId, user.id)),
    );
  if (owned.length === 0) return c.json({ error: 'Not found' }, 404);
  await db.delete(schema.studentSchool).where(eq(schema.studentSchool.id, id));
  return c.json({ ok: true });
});

// ---- Health check ----
app.get('/api/health', (c) => c.json({ ok: true }));

// Suppress unused warning for the helper above
void requireUser;

const port = Number(process.env.PORT ?? 3001);
console.log(`Server running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
