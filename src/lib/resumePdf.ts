import { jsPDF } from 'jspdf';
import type { ResumeDraft } from '../types';

const NAVY: [number, number, number] = [24, 33, 54];
const BLUE: [number, number, number] = [37, 99, 235];
const SLATE: [number, number, number] = [95, 105, 125];
const BODY: [number, number, number] = [40, 48, 64];

export function downloadResumePdf(resume: ResumeDraft): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const contentW = W - M * 2;
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > H - 40) {
      doc.addPage();
      y = M;
    }
  };

  const sectionHeading = (label: string) => {
    ensure(40);
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BLUE);
    doc.text(label.toUpperCase(), M, y);
    y += 5;
    doc.setDrawColor(210, 218, 232);
    doc.setLineWidth(0.8);
    doc.line(M, y, W - M, y);
    y += 12;
  };

  const para = (text: string, opts: { size?: number; color?: [number, number, number]; bold?: boolean; indent?: number } = {}) => {
    if (!text?.trim()) return;
    const size = opts.size ?? 9.5;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? BODY));
    const lines = doc.splitTextToSize(text.trim(), contentW - (opts.indent ?? 0));
    for (const line of lines) {
      ensure(size + 6);
      doc.text(line, M + (opts.indent ?? 0), y);
      y += size + 3.5;
    }
  };

  const bullet = (text: string) => {
    if (!text?.trim()) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(text.trim(), contentW - 14);
    lines.forEach((line: string, i: number) => {
      ensure(14);
      if (i === 0) {
        doc.setFillColor(...BLUE);
        doc.circle(M + 3, y - 3, 1.6, 'F');
      }
      doc.setTextColor(...BODY);
      doc.text(line, M + 14, y);
      y += 13;
    });
  };

  /* ---------- Header ---------- */
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  const name = resume.full_name?.trim() || 'Your Name';
  doc.text(name, M, y + 10);
  y += 26;

  if (resume.headline?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...BLUE);
    doc.text(resume.headline.trim(), M, y);
    y += 16;
  }

  const contact = [resume.location, resume.email, resume.phone, ...resume.links.map((l) => l.url)]
    .filter(Boolean)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
  if (contact.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    const lines = doc.splitTextToSize(contact.join('  |  '), contentW);
    for (const line of lines) {
      ensure(12);
      doc.text(line, M, y);
      y += 12;
    }
  }

  /* ---------- Summary ---------- */
  if (resume.summary?.trim()) {
    sectionHeading('Professional Summary');
    para(resume.summary);
  }

  /* ---------- Skills ---------- */
  if (resume.skills.length) {
    sectionHeading('Technical Skills');
    const groups = new Map<string, string[]>();
    for (const s of resume.skills) {
      const key = s.category?.trim() || 'Other';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s.name);
    }
    for (const [group, items] of groups) {
      const label = `${group.charAt(0).toUpperCase() + group.slice(1)}: `;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      const labelW = doc.getTextWidth(label);
      doc.setTextColor(...NAVY);
      doc.text(label, M, y);
      const remaining = contentW - labelW;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BODY);
      const lines = doc.splitTextToSize(items.join(', '), remaining);
      lines.forEach((line: string, i: number) => {
        ensure(13);
        doc.text(line, M + labelW + (i === 0 ? 0 : 0), y);
        y += 13;
      });
      y += 2;
    }
  }

  /* ---------- Experience ---------- */
  if (resume.experience.length) {
    sectionHeading('Professional Experience');
    for (const exp of resume.experience) {
      ensure(46);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...NAVY);
      doc.text(exp.role || 'Role', M, y);
      const range = [exp.start, exp.end].filter(Boolean).join(' – ');
      if (range) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE);
        doc.text(range, W - M, y, { align: 'right' });
      }
      y += 13;
      const org = [exp.company, exp.location].filter(Boolean).join(', ');
      if (org) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9.5);
        doc.setTextColor(...SLATE);
        doc.text(org, M, y);
        y += 13;
      }
      for (const b of exp.bullets) bullet(b);
      y += 4;
    }
  }

  /* ---------- Projects handled inside experience bullets ----------
  /* ---------- Education ---------- */
  if (resume.education.length) {
    sectionHeading('Education');
    for (const ed of resume.education) {
      ensure(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...NAVY);
      doc.text(ed.degree || 'Degree', M, y);
      if (ed.year) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...SLATE);
        doc.text(ed.year, W - M, y, { align: 'right' });
      }
      y += 13;
      const inst = [ed.institution, ed.field].filter(Boolean).join(' — ');
      if (inst) {
        para(inst, { size: 9.5, color: SLATE });
      }
      if (ed.detail) para(ed.detail, { size: 9, color: SLATE });
      y += 3;
    }
  }

  /* ---------- Certifications ---------- */
  if (resume.certifications.filter(Boolean).length) {
    sectionHeading('Certifications');
    for (const c of resume.certifications.filter(Boolean)) bullet(c);
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(165, 172, 185);
    doc.text(name, M, H - 22);
    doc.text(`Page ${p} of ${pages}`, W - M, H - 22, { align: 'right' });
  }

  const safe = (resume.full_name || 'resume').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  doc.save(`${safe || 'resume'}-improved.pdf`);
}
