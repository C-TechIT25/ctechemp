// Shared report masthead and summary cards. Measurements are in millimetres.
export function drawReportHeader(doc, { title, subtitle, count, margin }) {
  const x = margin.left;
  const width = doc.internal.pageSize.getWidth() - x - margin.right;
  const y = margin.top;
  const portrait = width < 220;
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(x, y, width, portrait ? 29 : 22, 2, 2, 'F');
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(x + 4, y + 4, 8, 8, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CT', x + 8, y + 9.5, { align: 'center' });
  doc.setTextColor(3, 105, 161);
  doc.setFontSize(8);
  doc.text('C-TECH ENGINEERING', x + 16, y + 5);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text(title, x + 16, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, x + 16, y + 18);
  const right = x + width - 6;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  if (!portrait) doc.text('GENERATED ON', right, y + 5, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), portrait ? x + 16 : right, y + (portrait ? 25 : 11), { align: portrait ? 'left' : 'right' });
  doc.setFontSize(8);
  doc.setTextColor(3, 105, 161);
  doc.text(`${count} records  |  IST`, right, y + (portrait ? 25 : 18), { align: 'right' });
  return y + (portrait ? 33 : 26);
}

export function drawReportStats(doc, { stats, count, y, margin }) {
  const width = doc.internal.pageSize.getWidth() - margin.left - margin.right;
  const gap = 3;
  const cardWidth = (width - gap * (stats.length - 1)) / stats.length;
  stats.forEach((stat, index) => {
    const x = margin.left + index * (cardWidth + gap);
    const color = stat.borderColor;
    doc.setFillColor(...color.map(channel => Math.round(channel * 0.05 + 255 * 0.95)));
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, cardWidth, 18, 2, 2, 'FD');
    doc.setFillColor(...color);
    doc.circle(x + 5, y + 4, 0.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(stat.label, x + 8, y + 5);
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(String(stat.value), x + 5, y + 12);
    const isTotal = stat.label.startsWith('Total');
    const share = count ? Math.round(Number(stat.value) / count * 100) : 0;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(isTotal ? 'Exported records' : `${share}% of total`, x + cardWidth - 5, y + 12, { align: 'right' });
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(x + 5, y + 15, cardWidth - 10, 1, 0.5, 0.5, 'F');
    const fraction = isTotal ? 1 : Math.max(0, Math.min(1, Number(stat.value) / (count || 1)));
    if (fraction > 0) {
      doc.setFillColor(...color);
      doc.rect(x + 5, y + 15, (cardWidth - 10) * fraction, 1, 'F');
    }
  });
  return y + 23;
}

// Compact metrics for reports mixing counts and hours (no percentage comparison).
export function drawReportMetrics(doc, { stats, y, margin }) {
  const width = doc.internal.pageSize.getWidth() - margin.left - margin.right;
  const gap = 3;
  const cardWidth = (width - gap * (stats.length - 1)) / stats.length;
  stats.forEach((stat, index) => {
    const x = margin.left + index * (cardWidth + gap);
    const color = stat.borderColor || stat.color;
    doc.setFillColor(...color.map(value => Math.round(value * 0.06 + 255 * 0.94)));
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, y, cardWidth, 16, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(stat.label, x + 3, y + 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...color);
    doc.text(String(stat.value), x + 3, y + 12);
  });
  return y + 21;
}
