export function to24h(time?: string | null): string | null {
  if (!time) return null;
  const s = time.trim();

  // h:mm[:ss] AM/PM
  const ampm = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const sec = ampm[3] ? parseInt(ampm[3], 10) : 0;
    const mer = ampm[4].toLowerCase();
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  // HH:mm[:ss]
  const hms = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (hms) {
    const h = parseInt(hms[1], 10);
    const m = parseInt(hms[2], 10);
    const sec = hms[3] ? parseInt(hms[3], 10) : 0;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
  }

  return null; // unknown format
}

export function addHours(hhmmss: string, hours: number): string {
  const [h, m, s] = hhmmss.split(':').map((n) => parseInt(n, 10));
  const d = new Date(2000, 0, 1, h, m, s || 0);
  d.setHours(d.getHours() + hours);
  const H = d.getHours().toString().padStart(2,'0');
  const M = d.getMinutes().toString().padStart(2,'0');
  const S = d.getSeconds().toString().padStart(2,'0');
  return `${H}:${M}:${S}`;
}
