import { jsPDF } from "jspdf";
import type { EvaluateResponse } from "@/services/decisionService";
import type { DecisionDraft } from "@/hooks/useDecision";

export interface DecisionReportData {
  title: string;
  description?: string;
  createdAt?: string;
  scoringMode: "relative" | "rating";
  alternatives: { id: string; name: string }[];
  criteria: { id: string; name: string; weight: number; type: "benefit" | "cost"; unit?: string }[];
  ranking: { alternativeId: string; alternativeName: string; rank: number; score: number }[];
  breakdown: {
    alternativeId: string;
    contributions: {
      criterionId: string;
      criterionName: string;
      value: number;
      inputValue?: number;
      normalizedValue?: number;
      unit?: string;
    }[];
  }[];
  aiExplanation?: {
    explanation: {
      summary: string;
      winnerReason: string;
      strengths: string[];
      tradeoffs: string[];
      assumptions: string[];
    };
    model: string;
  } | null;
}

export function generateDecisionPdf(data: DecisionReportData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(requiredHeight: number): void {
    if (y + requiredHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  }

  function drawPageHeader(): void {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 145, 140);
    doc.text("OptiChoice — Decision Report", margin, 10);
    doc.setDrawColor(230, 235, 232);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  // --- BRAND HEADER ---
  const headerHeight = 36;
  doc.setFillColor(28, 59, 48); // Deep forest green
  doc.roundedRect(margin, y, contentWidth, headerHeight, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(170, 215, 195);
  doc.text("OPTICHOICE DECISION REPORT", margin + 7, y + 9);

  const titleLines = doc.splitTextToSize(data.title || "Untitled Decision", contentWidth - 18);
  const titleFontSize = titleLines.length > 1 ? 13.5 : 16;
  doc.setFontSize(titleFontSize);
  doc.setTextColor(255, 255, 255);
  const titleStartY = titleLines.length > 1 ? y + 18 : y + 19;
  doc.text(titleLines.slice(0, 2), margin + 7, titleStartY, { maxWidth: contentWidth - 18 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(210, 230, 220);
  const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, { dateStyle: "long" }) : new Date().toLocaleDateString();
  const modeStr = data.scoringMode === "relative" ? "Relative Normalization (Min–Max)" : "Rating Mode (0–100)";
  doc.text(`Generated: ${dateStr}   |   Scoring: ${modeStr}`, margin + 7, y + 28);

  y += headerHeight + 4;

  // --- DESCRIPTION (if provided) ---
  if (data.description?.trim()) {
    checkPageBreak(20);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 95, 90);
    const descLines = doc.splitTextToSize(data.description.trim(), contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 5 + 4;
  }

  // --- EXECUTIVE SUMMARY / WINNER BANNER ---
  const winner = data.ranking[0];
  if (winner) {
    checkPageBreak(26);
    doc.setFillColor(242, 248, 244);
    doc.setDrawColor(180, 215, 195);
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(40, 110, 75);
    doc.text("RECOMMENDED BEST FIT (RANK #1)", margin + 6, y + 7);

    doc.setFontSize(12.5);
    doc.setTextColor(25, 45, 38);
    const winnerName = doc.splitTextToSize(winner.alternativeName, contentWidth - 60);
    doc.text(winnerName[0] ?? winner.alternativeName, margin + 6, y + 15);

    doc.setFontSize(10.5);
    doc.setTextColor(40, 110, 75);
    doc.text(`${winner.score.toFixed(1)} / 100`, pageWidth - margin - 8, y + 15, { align: "right" });

    y += 26;
  }

  // --- RANKINGS TABLE ---
  const rankX = margin + 4;
  const optionX = margin + 20;
  const scoreX = pageWidth - margin - 34;
  const resultX = pageWidth - margin - 6;

  checkPageBreak(25 + data.ranking.length * 8);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 45, 40);
  doc.text("Final Comparison Rankings", margin, y);
  y += 4;

  // Table header
  doc.setFillColor(240, 243, 241);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(90, 105, 100);
  doc.text("RANK", rankX, y + 4.8);
  doc.text("OPTION / ALTERNATIVE", optionX, y + 4.8);
  doc.text("SCORE", scoreX, y + 4.8);
  doc.text("RESULT", resultX, y + 4.8, { align: "right" });
  y += 7;

  // Table rows
  data.ranking.forEach((r, idx) => {
    checkPageBreak(8);
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 251);
      doc.rect(margin, y, contentWidth, 7.5, "F");
    }
    doc.setDrawColor(235, 240, 238);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setFont("helvetica", r.rank === 1 ? "bold" : "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 35);

    // Rank badge
    doc.text(String(r.rank), rankX + 1, y + 5);
    // Name
    const optName = doc.splitTextToSize(r.alternativeName, contentWidth - 76);
    doc.text(optName[0] ?? r.alternativeName, optionX, y + 5);
    // Score
    doc.text(`${r.score.toFixed(1)} / 100`, scoreX, y + 5);
    // Diff
    const diff = idx === 0 ? "Winner" : `-${(winner.score - r.score).toFixed(1)}`;
    doc.setTextColor(r.rank === 1 ? 40 : 120, r.rank === 1 ? 120 : 120, r.rank === 1 ? 75 : 120);
    doc.text(diff, resultX, y + 5, { align: "right" });

    y += 7.5;
  });

  y += 6;

  // --- PRIORITIES & WEIGHTS ---
  checkPageBreak(25 + data.criteria.length * 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 45, 40);
  doc.text("Criteria & Priority Weights", margin, y);
  y += 4;

  doc.setFillColor(240, 243, 241);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFontSize(8);
  doc.setTextColor(90, 105, 100);
  doc.text("CRITERION", margin + 4, y + 4.8);
  doc.text("PREFERENCE", margin + 80, y + 4.8);
  doc.text("UNIT", margin + 125, y + 4.8);
  doc.text("WEIGHT", pageWidth - margin - 6, y + 4.8, { align: "right" });
  y += 7;

  data.criteria.forEach((c, idx) => {
    checkPageBreak(7.5);
    if (idx % 2 === 1) {
      doc.setFillColor(250, 252, 251);
      doc.rect(margin, y, contentWidth, 7.5, "F");
    }
    doc.setDrawColor(235, 240, 238);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 40, 35);
    doc.text(c.name, margin + 4, y + 5);
    doc.text(c.type === "cost" ? "Lower is better" : "Higher is better", margin + 80, y + 5);
    doc.text(c.unit || "—", margin + 125, y + 5);

    doc.setFont("helvetica", "bold");
    doc.text(`${c.weight}%`, pageWidth - margin - 6, y + 5, { align: "right" });
    y += 7.5;
  });

  y += 8;

  // --- DETAILED SCORE CONTRIBUTIONS ---
  checkPageBreak(30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 45, 40);
  doc.text("Detailed Score Calculation & Contributions", margin, y);
  y += 5;

  data.ranking.forEach((r) => {
    const detail = data.breakdown.find((item) => item.alternativeId === r.alternativeId);
    if (!detail) return;

    checkPageBreak(20 + detail.contributions.length * 6);

    doc.setFillColor(245, 248, 246);
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(25, 45, 38);
    doc.text(`${r.rank}. ${r.alternativeName}`, margin + 4, y + 4.8);
    doc.text(`Total Score: ${r.score.toFixed(1)} / 100`, pageWidth - margin - 6, y + 4.8, { align: "right" });
    y += 8.5;

    detail.contributions.forEach((cb) => {
      checkPageBreak(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 65, 60);

      const label = cb.criterionName;
      let valDesc = "";
      if (data.scoringMode === "relative" && cb.inputValue !== undefined) {
        valDesc = `(Input: ${cb.inputValue}${cb.unit ? ` ${cb.unit}` : ""} -> Normalized: ${cb.normalizedValue ?? 0}/100)`;
      }
      doc.text(`• ${label} ${valDesc}`, margin + 6, y + 4);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 110, 75);
      doc.text(`+${cb.value.toFixed(2)} pts`, pageWidth - margin - 6, y + 4, { align: "right" });
      y += 5.5;
    });

    y += 4;
  });

  // --- AI EXPLANATION SECTION (if available) ---
  if (data.aiExplanation?.explanation) {
    const ai = data.aiExplanation.explanation;
    checkPageBreak(40);
    y += 4;

    doc.setFillColor(242, 247, 252);
    doc.setDrawColor(190, 215, 238);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(25, 75, 120);
    doc.text("AI Executive Analysis & Insights", margin + 5, y + 6.5);
    y += 14;

    function renderAiSection(title: string, content: string | string[]) {
      if (!content || (Array.isArray(content) && content.length === 0)) return;
      checkPageBreak(20);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 50, 70);
      doc.text(title, margin + 2, y);
      y += 4.5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(60, 75, 85);

      if (typeof content === "string") {
        const lines = doc.splitTextToSize(content, contentWidth - 4);
        checkPageBreak(lines.length * 4.5);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.5 + 3;
      } else {
        content.forEach((item) => {
          const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 6);
          checkPageBreak(itemLines.length * 4.5);
          doc.text(itemLines, margin + 4, y);
          y += itemLines.length * 4.5 + 1.5;
        });
        y += 2;
      }
    }

    renderAiSection("Summary", ai.summary);
    renderAiSection(`Why ${winner.alternativeName} Ranks First`, ai.winnerReason);
    renderAiSection("Key Strengths", ai.strengths);
    renderAiSection("Trade-offs to Consider", ai.tradeoffs);
    renderAiSection("Assumptions & Notes", ai.assumptions);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(130, 140, 150);
    doc.text(`Generated by ${data.aiExplanation.model || "Gemini"}. Deterministic rankings remain unaltered.`, margin + 2, y);
    y += 6;
  }

  // --- FOOTER FOR ALL PAGES ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(230, 235, 232);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140, 155, 150);
    doc.text("OptiChoice — Rational & Deterministic Decision Support", margin, pageHeight - 7);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  // Download
  const cleanTitle = (data.title || "Decision")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 30);
  doc.save(`OptiChoice_Report_${cleanTitle}.pdf`);
}

