import { pool } from "../database/database.js";
import type { EvaluationRequestBody } from "../validation/evaluation.schema.js";
import { draftSchema, type DraftBody } from "../validation/draft.schema.js";

export interface SavedDraft extends DraftBody {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDecision {
  id: string;
  title: string;
  description: string;
  status: "completed";
  createdAt: string;
  updatedAt: string;
  alternatives: EvaluationRequestBody["alternatives"];
  criteria: EvaluationRequestBody["criteria"];
  scoringMode: EvaluationRequestBody["scoringMode"];
  ratings: EvaluationRequestBody["ratings"];
  ranking: { alternativeId: string; alternativeName: string; rank: number; score: number }[];
  breakdown: { alternativeId: string; contributions: { criterionId: string; criterionName: string; value: number; inputValue?: number; normalizedValue?: number; unit?: string }[] }[];
}

function parseJsonField<T>(value: unknown): T {
  if (typeof value === "string") {
    return JSON.parse(value);
  }
  return value as T;
}

function mapSavedDecision(saved: Record<string, any>): SavedDecision {
  return {
    id: saved["id"]!,
    title: saved["title"]!,
    description: saved["description"]!,
    status: "completed",
    scoringMode: (saved["scoring_mode"] ?? "rating") as "rating" | "relative",
    createdAt: saved["created_at"]!,
    updatedAt: saved["created_at"]!,
    alternatives: parseJsonField(saved["alternatives_json"]),
    criteria: parseJsonField(saved["criteria_json"]),
    ratings: parseJsonField(saved["ratings_json"]),
    ranking: parseJsonField(saved["ranking_json"]),
    breakdown: parseJsonField(saved["breakdown_json"]),
  };
}

export async function saveDecision(decision: SavedDecision & { userId: string }, draftId?: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO decisions (
        id, user_id, title, description, alternatives_json, criteria_json, ratings_json,
        ranking_json, breakdown_json, scoring_mode, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        decision.id,
        decision.userId,
        decision.title,
        decision.description,
        JSON.stringify(decision.alternatives),
        JSON.stringify(decision.criteria),
        JSON.stringify(decision.ratings),
        JSON.stringify(decision.ranking),
        JSON.stringify(decision.breakdown),
        decision.scoringMode,
        decision.createdAt,
      ]
    );
    if (draftId) {
      const removedDraft = await client.query(
        "DELETE FROM decision_drafts WHERE id = $1 AND user_id = $2",
        [draftId, decision.userId]
      );
      if ((removedDraft.rowCount ?? 0) === 0) {
        throw new Error("The draft was not found for this user.");
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listDecisions(userId: string): Promise<SavedDecision[]> {
  const res = await pool.query(
    `SELECT id, title, description, alternatives_json, criteria_json, ratings_json,
      ranking_json, breakdown_json, scoring_mode, created_at
    FROM decisions
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  return res.rows.map((row) => mapSavedDecision(row));
}

export async function getDecision(id: string, userId: string): Promise<SavedDecision | null> {
  const res = await pool.query(
    `SELECT id, title, description, alternatives_json, criteria_json, ratings_json,
      ranking_json, breakdown_json, scoring_mode, created_at
    FROM decisions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return res.rows[0] ? mapSavedDecision(res.rows[0]) : null;
}

export async function deleteDecision(id: string, userId: string): Promise<boolean> {
  const res = await pool.query("DELETE FROM decisions WHERE id = $1 AND user_id = $2", [id, userId]);
  return (res.rowCount ?? 0) > 0;
}

export async function createDraft(userId: string, id: string, draft: DraftBody, createdAt: string): Promise<SavedDraft> {
  await pool.query(
    `INSERT INTO decision_drafts (id, user_id, title, description, draft_json, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, draft.title, draft.description, JSON.stringify(draft), createdAt, createdAt]
  );
  return { id, ...draft, createdAt, updatedAt: createdAt };
}

export async function updateDraft(id: string, userId: string, draft: DraftBody, updatedAt: string): Promise<SavedDraft | null> {
  const res = await pool.query(
    `UPDATE decision_drafts
    SET title = $1, description = $2, draft_json = $3, updated_at = $4
    WHERE id = $5 AND user_id = $6`,
    [draft.title, draft.description, JSON.stringify(draft), updatedAt, id, userId]
  );
  if ((res.rowCount ?? 0) === 0) return null;
  return getDraft(id, userId);
}

export async function getDraft(id: string, userId: string): Promise<SavedDraft | null> {
  const res = await pool.query(
    `SELECT id, draft_json, created_at, updated_at FROM decision_drafts WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (res.rows.length === 0) return null;
  const saved = res.rows[0];
  const parsedDraft = parseJsonField(saved.draft_json);
  return {
    id: saved.id,
    ...draftSchema.parse(parsedDraft),
    createdAt: saved.created_at,
    updatedAt: saved.updated_at,
  };
}

export async function listDrafts(userId: string): Promise<SavedDraft[]> {
  const res = await pool.query(
    `SELECT id, draft_json, created_at, updated_at
    FROM decision_drafts WHERE user_id = $1 ORDER BY updated_at DESC, id DESC`,
    [userId]
  );
  return res.rows.map((saved) => {
    const parsedDraft = parseJsonField(saved.draft_json);
    return {
      id: saved.id,
      ...draftSchema.parse(parsedDraft),
      createdAt: saved.created_at,
      updatedAt: saved.updated_at,
    };
  });
}

export async function deleteDraft(id: string, userId: string): Promise<boolean> {
  const res = await pool.query("DELETE FROM decision_drafts WHERE id = $1 AND user_id = $2", [id, userId]);
  return (res.rowCount ?? 0) > 0;
}
