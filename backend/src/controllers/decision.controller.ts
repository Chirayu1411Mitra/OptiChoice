import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { runEvaluation } from "../services/evaluation.service.js";
import {
  createDraft,
  deleteDecision,
  deleteDraft,
  getDecision,
  getDraft,
  listDecisions,
  listDrafts,
  saveDecision,
  updateDraft,
} from "../repositories/decision.repository.js";
import { draftSchema } from "../validation/draft.schema.js";
import { evaluationRequestSchema } from "../validation/evaluation.schema.js";
import { z } from "zod";
import { generateDecisionExplanation } from "../services/decision-explanation.service.js";
import { GeminiAnalysisError } from "../../../ai/src/services/gemini.service.js";

function currentUserId(request: Request, response: Response): string | null {
  if (!request.authUser) {
    response.status(401).json({ error: { code: "UNAUTHORIZED", message: "Please sign in to continue." } });
    return null;
  }
  return request.authUser.id;
}

export async function evaluateDecisionController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const parsed = evaluationRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: {
        code: "INVALID_REQUEST",
        message: parsed.error.issues[0]?.message ?? "Check the decision details and try again.",
      },
    });
    return;
  }

  try {
    if (parsed.data.draftId && !(await getDraft(parsed.data.draftId, userId))) {
      response.status(404).json({ error: { code: "DRAFT_NOT_FOUND", message: "This draft may have been completed or removed." } });
      return;
    }

    let result;
    try {
      result = runEvaluation(parsed.data);
    } catch (error) {
      response.status(422).json({
        error: {
          code: "INVALID_DECISION",
          message: error instanceof Error ? error.message : "The decision could not be evaluated.",
        },
      });
      return;
    }

    const createdAt = new Date().toISOString();
    const decision = {
      id: randomUUID(),
      userId,
      ...parsed.data,
      status: "completed" as const,
      createdAt,
      updatedAt: createdAt,
      ...result,
    };

    await saveDecision(decision, parsed.data.draftId);
    response.status(200).json({ decisionId: decision.id, createdAt, ...result });
  } catch (error) {
    next(error);
  }
}

export async function listDecisionsController(_request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(_request, response);
  if (!userId) return;
  try {
    const decisions = await listDecisions(userId);
    response.status(200).json({ decisions });
  } catch (error) {
    next(error);
  }
}

export async function decisionExplanationController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;

  const id = z.uuid().safeParse(request.params["id"]);
  if (!id.success) {
    response.status(400).json({ error: { code: "INVALID_DECISION_ID", message: "That decision ID is not valid." } });
    return;
  }

  try {
    const decision = await getDecision(id.data, userId);
    if (!decision) {
      response.status(404).json({ error: { code: "DECISION_NOT_FOUND", message: "That evaluation could not be found." } });
      return;
    }

    const result = await generateDecisionExplanation(decision);
    response.status(200).json({ ...result, generatedAt: new Date().toISOString() });
  } catch (error) {
    if (error instanceof GeminiAnalysisError) {
      response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
      return;
    }
    next(error);
  }
}

export async function deleteDecisionController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const id = z.uuid().safeParse(request.params["id"]);
  if (!id.success) {
    response.status(400).json({ error: { code: "INVALID_DECISION_ID", message: "That decision ID is not valid." } });
    return;
  }
  try {
    if (!(await deleteDecision(id.data, userId))) {
      response.status(404).json({ error: { code: "DECISION_NOT_FOUND", message: "That evaluation could not be found." } });
      return;
    }
    response.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

export async function listDraftsController(_request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(_request, response);
  if (!userId) return;
  try {
    const drafts = await listDrafts(userId);
    response.status(200).json({ drafts });
  } catch (error) {
    next(error);
  }
}

export async function deleteDraftController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const id = z.uuid().safeParse(request.params["id"]);
  if (!id.success) {
    response.status(400).json({ error: { code: "INVALID_DRAFT_ID", message: "That draft ID is not valid." } });
    return;
  }
  try {
    if (!(await deleteDraft(id.data, userId))) {
      response.status(404).json({ error: { code: "DRAFT_NOT_FOUND", message: "That draft could not be found." } });
      return;
    }
    response.status(200).json({ deleted: true });
  } catch (error) {
    next(error);
  }
}

export async function createDraftController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const parsed = draftSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ error: { code: "INVALID_DRAFT", message: parsed.error.issues[0]?.message ?? "Check the draft details and try again." } });
    return;
  }
  try {
    const createdAt = new Date().toISOString();
    const draft = await createDraft(userId, randomUUID(), parsed.data, createdAt);
    response.status(201).json({ draft });
  } catch (error) {
    next(error);
  }
}

export async function getDraftController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const id = z.uuid().safeParse(request.params["id"]);
  if (!id.success) {
    response.status(400).json({ error: { code: "INVALID_DRAFT_ID", message: "That draft ID is not valid." } });
    return;
  }
  try {
    const draft = await getDraft(id.data, userId);
    if (!draft) {
      response.status(404).json({ error: { code: "DRAFT_NOT_FOUND", message: "This draft may have been completed or removed." } });
      return;
    }
    response.status(200).json({ draft });
  } catch (error) {
    next(error);
  }
}

export async function updateDraftController(request: Request, response: Response, next: NextFunction): Promise<void> {
  const userId = currentUserId(request, response);
  if (!userId) return;
  const id = z.uuid().safeParse(request.params["id"]);
  const parsed = draftSchema.safeParse(request.body);
  if (!id.success) {
    response.status(400).json({ error: { code: "INVALID_DRAFT_ID", message: "That draft ID is not valid." } });
    return;
  }
  if (!parsed.success) {
    response.status(400).json({ error: { code: "INVALID_DRAFT", message: parsed.error.issues[0]?.message ?? "Check the draft details and try again." } });
    return;
  }
  try {
    const draft = await updateDraft(id.data, userId, parsed.data, new Date().toISOString());
    if (!draft) {
      response.status(404).json({ error: { code: "DRAFT_NOT_FOUND", message: "This draft may have been completed or removed." } });
      return;
    }
    response.status(200).json({ draft });
  } catch (error) {
    next(error);
  }
}
