import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/layout/Header";
import { PageBody } from "@/components/layout/AppLayout";
import { Field } from "./AuthShell";
import { emptyDraft, exampleDraft, saveDraft, type DecisionDraft } from "@/hooks/useDecision";
import { decisionService } from "@/services/decisionService";
import { ErrorState } from "@/components/ui/states";

export default function CreateDecision() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function beginDraft(draft: DecisionDraft) {
    setSaving(true);
    setError(false);
    try {
      const saved = await decisionService.createDraft(draft);
      saveDraft({ ...draft, id: saved.id });
      navigate({ to: "/decisions/workspace" });
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    void beginDraft({ ...emptyDraft, title: title.trim(), description: description.trim() });
  }

  function useExample() {
    void beginDraft(exampleDraft);
  }

  return (
    <>
      <Header title="New decision" />
      <PageBody>
        <div className="mx-auto max-w-xl fade-in-up">
          <p className="text-sm font-medium text-primary">Step 1 of 6</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">What are you trying to decide?</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Give your decision a short name. Next you'll add the options you're comparing and what matters to you.
          </p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field id="title" label="Decision">
              <Input id="title" autoFocus placeholder="e.g. Which option best fits my priorities?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
            </Field>
            <Field id="description" label="Context (optional)">
              <Textarea id="description" rows={3} placeholder="I’m comparing pay, flexibility, growth, and commute before choosing." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </Field>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button type="button" onClick={useExample} disabled={saving} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50">
                <Sparkles className="h-4 w-4" /> Try a job-offer example
              </button>
              <Button type="submit" disabled={!title.trim() || saving}>
                {saving ? "Saving draft…" : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
            {error && <ErrorState message="We couldn't save your draft. Check that the API is running, then try again." />}
          </form>
        </div>
      </PageBody>
    </>
  );
}
