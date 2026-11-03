import { database } from "../database/database.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  dateOfBirth: string | null;
  gender: string | null;
  phoneNumber: string | null;
  location: string | null;
}

export interface UserWithPassword extends AuthUser {
  passwordHash: string;
  emailVerifiedAt: string | null;
}

export function findUserByEmail(email: string): UserWithPassword | null {
  const row = database.prepare(`
    SELECT id, name, email, password_hash, created_at, email_verified_at, date_of_birth, gender, phone_number, location FROM users WHERE email = ?
  `).get(email);
  if (!row) return null;
  const user = row as { id: string; name: string; email: string; password_hash: string; created_at: string; email_verified_at: string | null; date_of_birth: string | null; gender: string | null; phone_number: string | null; location: string | null };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    emailVerifiedAt: user.email_verified_at,
    dateOfBirth: user.date_of_birth,
    gender: user.gender,
    phoneNumber: user.phone_number,
    location: user.location,
    createdAt: user.created_at,
  };
}

export function findUserById(id: string): UserWithPassword | null {
  const row = database.prepare(`
    SELECT id, name, email, password_hash, created_at, email_verified_at, date_of_birth, gender, phone_number, location FROM users WHERE id = ?
  `).get(id);
  if (!row) return null;
  const user = row as { id: string; name: string; email: string; password_hash: string; created_at: string; email_verified_at: string | null; date_of_birth: string | null; gender: string | null; phone_number: string | null; location: string | null };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.password_hash,
    emailVerifiedAt: user.email_verified_at,
    dateOfBirth: user.date_of_birth,
    gender: user.gender,
    phoneNumber: user.phone_number,
    location: user.location,
    createdAt: user.created_at,
  };
}

export function updateUserProfile(id: string, profile: { name: string; dateOfBirth: string | null; gender: string | null; phoneNumber: string | null; location: string | null }): AuthUser | null {
  const result = database.prepare("UPDATE users SET name = ?, date_of_birth = ?, gender = ?, phone_number = ?, location = ? WHERE id = ?")
    .run(profile.name, profile.dateOfBirth, profile.gender, profile.phoneNumber, profile.location, id);
  if (result.changes === 0) return null;
  const user = findUserById(id);
  return user ? { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, dateOfBirth: user.dateOfBirth, gender: user.gender, phoneNumber: user.phoneNumber, location: user.location } : null;
}

export function changeUserPassword(id: string, passwordHash: string, keepSessionHash: string): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, id);
    database.prepare("DELETE FROM user_sessions WHERE user_id = ? AND token_hash != ?").run(id, keepSessionHash);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function createPasswordResetToken(userId: string, tokenHash: string, createdAt: string, expiresAt: string): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? OR expires_at <= ?").run(userId, createdAt);
    database.prepare(`INSERT INTO password_reset_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`)
      .run(tokenHash, userId, createdAt, expiresAt);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function findUserIdForPasswordReset(tokenHash: string, now: string): string | null {
  const row = database.prepare("SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND expires_at > ?")
    .get(tokenHash, now) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

export function completePasswordReset(userId: string, tokenHash: string, passwordHash: string, now: string): boolean {
  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database.prepare(`SELECT user_id FROM password_reset_tokens WHERE token_hash = ? AND user_id = ? AND expires_at > ?`)
      .get(tokenHash, userId, now);
    if (!row) {
      database.exec("ROLLBACK");
      return false;
    }
    database.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, userId);
    database.prepare("DELETE FROM user_sessions WHERE user_id = ?").run(userId);
    database.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").run(userId);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function createEmailVerificationToken(userId: string, tokenHash: string, createdAt: string, expiresAt: string): void {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM email_verification_tokens WHERE user_id = ? OR expires_at <= ?").run(userId, createdAt);
    database.prepare("INSERT INTO email_verification_tokens (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .run(tokenHash, userId, createdAt, expiresAt);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function findUnverifiedUserByEmail(email: string): AuthUser | null {
  const row = database.prepare("SELECT id, name, email, created_at FROM users WHERE email = ? AND email_verified_at IS NULL").get(email);
  if (!row) return null;
  const user = row as { id: string; name: string; email: string; created_at: string };
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at, dateOfBirth: null, gender: null, phoneNumber: null, location: null };
}

export function verifyUserEmail(tokenHash: string, now: string): boolean {
  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database.prepare("SELECT user_id FROM email_verification_tokens WHERE token_hash = ? AND expires_at > ?")
      .get(tokenHash, now) as { user_id: string } | undefined;
    if (!row) {
      database.exec("ROLLBACK");
      return false;
    }
    database.prepare("UPDATE users SET email_verified_at = ? WHERE id = ? AND email_verified_at IS NULL").run(now, row.user_id);
    database.prepare("DELETE FROM email_verification_tokens WHERE user_id = ?").run(row.user_id);
    database.exec("COMMIT");
    return true;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function createUserAndClaimLegacyData(user: UserWithPassword): AuthUser {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare(`
      INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, user.passwordHash, user.createdAt);
    database.prepare("UPDATE decisions SET user_id = ? WHERE user_id IS NULL").run(user.id);
    database.prepare("UPDATE decision_drafts SET user_id = ? WHERE user_id IS NULL").run(user.id);
    database.exec("COMMIT");
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, dateOfBirth: null, gender: null, phoneNumber: null, location: null };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function findOrCreateGoogleUser(user: {
  id: string;
  googleSub: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}): AuthUser {
  database.exec("BEGIN IMMEDIATE");
  try {
    const byGoogle = database.prepare("SELECT id FROM users WHERE google_sub = ?").get(user.googleSub) as { id: string } | undefined;
    if (byGoogle) {
      const existing = findUserById(byGoogle.id);
      if (!existing) throw new Error("Google account is linked to a missing user.");
      database.exec("COMMIT");
      return existing;
    }

    const byEmail = findUserByEmail(user.email);
    if (byEmail) {
      database.prepare("UPDATE users SET google_sub = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?")
        .run(user.googleSub, user.createdAt, byEmail.id);
      const linked = findUserById(byEmail.id);
      if (!linked) throw new Error("Unable to load the linked Google account.");
      database.exec("COMMIT");
      return linked;
    }

    database.prepare(`
      INSERT INTO users (id, name, email, password_hash, google_sub, email_verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, user.name, user.email, user.passwordHash, user.googleSub, user.createdAt, user.createdAt);
    database.prepare("UPDATE decisions SET user_id = ? WHERE user_id IS NULL").run(user.id);
    database.prepare("UPDATE decision_drafts SET user_id = ? WHERE user_id IS NULL").run(user.id);
    const created = findUserById(user.id);
    if (!created) throw new Error("Unable to load the new Google account.");
    database.exec("COMMIT");
    return created;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function createSession(tokenHash: string, userId: string, createdAt: string, expiresAt: string): void {
  database.prepare("DELETE FROM user_sessions WHERE expires_at <= ?").run(createdAt);
  database.prepare(`
    INSERT INTO user_sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)
  `).run(tokenHash, userId, createdAt, expiresAt);
}

export function findUserForSession(tokenHash: string, now: string): AuthUser | null {
  const row = database.prepare(`
    SELECT users.id, users.name, users.email, users.created_at, users.date_of_birth, users.gender, users.phone_number, users.location
    FROM user_sessions JOIN users ON users.id = user_sessions.user_id
    WHERE user_sessions.token_hash = ? AND user_sessions.expires_at > ?
  `).get(tokenHash, now);
  if (!row) return null;
  const user = row as { id: string; name: string; email: string; created_at: string; date_of_birth: string | null; gender: string | null; phone_number: string | null; location: string | null };
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at, dateOfBirth: user.date_of_birth, gender: user.gender, phoneNumber: user.phone_number, location: user.location };
}

export function deleteSession(tokenHash: string): void {
  database.prepare("DELETE FROM user_sessions WHERE token_hash = ?").run(tokenHash);
}

export function deleteUserAndOwnedData(userId: string): boolean {
  database.exec("BEGIN IMMEDIATE");
  try {
    const result = database.prepare("DELETE FROM users WHERE id = ?").run(userId);
    database.exec("COMMIT");
    return result.changes > 0;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}
