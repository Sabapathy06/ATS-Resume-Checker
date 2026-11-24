import { jsPDF } from 'jspdf';
import type { AnalysisResult } from '../types';

const NAVY: [number, number, number] = [13, 20, 40];
const BLUE: [number, number, number] = [59, 130, 246];
const SLATE: [number, number, number] = [90, 100, 120];
const DARK: [number, number, number] = [30, 38, 55];
const GREEN: [number, number, number] = [16, 150, 105];
const AMBER: [number, number, number] = [200, 130, 20];
const RED: [number, number, number] = [200, 60, 60];

function scoreColorRgb(score: number): [number, number, number] {
  if (score >= 85) return GREEN;
  if (score >= 70) return BLUE;
  if (score >= 55) return AMBER;
  return RED;
}

export function downloadAnalysisReport(analysis: AnalysisResult, title: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 44;
  let y = 0;

  const ensure = (needed: number) => {
    if (y + needed > H - 54) {
      doc.addPage();
      y = M;
    }
  };

  const heading = (text: string) => {
    ensure(46);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    doc.text(text, M, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(M, y, W - M, y);
    y += 14;
  };

  const body = (text: string, opts: { size?: number; color?: [number, number, number]; indent?: number } = {}) => {
    const size = opts.size ?? 9.5;
    const indent = opts.indent ?? 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? DARK));
    const lines = doc.splitTextToSize(text, W - M * 2 - indent);
    for (const line of lines) {
      ensure(size + 5);
      doc.text(line, M + indent, y);
      y += size + 3.5;
    }
  };

  /* ---------- Cover band ---------- */
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 132, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 132, W, 4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('ATS Resume Analysis Report', M, 58);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(165, 180, 210);
  doc.text(title, M, 78);
  doc.text(
    `Target role: ${analysis.meta.roleLabel}  |  Analysed ${new Date(analysis.meta.analyzedAt).toLocaleString()}`,
    M,
    96
  );
  doc.setFontSize(8);
  doc.setTextColor(120, 140, 175);
  doc.text(`Engine: ${analysis.meta.engine} (deterministic rule-based scoring)`, M, 114);

  /* ---------- Overall score card ---------- */
  y = 168;
  const cardW = W - M * 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 253);
  doc.roundedRect(M, y, cardW, 96, 8, 8, 'FD');

  const col = scoreColorRgb(analysis.overallScore);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(...col);
  doc.text(String(analysis.overallScore), M + 26, y + 62);
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text('/ 100', M + 26 + doc.getTextWidth(String(analysis.overallScore)) + 6, y + 62);

  doc.setFontSize(17);
  doc.setTextColor(...col);
  doc.text(analysis.rating, M + 190, y + 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE);
  const ratingLines = doc.splitTextToSize(analysis.ratingDetail, cardW - 220);
  let ry = y + 62;
  for (const line of ratingLines) {
    doc.text(line, M + 190, ry);
    ry += 12;
  }

  const stats = [
    `${analysis.stats.wordCount} words`,
    `${analysis.stats.bulletCount} bullets`,
    `~${analysis.stats.estimatedPages} page(s)`,
    `${analysis.stats.resumeYears} yr experience`,
  ];
  doc.setFontSize(8.5);
  doc.setTextColor(...SLATE);
  doc.text(stats.join('   ·   '), M + 14, y + 88);

  y += 112;

  /* ---------- Score breakdown ---------- */
  heading('ATS Score Breakdown');
  for (const dim of analysis.dimensions) {
    ensure(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(dim.label, M, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...SLATE);
    doc.text(`${dim.score}/100`, W - M, y, { align: 'right' });
    y += 6;
    doc.setFillColor(233, 238, 245);
    doc.roundedRect(M, y, W - M * 2, 6, 3, 3, 'F');
    doc.setFillColor(...scoreColorRgb(dim.score));
    doc.roundedRect(M, y, Math.max(6, ((W - M * 2) * dim.score) / 100), 6, 3, 3, 'F');
    y += 14;
    body(dim.summary, { size: 8.5, color: SLATE });
    y += 2;
  }

  /* ---------- Keyword analysis ---------- */
  heading('Keyword Analysis');
  body(
    `Coverage: ${analysis.keywords.coverage}% of expected keywords are present (${analysis.keywords.matched.length} matched, ${
      analysis.keywords.missing.length
    } missing).`,
    { color: DARK }
  );
  if (analysis.keywords.matched.length) {
    body('Matched keywords: ' + analysis.keywords.matched.slice(0, 30).map((k) => `${k.term} (${k.count}x)`).join(', '), {
      color: GREEN,
    });
  }
  if (analysis.keywords.missing.length) {
    body('Missing keywords: ' + analysis.keywords.missing.slice(0, 30).map((k) => k.term).join(', '), {
      color: RED,
    });
  }

  /* ---------- Job description match ---------- */
  if (analysis.jobMatch.hasJD && analysis.jobMatch.compatibility !== null) {
    heading('Job Description Match');
    body(`Compatibility score: ${analysis.jobMatch.compatibility}%`, { color: scoreColorRgb(analysis.jobMatch.compatibility) });
    body(analysis.jobMatch.experienceVerdict);
    if (analysis.jobMatch.missingTechnical.length) {
      body(
        'Missing technical skills: ' + analysis.jobMatch.missingTechnical.map((s) => s.name).join(', '),
        { color: RED }
      );
    }
    if (analysis.jobMatch.missingSoft.length) {
      body('Missing soft skills: ' + analysis.jobMatch.missingSoft.join(', '), { color: AMBER });
    }
    if (analysis.jobMatch.missingJdKeywords.length) {
      body('Posting language not mirrored: ' + analysis.jobMatch.missingJdKeywords.slice(0, 15).join(', '), {
        color: SLATE,
      });
    }
  }

  /* ---------- Quality ---------- */
  heading('Resume Quality Findings');
  body(
    `Quantified achievements: ${analysis.quality.quantified.bulletsWithMetrics}/${analysis.quality.quantified.totalBullets} bullets (${
      Math.round(analysis.quality.quantified.ratio * 100)
    }%) — ${analysis.quality.quantified.status}.`
  );
  if (analysis.quality.grammar.length) {
    body('Language issues:', { color: NAVY });
    for (const g of analysis.quality.grammar.slice(0, 8)) {
      body(`• ${g.issue} — ${g.suggestion}`, { indent: 12, color: SLATE });
    }
  } else {
    body('No spelling or grammar issues detected by the rule engine.', { color: GREEN });
  }
  if (analysis.quality.weakVerbs.length) {
    body('Weak phrasing to replace:', { color: NAVY });
    for (const w of analysis.quality.weakVerbs) {
      body(
        `• “${w.phrase}” (${w.count}x) → try ${w.alternatives.join(' / ')}`,
        { indent: 12, color: SLATE }
      );
    }
  }
  if (analysis.quality.formattingIssues.length) {
    body('Formatting issues:', { color: NAVY });
    for (const f of analysis.quality.formattingIssues.slice(0, 8)) {
      body(`• ${f.issue} — ${f.fix}`, { indent: 12, color: SLATE });
    }
  }

  /* ---------- Recommendations ---------- */
  heading('Improvement Recommendations');
  let n = 1;
  for (const rec of analysis.recommendations) {
    ensure(70);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...NAVY);
    const titleLines = doc.splitTextToSize(`${n}. [${rec.priority.toUpperCase()}] ${rec.title}`, W - M * 2);
    for (const line of titleLines) {
      ensure(16);
      doc.text(line, M, y);
      y += 14;
    }
    body(`${rec.section} · ${rec.description}`, { color: SLATE });
    if (rec.before) {
      body(`Before: ${rec.before}`, { color: RED, indent: 12 });
    }
    if (rec.after) {
      body(`After:  ${rec.after}`, { color: GREEN, indent: 12 });
    }
    y += 4;
    n++;
  }

  /* ---------- Footers ---------- */
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(150, 160, 175);
    doc.text('ATS Resume Analyzer — every score in this report is derived deterministically from your resume text.', M, H - 24);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 24, { align: 'right' });
  }

  const safe = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'resume';
  doc.save(`ats-report-${safe}.pdf`);
}
