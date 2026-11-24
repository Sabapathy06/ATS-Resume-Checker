import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractionResult {
  text: string;
  pages: number;
  characters: number;
}

export const ACCEPTED_TYPES = ['.pdf', '.docx', '.txt'];
export const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

export function validateFile(file: File): string | null {
  const name = file.name.toLowerCase();
  const ext = ACCEPTED_TYPES.find((e) => name.endsWith(e));
  if (!ext) {
    return 'Unsupported file type. Please upload a PDF, DOCX or TXT resume.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 8 MB.`;
  }
  if (file.size === 0) {
    return 'This file is empty.';
  }
  return null;
}

export async function extractTextFromFile(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    return extractFromPdf(file);
  }
  if (name.endsWith('.docx')) {
    return extractFromDocx(file);
  }
  if (name.endsWith('.txt')) {
    const text = await file.text();
    return { text, pages: 1, characters: text.length };
  }
  throw new Error('Unsupported file type.');
}

async function extractFromPdf(file: File): Promise<ExtractionResult> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let pageText = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const it = item as { str: string; transform: number[]; hasEOL?: boolean };
      const y = it.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        pageText += '\n';
      }
      pageText += it.str;
      if (it.hasEOL) pageText += '\n';
      lastY = y;
    }
    pages.push(pageText.trim());
  }

  const text = pages.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();

  if (text.replace(/\s/g, '').length < 120) {
    throw new Error(
      'This PDF appears to be a scanned image with no selectable text. Please upload a text-based PDF, or paste your resume text manually.'
    );
  }

  return { text, pages: pdf.numPages, characters: text.length };
}

async function extractFromDocx(file: File): Promise<ExtractionResult> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  const clean = text.replace(/\n{3,}/g, '\n\n').trim();
  if (clean.replace(/\s/g, '').length < 120) {
    throw new Error('Could not read enough text from this DOCX file. Try pasting your resume text instead.');
  }
  return { text: clean, pages: Math.max(1, Math.ceil(clean.length / 3000)), characters: clean.length };
}
