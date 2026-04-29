import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ----- Better Auth core tables -----
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ----- App tables -----

// A counselor's client (a high-school student they're advising).
export const student = sqliteTable('student', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  // optional metadata for the student profile
  graduationYear: integer('graduation_year'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// A school on a student's college list. Each student has one logical list
// (we'll add support for multiple named lists later if needed).
export const studentSchool = sqliteTable('student_school', {
  id: text('id').primaryKey(),
  studentId: text('student_id')
    .notNull()
    .references(() => student.id, { onDelete: 'cascade' }),
  schoolId: integer('school_id').notNull(),
  schoolName: text('school_name').notNull(),
  // 'reach' | 'match' | 'safety' | null
  tier: text('tier'),
  // 'considering' | 'applied' | 'accepted' | 'rejected' | 'waitlisted' | 'enrolled' | null
  status: text('status'),
  // free-text note from the counselor about this school for this student
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// "Pinned" schools at the user level — separate from per-student lists.
// This replaces the existing URL-based pinning so it persists across sessions.
export const pinnedSchool = sqliteTable('pinned_school', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  schoolId: integer('school_id').notNull(),
  schoolName: text('school_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
