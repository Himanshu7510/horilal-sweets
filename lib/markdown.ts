import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

export function renderMarkdown(src: string): string {
  return marked.parse(String(src || ''), { async: false }) as string;
}

export function paragraphs(src: string): string[] {
  return String(src || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}
