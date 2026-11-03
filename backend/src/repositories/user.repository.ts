import { pool } from "../database/database.js";

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

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const res = await pool.query(
    `SELECT id, name, email, password_hash, created_at, email_verified_at, date_of_birth, gender, phone_number, location
     FROM users WHERE email = $1`,
    [email]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
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

export async function findUserById(id: string): Promise<UserWithPassword | null> {
  const res = await pool.query(
    `SELECT id, name, email, password_hash, created_at, email_verified_at, date_of_birth, gender, phone_number, location
     FROM users WHERE id = $1`,
    [id]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
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

export async function updateUserProfile(
  id: string,
  profile: { name: string; dateOfBirth: string | null; gender: string | null; phoneNumber: string | null; location: string | null }
): Promise<AuthUser | null> {
  const res = await pool.query(
    `UPDATE users
     SET name = $1, date_of_birth = $2, gender = $3, phone_number = $4, location = $5
     WHERE id = $6
     RETURNING id, name, email, created_at, date_of_birth, gender, phone_number, location`,
    [profile.name, profile.dateOfBirth, profile.gender, profile.phoneNumber, profile.location, id]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    dateOfBirth: user.date_of_birth,
    gender: user.gender,
    phoneNumber: user.phone_number,
    location: user.location,
  };
}

export async function changeUserPassword(id: string, passwordHash: string, keepSessionHash: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
    await client.query("DELETE FROM user_sessions WHERE user_id = $1 AND token_hash != $2", [id, keepSessionHash]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createPasswordResetToken(userId: string, tokenHash: string, createdAt: string, expiresAt: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1 OR expires_at <= $2", [userId, createdAt]);
    await client.query(
      "INSERT INTO password_reset_tokens (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)",
      [tokenHash, userId, createdAt, expiresAt]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findUserIdForPasswordReset(tokenHash: string, now: string): Promise<string | null> {
  const res = await pool.query(
    "SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > $2",
    [tokenHash, now]
  );
  return res.rows[0]?.user_id ?? null;
}

export async function completePasswordReset(userId: string, tokenHash: string, passwordHash: string, now: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "SELECT user_id FROM password_reset_tokens WHERE token_hash = $1 AND user_id = $2 AND expires_at > $3",
      [tokenHash, userId, now]
    );
    if (res.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, userId]);
    await client.query("DELETE FROM user_sessions WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createEmailVerificationToken(userId: string, tokenHash: string, createdAt: string, expiresAt: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM email_verification_tokens WHERE user_id = $1 OR expires_at <= $2", [userId, createdAt]);
    await client.query(
      "INSERT INTO email_verification_tokens (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)",
      [tokenHash, userId, createdAt, expiresAt]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findUnverifiedUserByEmail(email: string): Promise<AuthUser | null> {
  const res = await pool.query(
    "SELECT id, name, email, created_at FROM users WHERE email = $1 AND email_verified_at IS NULL",
    [email]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at, dateOfBirth: null, gender: null, phoneNumber: null, location: null };
}

export async function verifyUserEmail(tokenHash: string, now: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      "SELECT user_id FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > $2",
      [tokenHash, now]
    );
    if (res.rows.length === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query("UPDATE users SET email_verified_at = $1 WHERE id = $2 AND email_verified_at IS NULL", [now, res.rows[0].user_id]);
    await client.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [res.rows[0].user_id]);
    await client.query("COMMIT");
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createUserAndClaimLegacyData(user: UserWithPassword): Promise<AuthUser> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO users (id, name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)",
      [user.id, user.name, user.email, user.passwordHash, user.createdAt]
    );
    await client.query("UPDATE decisions SET user_id = $1 WHERE user_id IS NULL", [user.id]);
    await client.query("UPDATE decision_drafts SET user_id = $1 WHERE user_id IS NULL", [user.id]);
    await client.query("COMMIT");
    return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt, dateOfBirth: null, gender: null, phoneNumber: null, location: null };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function findOrCreateGoogleUser(user: {
  id: string;
  googleSub: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}): Promise<AuthUser> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const byGoogle = await client.query("SELECT id FROM users WHERE google_sub = $1", [user.googleSub]);
    if (byGoogle.rows.length > 0) {
      const existing = await findUserById(byGoogle.rows[0].id);
      if (!existing) throw new Error("Google account is linked to a missing user.");
      await client.query("COMMIT");
      return existing;
    }

    const byEmail = await findUserByEmail(user.email);
    if (byEmail) {
      await client.query(
        "UPDATE users SET google_sub = $1, email_verified_at = COALESCE(email_verified_at, $2) WHERE id = $3",
        [user.googleSub, user.createdAt, byEmail.id]
      );
      const linked = await findUserById(byEmail.id);
      if (!linked) throw new Error("Unable to load the linked Google account.");
      await client.query("COMMIT");
      return linked;
    }

    const inserted = await client.query(
      `INSERT INTO users (id, name, email, password_hash, google_sub, email_verified_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, created_at, date_of_birth, gender, phone_number, location`,
      [user.id, user.name, user.email, user.passwordHash, user.googleSub, user.createdAt, user.createdAt]
    );
    await client.query("UPDATE decisions SET user_id = $1 WHERE user_id IS NULL", [user.id]);
    await client.query("UPDATE decision_drafts SET user_id = $1 WHERE user_id IS NULL", [user.id]);
    const row = inserted.rows[0];
    if (!row) throw new Error("The Google account could not be created.");
    const created: AuthUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      phoneNumber: row.phone_number,
      location: row.location,
    };
    await client.query("COMMIT");
    return created;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createSession(tokenHash: string, userId: string, createdAt: string, expiresAt: string): Promise<void> {
  await pool.query("DELETE FROM user_sessions WHERE expires_at <= $1", [createdAt]);
  await pool.query(
    "INSERT INTO user_sessions (token_hash, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)",
    [tokenHash, userId, createdAt, expiresAt]
  );
}

export async function findUserForSession(tokenHash: string, now: string): Promise<AuthUser | null> {
  const res = await pool.query(
    `SELECT users.id, users.name, users.email, users.created_at, users.date_of_birth, users.gender, users.phone_number, users.location
     FROM user_sessions JOIN users ON users.id = user_sessions.user_id
     WHERE user_sessions.token_hash = $1 AND user_sessions.expires_at > $2`,
    [tokenHash, now]
  );
  if (res.rows.length === 0) return null;
  const user = res.rows[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
    dateOfBirth: user.date_of_birth,
    gender: user.gender,
    phoneNumber: user.phone_number,
    location: user.location,
  };
}

export async function deleteSession(tokenHash: string): Promise<void> {
  await pool.query("DELETE FROM user_sessions WHERE token_hash = $1", [tokenHash]);
}

export async function deleteUserAndOwnedData(userId: string): Promise<boolean> {
  const res = await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  return (res.rowCount ?? 0) > 0;
}
