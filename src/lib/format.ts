export function scoreColor(score: number): string {
  if (score >= 85) return '#34d399';
  if (score >= 70) return '#60a5fa';
  if (score >= 55) return '#fbbf24';
  return '#f87171';
}

export function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Average';
  return 'Needs Improvement';
}

export function ratingBadgeClass(rating: string): string {
  switch (rating) {
    case 'Excellent':
      return 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30';
    case 'Good':
      return 'bg-blue-400/10 text-blue-300 border-blue-400/30';
    case 'Average':
      return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
    default:
      return 'bg-rose-400/10 text-rose-300 border-rose-400/30';
  }
}

export function priorityClass(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-rose-400/10 text-rose-300 border-rose-400/30';
    case 'medium':
      return 'bg-amber-400/10 text-amber-300 border-amber-400/30';
    default:
      return 'bg-sky-400/10 text-sky-300 border-sky-400/30';
  }
}

export function categoryClass(category: string): string {
  switch (category) {
    case 'language':
      return 'bg-blue-500/10 text-blue-300 border-blue-500/25';
    case 'framework':
      return 'bg-violet-500/10 text-violet-300 border-violet-500/25';
    case 'cloud':
      return 'bg-sky-500/10 text-sky-300 border-sky-500/25';
    case 'devops':
      return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25';
    case 'data':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25';
    case 'database':
      return 'bg-teal-500/10 text-teal-300 border-teal-500/25';
    case 'analytics':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
    case 'design':
      return 'bg-pink-500/10 text-pink-300 border-pink-500/25';
    case 'methodology':
      return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25';
    default:
      return 'bg-slate-500/10 text-slate-300 border-slate-500/25';
  }
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return '—';
  const diff = Date.now() - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function timeAgoShort(iso: string): string {
  return formatRelative(iso);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
