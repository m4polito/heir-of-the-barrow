export function wrapText(text: string, cols: number): string[] {
  const words = text.split(' ').filter((w) => w.length > 0);
  const lines: string[] = [];
  let cur = '';
  for (const word of words) {
    let rest = word;
    while (rest.length > cols) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(rest.slice(0, cols));
      rest = rest.slice(cols);
    }
    if (cur === '') cur = rest;
    else if (cur.length + 1 + rest.length <= cols) cur += ' ' + rest;
    else {
      lines.push(cur);
      cur = rest;
    }
  }
  // the last chunk of a split word continues the greedy fill via `cur`
  if (cur || lines.length === 0) lines.push(cur);
  return lines;
}

export function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{([A-Za-z_]+)\}/g, (m, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? (vars[key] as string) : m,
  );
}
