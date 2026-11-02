import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { decisionService } from "@/services/decisionService";
import { clearDraftIfMatching } from "@/hooks/useDecision";

export function DeleteSavedItemButton({ id, title, kind }: { id: string; title: string; kind: "draft" | "evaluation" }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const isDraft = kind === "draft";

  async function remove() {
    setDeleting(true);
    setError(false);
    try {
      if (isDraft) await decisionService.deleteDraft(id);
      else await decisionService.deleteDecision(id);
      if (isDraft) clearDraftIfMatching(id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["decisions"] }),
        queryClient.invalidateQueries({ queryKey: ["saved-history"] }),
        queryClient.invalidateQueries({ queryKey: ["decision-drafts"] }),
      ]);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => { if (!deleting) { setOpen(nextOpen); setError(false); } }}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${kind === "draft" ? "draft" : "evaluation"}: ${title}`} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {isDraft ? "this draft" : "this evaluation"}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{title}</span> and its saved data will be permanently deleted. You can’t undo this.
            {error && <span className="mt-2 block text-destructive">We couldn’t delete it. Please try again.</span>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={(event) => { event.preventDefault(); void remove(); }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting…</> : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
