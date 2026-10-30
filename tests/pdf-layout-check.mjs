import { drawReportHeader, drawReportStats } from '../src/utils/pdfReportLayout.js';
import { readFileSync } from 'node:fs';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import assert from 'node:assert/strict';
for (const name of ['CreateEmployee', 'UserManagement']) {
 const source = readFileSync(`src/Pages/${name}.jsx`, 'utf8');
 const start = source.indexOf('const exportToPDF = () => {');
 const end = source.indexOf('\n};', start) >= 0 && name === 'CreateEmployee' ? source.indexOf('\n};', start) + 3 : source.indexOf('\n  };', start) + 5;
 const code = source.slice(start, end);
 const records = Array.from({length: 85}, (_, i) => ({employeeId: `EMP${i}`, emp_id: `EMP${i}`, fullName: 'Employee With A Longer Name', employee_name: 'Employee With A Longer Name', email: 'long.employee.address@example.com', department: 'Human Resource', designation: 'Senior Human Resource Executive', status: i % 2 ? 'Active' : 'Inactive', company: 'C-Tech', contactNumber: '9876543210', role: 'Employee'}));
 let pages = 0;
 function TestPDF(...args) { const doc = new jsPDF(...args); doc.save = () => { pages = doc.internal.getNumberOfPages(); assert.ok(pages > 1); }; return doc; }
 const checkedTable = (doc, options) => {
   assert.deepEqual(options.headStyles.fillColor, [14,165,233]);
   autoTable(doc, {...options, didDrawCell(data) {
     assert.ok(data.cell.y + data.cell.height <= doc.internal.pageSize.getHeight() - 24 + 0.01, 'table stays above footer');
     assert.ok(data.cell.x + data.cell.width <= doc.internal.pageSize.getWidth() - 12 + 0.1, 'columns fit page');
   }});
 };
 const run = new Function('drawReportHeader','drawReportStats','jsPDF','autoTable','filtered','employees','filteredUsers','users','COMPANY_OPTIONS','calcExperience','normalizeStatus','getDisplayStatus','onSnack','showToast','handleExportMenuClose', code + '; exportToPDF();');
 const notify = (message, severity) => { if (severity === 'error') throw new Error(message); };
 run(drawReportHeader, drawReportStats, TestPDF, checkedTable, records, records, records, records, [{value:'C-Tech', label:'C-Tech Engineering'}], ()=>'3 yrs 10 mo', s=>s.toLowerCase(), s=>s, notify, notify, ()=>{});
 assert.ok(pages > 1);
 console.log(`${name}: ${pages} pages; theme and table/footer bounds passed`);
}

