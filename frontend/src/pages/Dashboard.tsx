import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Check, Clock3, Layers3, Plus, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { PageBody } from "@/components/layout/AppLayout";
import { EmptyState, ErrorState, LoadingState, StatusBadge } from "@/components/ui/states";
import { decisionService } from "@/services/decisionService";
import { saveDraft } from "@/hooks/useDecision";
import { DeleteSavedItemButton } from "@/components/decisions/DeleteSavedItemButton";
import { useAuth } from "@/hooks/useAuth";
import type { Decision } from "@/types/decision";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function DecisionTile({ decision }: { decision: Decision }) {
  const winner = decision.ranking?.find((item) => item.rank === 1);
  const date = new Date(decision.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <article className="decision-tile group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${decision.status === "completed" ? "bg-primary-soft text-primary" : "bg-amber-50 text-amber-700"}`}>
              {decision.status === "completed" ? <Target className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
            </span>
            <StatusBadge status={decision.status} />
          </div>
          <h3 className="truncate font-semibold tracking-tight">{decision.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{decision.description || "A choice you’re working through"}</p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{date}</span>
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-4">
        <p className="min-w-0 truncate text-sm">
          {winner ? <><span className="text-muted-foreground">Leading option</span><span className="ml-2 font-medium">{winner.alternativeName}</span></> : <span className="text-muted-foreground">{decision.alternatives.length} options · {decision.criteria.length} criteria</span>}
        </p>
        <Link to={decision.status === "draft" ? "/decisions/workspace" : "/history"} className="ml-3 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary opacity-80 transition-opacity group-hover:opacity-100">
          Open <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const decisions = useQuery({ queryKey: ["decisions", user?.id], queryFn: decisionService.list, enabled: !!user });
  const drafts = useQuery({ queryKey: ["decision-drafts", user?.id], queryFn: decisionService.listDrafts, enabled: !!user });
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState(false);
  const firstName = user?.name.split(" ")[0] || "there";
  const now = new Date();
  const savedCount = decisions.data?.length;
  const thisMonthCount = decisions.data?.filter((decision) => {
    const createdAt = new Date(decision.createdAt);
    return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
  }).length;

  async function resumeDraft(id: string) {
    const saved = drafts.data?.find((draft) => draft.id === id);
    if (!saved) return;
    setResumingId(id);
    setResumeError(false);
    try {
      const latest = await decisionService.getDraft(id);
      saveDraft({
        id: latest.id,
        scoringMode: latest.scoringMode,
        title: latest.title,
        description: latest.description,
        alternatives: latest.alternatives,
        criteria: latest.criteria,
        ratings: latest.ratings,
        currentStep: latest.currentStep,
        maxReached: latest.maxReached,
      });
      await navigate({ to: "/decisions/workspace" });
    } catch {
      setResumeError(true);
    } finally {
      setResumingId(null);
    }
  }

  return (
    <>
      <Header title="Your workspace" />
      <PageBody>
        <div className="mx-auto max-w-6xl fade-in-up">
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">YOUR DECISION STUDIO</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting()}, {firstName}.</h1>
              <p className="mt-2 text-muted-foreground">Let’s make your next big choice feel a little clearer.</p>
            </div>
            <Button asChild size="lg" className="w-full rounded-xl sm:w-auto">
              <Link to="/decisions/new"><Plus className="h-4 w-4" /> Start a decision</Link>
            </Button>
          </div>

          <section className="studio-hero relative overflow-hidden rounded-[1.75rem] p-6 text-white sm:p-9" aria-labelledby="hero-title">
            <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
            <div className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_.8fr] md:items-center">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-teal-50"><Sparkles className="h-3.5 w-3.5" /> A thoughtful way to choose</span>
                <h2 id="hero-title" className="mt-5 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-[2.65rem]">Good decisions start with what matters to you.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-teal-50/80 sm:text-base">Put your options side by side, set your priorities, and see the trade-offs clearly.</p>
                <Button asChild size="lg" className="mt-6 rounded-xl bg-white text-foreground shadow-none hover:bg-teal-50">
                  <Link to="/decisions/new">Build your first comparison <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="relative mx-auto hidden w-full max-w-[19rem] md:block" aria-hidden="true">
                <div className="hero-note absolute -left-7 top-5 z-10 -rotate-6 rounded-2xl bg-white p-4 text-foreground shadow-xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Your priorities</p>
                  <div className="mt-3 space-y-2.5">
                    {[['Quality', 78], ['Value', 56], ['Ease', 38]].map(([label, value]) => <div key={label} className="flex items-center gap-3"><span className="w-12 text-xs">{label}</span><span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${value}%` }} /></span><span className="text-[10px] text-muted-foreground">{value}%</span></div>)}
                  </div>
                </div>
                <div className="ml-10 rounded-[1.5rem] border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs text-teal-50/80"><span>YOUR SHORTLIST</span><Layers3 className="h-4 w-4" /></div>
                  <div className="mt-5 space-y-2.5">
                    {[{ letter: "A", label: "Option one", active: true }, { letter: "B", label: "Option two", active: false }, { letter: "C", label: "Option three", active: false }].map(({ letter, label, active }) => <div key={letter} className={`flex items-center gap-3 rounded-xl px-3 py-3 ${active ? "bg-white text-foreground" : "bg-white/10 text-white"}`}><span className={`grid h-7 w-7 place-items-center rounded-lg text-xs font-semibold ${active ? "bg-primary-soft text-primary" : "bg-white/15"}`}>{letter}</span><span className="flex-1 text-sm font-medium">{label}</span>{active && <Check className="h-4 w-4 text-primary" />}</div>)}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-teal-50/75"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Compare what you care about</div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Decision summary">
            {[
              { label: "Saved evaluations", value: savedCount, icon: Check, note: "Ready to revisit" },
              { label: "In progress", value: drafts.data?.length, icon: Clock3, note: "Ready to continue" },
              { label: "This month", value: thisMonthCount, icon: Layers3, note: "Saved choices explored" },
            ].map(({ label, value, icon: Icon, note }) => <div key={label} className="rounded-2xl border bg-card p-4 sm:p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="h-4 w-4" /></span></div><p className="mt-3 text-3xl font-semibold tracking-tight tabular">{value ?? "–"}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>)}
          </section>

          {(drafts.isLoading || drafts.isError || !!drafts.data?.length) && <section className="mt-8" aria-labelledby="drafts-title">
            <div className="mb-4"><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2 id="drafts-title" className="mt-1 text-xl font-semibold tracking-tight">In progress</h2></div>
            {drafts.isLoading ? <LoadingState label="Loading your drafts…" />
              : drafts.isError ? <ErrorState message="We couldn't load your drafts." onRetry={() => drafts.refetch()} />
                : <div className="grid gap-3 md:grid-cols-2">
                  {drafts.data?.map((draft) => <article key={draft.id} className="rounded-2xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><h3 className="truncate font-semibold tracking-tight">{draft.title}</h3><p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{draft.description || "Decision in progress"}</p></div>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">Draft</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
                      <p className="text-xs text-muted-foreground">Step {(draft.currentStep ?? 0) + 1} of 6 · {draft.alternatives.length} options · {draft.criteria.length} priorities</p>
                      <div className="flex items-center gap-1">
                        <Button size="sm" onClick={() => void resumeDraft(draft.id)} disabled={resumingId !== null}>{resumingId === draft.id ? "Opening…" : "Resume"}</Button>
                        <DeleteSavedItemButton id={draft.id} title={draft.title} kind="draft" />
                      </div>
                    </div>
                  </article>)}
                </div>}
            {resumeError && <div className="mt-3"><ErrorState message="We couldn't open that draft. Refresh the list and try again." onRetry={() => drafts.refetch()} /></div>}
          </section>}

          <section className="mt-10" aria-labelledby="recent-title">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2 id="recent-title" className="mt-1 text-xl font-semibold tracking-tight">Recent evaluations</h2></div>
              <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">All decisions <ArrowRight className="h-4 w-4" /></Link>
            </div>
            {decisions.isLoading ? <LoadingState label="Gathering your saved evaluations…" /> : decisions.isError ? <ErrorState message="We couldn't load your saved evaluations." onRetry={() => decisions.refetch()} /> : !decisions.data?.length ? <EmptyState icon={<Layers3 className="h-6 w-6" />} title="Your next decision starts here" description="Your completed evaluations will appear here after you compare your options." action={<Button asChild><Link to="/decisions/new"><Plus className="h-4 w-4" /> Start a decision</Link></Button>} /> : <div className="grid gap-3 md:grid-cols-2">{decisions.data.slice(0, 4).map((decision) => <DecisionTile key={decision.id} decision={decision} />)}</div>}
          </section>
        </div>
      </PageBody>
    </>
  );
}
