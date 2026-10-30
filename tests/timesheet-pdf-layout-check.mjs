import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
const source = readFileSync('src/Pages/Timesheet.jsx', 'utf8');
const start = source.indexOf('        autoTable(doc, {', source.indexOf('// AutoTable wraps'));
const end = source.indexOf('        currentY = doc.lastAutoTable', start);
const render = new Function('autoTable', 'doc', 'currentY', 'MARGIN', 'timesheet', 'index', 'formatDateLocal', 'employee', 'work', 'tracking', 'calculateWorkDurationLocal', 'CONTENT_WIDTH', 'PDF_COLORS', source.slice(start,end));
const doc = new jsPDF('portrait','mm','a4');
const colors = {primary:[14,165,233],border:[226,232,240],text:[15,23,42]};
let y = 235;
for (let i=0;i<10;i++) {
 const pages = new Set();
 const draw = (pdf, opts) => autoTable(pdf, {...opts, didDrawCell(data) {
  pages.add(pdf.internal.getCurrentPageInfo().pageNumber);
  assert.ok(data.cell.y+data.cell.height <= 277.01);
  assert.ok(data.cell.x+data.cell.width <= 198.01);
 }});
 render(draw,doc,y,{top:12,left:12,right:12,bottom:20},{employee_name:'Employee',description:'Reviewed financial ledger and resolved validation issues. '.repeat(8),remark:'Approved'},i,()=> '30 Oct 2026','Name: Employee\nID: 123\nDesignation: Developer\nDepartment: IT\nDate: 30 Oct 2026\nWork mode: Office','Working hours: 8h\nOT: 0h\nTotal: 8h\nPermission: 0h','Check in: 09:00 AM | Check out: 06:00 PM',()=> '9h',186,colors);
 assert.equal(pages.size,1,'a normal record must never split or leave a heading behind');
 y=doc.lastAutoTable.finalY+6;
}
console.log('10 portrait records: each stays on one page, with safe margins.');

