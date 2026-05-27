import React, { useState, useRef, useEffect, useCallback } from "react";
import { db, storage } from "../Config";
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";

// ── helpers ────────────────────────────────────────────────────────────────────
function calcExperience(joiningDate) {
  if (!joiningDate) return "";
  const start = new Date(joiningDate);
  const now = new Date();
  if (isNaN(start) || start > now) return "";
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  const days = now.getDate() - start.getDate();
  if (days < 0) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return "< 1 month";
  const p = [];
  if (years > 0) p.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) p.push(`${months} mo`);
  return p.join(" ");
}

const BLANK = {
  employeeId: "", fullName: "", designation: "", department: "",
  contactNumber: "", email: "", bloodGroup: "",
  emergencyContact: "", emergencyPhone: "",
  joiningDate: "", location: "", workShift: "", status: "Active", notes: "",
};

// ── QR helpers ─────────────────────────────────────────────────────────────────
// FIXED: Use hash-router format: /#/employee/profile/<id>
const qrUrl = (emp) =>
  `${window.location.origin}/#/employee/profile/${emp.id}`;

async function generateQR(emp) {
  return QRCode.toDataURL(qrUrl(emp), {
    width: 300, margin: 2,
    color: { dark: "#0052cc", light: "#ffffff" },
  });
}

async function downloadQR(emp) {
  const dataUrl = await generateQR(emp);
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `QR_${emp.employeeId || emp.id}.png`;
  a.click();
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════════════════════
export default function EmployeeApp() {
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState("table"); // "table" | "form" | "profile"
  const [selected, setSelected] = useState(null);   // employee for edit/view
  const [viewEmp, setViewEmp] = useState(null);

  // Firestore real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmployees(list);
    });
    return unsub;
  }, []);

  const openCreate = () => { setSelected(null); setView("form"); };
  const openEdit = (emp) => { setSelected(emp); setView("form"); };
  const openProfile = (emp) => { setViewEmp(emp); setView("profile"); };
  const goTable = () => { setView("table"); setSelected(null); setViewEmp(null); };

  if (view === "form") return (
    <EmployeeForm
      existing={selected}
      onDone={goTable}
      onCancel={goTable}
    />
  );
  if (view === "profile") return (
    <EmployeeProfile emp={viewEmp} onBack={goTable} />
  );
  return (
    <EmployeeTable
      employees={employees}
      onCreate={openCreate}
      onEdit={openEdit}
      onView={openProfile}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLE
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeTable({ employees, onCreate, onEdit, onView }) {
  const [search, setSearch] = useState("");
  const [qrModal, setQrModal] = useState(null); // { emp, dataUrl }
  const [delConfirm, setDelConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = employees.filter((e) =>
    [e.fullName, e.employeeId, e.designation, e.department, e.email]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const openQR = async (emp) => {
    const dataUrl = await generateQR(emp);
    setQrModal({ emp, dataUrl });
  };

  const handleDelete = async () => {
    if (!delConfirm) return;
    setDeleting(true);
    await deleteDoc(doc(db, "employees", delConfirm.id));
    setDeleting(false);
    setDelConfirm(null);
  };

  return (
    <>
      <style>{CSS_TABLE}</style>
      <div className="app-root">
        {/* Header */}
        <div className="tbl-header">
          <div className="tbl-header-left">
            <div className="app-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="2 20 12 4 22 20" /><line x1="2" y1="20" x2="22" y2="20" /><line x1="12" y1="14" x2="12" y2="20" />
              </svg>
            </div>
            <div>
              <div className="app-title">Employee Management</div>
              <div className="app-sub">C-Tech Engineering · Admin Portal</div>
            </div>
          </div>
          <button className="btn-primary" onClick={onCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Employee
          </button>
        </div>

        {/* Stats */}
        <div className="stat-row">
          {[
            { label: "Total Employees", val: employees.length, color: "#2196F3" },
            { label: "Active", val: employees.filter(e => e.status === "Active").length, color: "#22c55e" },
            { label: "Inactive", val: employees.filter(e => e.status === "Inactive").length, color: "#f59e0b" },
          ].map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-num" style={{ color: s.color }}>{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="search-input"
            placeholder="Search by name, ID, designation, department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="tbl-wrap">
          <table className="emp-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Experience</th>
                <th style={{textAlign:"center"}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{textAlign:"center",padding:"48px",color:"#94a3b8"}}>
                    {employees.length === 0 ? "No employees yet. Click \"Create Employee\" to add one." : "No results found."}
                  </td>
                </tr>
              ) : filtered.map((emp) => (
                <tr key={emp.id} className="emp-row">
                  <td>
                    <div className="tbl-avatar">
                      {emp.photoURL
                        ? <img src={emp.photoURL} alt={emp.fullName} />
                        : <span>{(emp.fullName || "?")[0]}</span>
                      }
                    </div>
                  </td>
                  <td><span className="emp-id-pill">{emp.employeeId}</span></td>
                  <td><span className="emp-name">{emp.fullName}</span></td>
                  <td className="muted-cell">{emp.designation}</td>
                  <td className="muted-cell">{emp.department}</td>
                  <td className="muted-cell">{emp.contactNumber}</td>
                  <td>
                    <span className={`status-pill ${emp.status === "Active" ? "s-active" : "s-inactive"}`}>
                      {emp.status || "—"}
                    </span>
                  </td>
                  <td className="muted-cell">{calcExperience(emp.joiningDate) || "—"}</td>
                  <td>
                    <div className="action-row">
                      <ActionBtn title="View" color="#2196F3" onClick={() => onView(emp)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </ActionBtn>
                      <ActionBtn title="Edit" color="#f59e0b" onClick={() => onEdit(emp)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </ActionBtn>
                      <ActionBtn title="QR Code" color="#8b5cf6" onClick={() => openQR(emp)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M17 17h4v4h-4z"/></svg>
                      </ActionBtn>
                      <ActionBtn title="Delete" color="#ef4444" onClick={() => setDelConfirm(emp)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </ActionBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="tbl-footer">
          Showing {filtered.length} of {employees.length} employees · C-Tech Engineering Employee Management System
        </div>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Employee QR Code</div>
                <div className="modal-sub">{qrModal.emp.fullName} · {qrModal.emp.employeeId}</div>
              </div>
              <button className="modal-close" onClick={() => setQrModal(null)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="qr-display">
              <img src={qrModal.dataUrl} alt="QR" className="qr-img" />
            </div>
            <div className="qr-url">{qrUrl(qrModal.emp)}</div>
            <div className="qr-hint">Scan to open employee profile on any device</div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setQrModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => downloadQR(qrModal.emp)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delConfirm && (
        <div className="modal-overlay" onClick={() => setDelConfirm(null)}>
          <div className="modal-box" style={{maxWidth:420}} onClick={(e) => e.stopPropagation()}>
            <div className="del-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </div>
            <div className="modal-title" style={{textAlign:"center",marginBottom:8}}>Delete Employee?</div>
            <div className="modal-sub" style={{textAlign:"center",marginBottom:24}}>
              This will permanently remove <strong>{delConfirm.fullName}</strong> ({delConfirm.employeeId}) from Firebase. This cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDelConfirm(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ children, title, color, onClick }) {
  return (
    <button className="action-btn" title={title} onClick={onClick}
      style={{"--ac": color}}>
      {children}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FORM  (create + edit)
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeForm({ existing, onDone, onCancel }) {
  const isEdit = !!existing;
  const [form, setForm] = useState(isEdit ? { ...BLANK, ...existing } : BLANK);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(existing?.photoURL || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const experience = calcExperience(form.joiningDate);

  const set = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(""); };

  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) { setError("Select a valid image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError(""); setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const req = [["employeeId","Employee ID"],["fullName","Full Name"],["designation","Designation"],["department","Department"],["contactNumber","Contact Number"],["email","Email"],["joiningDate","Joining Date"]];
    for (const [k, l] of req) if (!form[k].trim()) return `"${l}" is required.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email.";
    return null;
  };

  const handleSubmit = async () => {
    setError("");
    const err = validate(); if (err) { setError(err); return; }
    setLoading(true);
    try {
      let photoURL = existing?.photoURL || "";
      if (imageFile) {
        const sRef = ref(storage, `employee-photos/${form.employeeId}_${Date.now()}`);
        const task = uploadBytesResumable(sRef, imageFile);
        photoURL = await new Promise((res, rej) => {
          task.on("state_changed",
            (s) => setUploadProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
            rej, async () => res(await getDownloadURL(task.snapshot.ref))
          );
        });
      }
      const data = { ...form, workExperience: experience, photoURL, updatedAt: serverTimestamp() };
      
      if (isEdit) {
        await updateDoc(doc(db, "employees", existing.id), data);
      } else {
        const docRef = await addDoc(collection(db, "employees"), { ...data, createdAt: serverTimestamp() });
        // No need to store verifyUrl - it's generated dynamically
      }
      onDone();
    } catch (e) { setError("Firebase error: " + e.message); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{CSS_TABLE}</style>
      <div className="app-root">
        {/* Header */}
        <div className="tbl-header">
          <div className="tbl-header-left">
            <button className="back-btn" onClick={onCancel}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div className="app-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="2 20 12 4 22 20"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="14" x2="12" y2="20"/>
              </svg>
            </div>
            <div>
              <div className="app-title">{isEdit ? "Edit Employee" : "Create Employee"}</div>
              <div className="app-sub">C-Tech Engineering · Admin Portal</div>
            </div>
          </div>
          <span className="tbl-badge">{isEdit ? "Editing Record" : "New Registration"}</span>
        </div>

        {error && <div className="form-error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}

        {/* Photo */}
        <div className="f-card">
          <SectionHead icon="user" title="Employee Photo" sub="Upload a clear passport-size photo" />
          <div className={`photo-zone${dragOver?" drag":""}`}
            onClick={() => fileRef.current.click()}
            onDragOver={(e)=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={(e)=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}>
            <div className="f-avatar">
              {imagePreview ? <img src={imagePreview} alt="preview"/> : <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>}
            </div>
            <div>
              <div className="photo-title">{imagePreview?"Photo selected — click to change":"Drag & drop or click to upload"}</div>
              <div className="photo-sub">JPG, PNG, WEBP · Max 5 MB</div>
            </div>
            <button className="btn-sm-blue" onClick={(e)=>{e.stopPropagation();fileRef.current.click();}}>
              {imagePreview?"Change":"Browse"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>handleFile(e.target.files[0])}/>
          </div>
          {loading && uploadProgress > 0 && (
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,color:"#64748b",marginBottom:4}}>Uploading… {uploadProgress}%</div>
              <div className="prog-wrap"><div className="prog-bar" style={{width:`${uploadProgress}%`}}/></div>
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="f-card">
          <SectionHead icon="badge" title="Identity & Role" sub="Employee ID, designation and department"/>
          <div className="g2">
            <F label="Employee ID" name="employeeId" placeholder="EMP-2024-0001" value={form.employeeId} onChange={set} req/>
            <F label="Full Name" name="fullName" placeholder="Rajesh Kumar" value={form.fullName} onChange={set} req/>
            <F label="Designation" name="designation" placeholder="e.g. Senior Structural Engineer" value={form.designation} onChange={set} req/>
            <F label="Department" name="department" placeholder="e.g. Civil & Structural Division" value={form.department} onChange={set} req/>
            <div className="f-field">
              <label className="f-label">Employment Status</label>
              <select className="f-input" name="status" value={form.status} onChange={set}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Joining */}
        <div className="f-card">
          <SectionHead icon="calendar" title="Joining & Work Experience" sub="Experience auto-calculated from joining date"/>
          <div className="g3">
            <F label="Date of Joining" name="joiningDate" type="date" value={form.joiningDate} onChange={set} req/>
            <F label="Work Shift" name="workShift" placeholder="e.g. 8:00 AM – 5:30 PM" value={form.workShift} onChange={set}/>
            <div className="f-field">
              <label className="f-label">Work Experience</label>
              {experience
                ? <div className="exp-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{experience}</div>
                : <div className="exp-empty">Auto-filled after selecting joining date</div>
              }
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="f-card">
          <SectionHead icon="phone" title="Contact Information" sub="Mobile, email and site location"/>
          <div className="g3">
            <F label="Mobile Number" name="contactNumber" placeholder="+91 98400 55123" value={form.contactNumber} onChange={set} req/>
            <F label="Work Email" name="email" placeholder="name@ctech-engg.in" value={form.email} onChange={set} req/>
            <F label="Work Location" name="location" placeholder="e.g. Chennai, Tamil Nadu" value={form.location} onChange={set}/>
          </div>
        </div>

        {/* Medical */}
        <div className="f-card">
          <SectionHead icon="heart" title="Medical & Emergency" sub="Blood group and emergency contact"/>
          <div className="g3">
            <F label="Blood Group" name="bloodGroup" placeholder="e.g. B+ / O-" value={form.bloodGroup} onChange={set}/>
            <F label="Emergency Contact Name" name="emergencyContact" placeholder="Priya Kumar (Spouse)" value={form.emergencyContact} onChange={set}/>
            <F label="Emergency Phone" name="emergencyPhone" placeholder="+91 94450 22876" value={form.emergencyPhone} onChange={set}/>
          </div>
        </div>

        {/* Notes */}
        <div className="f-card">
          <SectionHead icon="file" title="Additional Notes" sub="Certifications, remarks or special instructions"/>
          <textarea className="f-textarea" name="notes" value={form.notes} onChange={set}
            placeholder="e.g. Holds PMP certification, site safety trained…"/>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Spin/> Saving…</>
              : <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>{isEdit?"Update Employee":"Create & Save to Firebase"}</>
            }
          </button>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE  (view / QR scan landing)
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeProfile({ emp, onBack }) {
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    generateQR(emp).then(setQrDataUrl);
  }, [emp]);

  const Row = ({ icon, label, val }) => val ? (
    <div className="pr-row">
      <div className="pr-icon">{icon}</div>
      <div>
        <div className="pr-label">{label}</div>
        <div className="pr-val">{val}</div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <style>{CSS_TABLE}</style>
      <div className="app-root" style={{background:"#f0f4f8"}}>
        {/* Nav */}
        <div className="pr-nav">
          <button className="back-btn" onClick={onBack}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="pr-nav-title">Employee Profile</div>
          <div className="pr-nav-badge">
            <span className="pr-dot"/>QR Verified
          </div>
        </div>

        {/* Hero */}
        <div className="pr-hero">
          <div className="pr-hero-deco"/>
          <div className="pr-hero-inner">
            <div className="pr-avatar-ring">
              <div className="pr-avatar">
                {emp.photoURL
                  ? <img src={emp.photoURL} alt={emp.fullName}/>
                  : <span>{(emp.fullName||"?")[0]}</span>
                }
              </div>
            </div>
            <div className="pr-name">{emp.fullName}</div>
            <div className="pr-desig">{emp.designation}{emp.department ? ` · ${emp.department}` : ""}</div>
            <div className="pr-pills">
              <span className={`pr-pill ${emp.status==="Active"?"pr-pill-green":"pr-pill-gray"}`}>
                <span className="pr-dot"/>
                {emp.status || "Active"}
              </span>
              {emp.employeeId && <span className="pr-pill pr-pill-blue">{emp.employeeId}</span>}
              {emp.location && <span className="pr-pill pr-pill-blue">{emp.location}</span>}
            </div>
          </div>
        </div>

        <div className="pr-body">
          {/* Verified strip */}
          <div className="verified-strip">
            <div className="verified-shield">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
            </div>
            <div style={{flex:1}}>
              <div className="verified-title">Identity Verified</div>
              <div className="verified-sub">Authenticated via C-Tech QR Code</div>
            </div>
            <div className="verified-live">Live</div>
          </div>

          {/* Stats */}
          <div className="pr-stats">
            {[
              { label: "Experience", val: calcExperience(emp.joiningDate) || "—" },
              { label: "Blood Group", val: emp.bloodGroup || "—" },
              { label: "Status", val: emp.status || "Active" },
            ].map((s) => (
              <div className="pr-stat" key={s.label}>
                <div className="pr-stat-val">{s.val}</div>
                <div className="pr-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Details card */}
          <div className="pr-card">
            <div className="pr-card-title">Contact Information</div>
            <Row icon={<PhoneIcon/>} label="Mobile" val={emp.contactNumber}/>
            <Row icon={<MailIcon/>} label="Work Email" val={emp.email}/>
            <Row icon={<PinIcon/>} label="Location" val={emp.location}/>
            <Row icon={<ClockIcon/>} label="Work Shift" val={emp.workShift}/>
          </div>

          <div className="pr-card">
            <div className="pr-card-title">Employment Details</div>
            <Row icon={<BagIcon/>} label="Department" val={emp.department}/>
            <Row icon={<UserIcon/>} label="Designation" val={emp.designation}/>
            <Row icon={<CalIcon/>} label="Date of Joining" val={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}) : ""}/>
            <Row icon={<ClockIcon/>} label="Work Experience" val={calcExperience(emp.joiningDate)}/>
          </div>

          {(emp.bloodGroup || emp.emergencyContact) && (
            <div className="pr-card pr-emergency">
              <div className="pr-card-title" style={{color:"#b91c1c"}}>Medical & Emergency</div>
              <Row icon={<HeartIcon/>} label="Blood Group" val={emp.bloodGroup}/>
              <Row icon={<UserIcon/>} label="Emergency Contact" val={emp.emergencyContact}/>
              <Row icon={<PhoneIcon/>} label="Emergency Phone" val={emp.emergencyPhone}/>
            </div>
          )}

          {emp.notes && (
            <div className="pr-card">
              <div className="pr-card-title">Notes</div>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.7,marginTop:4}}>{emp.notes}</p>
            </div>
          )}

          {/* QR Section */}
          <div className="pr-qr-card">
            <div className="pr-qr-title">Scan QR to Open Employee Profile</div>
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="pr-qr-img"/>}
            <div className="pr-qr-url">{qrUrl(emp)}</div>
            <button className="btn-primary" style={{marginTop:12}} onClick={() => downloadQR(emp)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download QR PNG
            </button>
          </div>

          {/* Footer */}
          <div className="pr-footer">
            <div className="pr-footer-logo">C-TECH ENGINEERING</div>
            <div className="pr-footer-div"/>
            <div className="pr-footer-tag">BUILDING TRUST. DELIVERING EXCELLENCE.</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Small icon components ──────────────────────────────────────────────────────
const I = (d) => () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const PhoneIcon = I("M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z");
const MailIcon = I("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z");
const PinIcon  = I("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z");
const BagIcon  = I("M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z");
const UserIcon = I("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2");
const CalIcon  = I("M3 4h18v16H3z");
const ClockIcon= I("M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z");
const HeartIcon= I("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");

function Spin() {
  return <svg style={{animation:"spin .85s linear infinite",display:"inline-block"}} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}

function SectionHead({ title, sub }) {
  return (
    <div className="sec-head">
      <div className="sec-icon">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
      </div>
      <div>
        <div className="sec-title">{title}</div>
        <div className="sec-sub">{sub}</div>
      </div>
    </div>
  );
}

function F({ label, name, placeholder, value, onChange, type="text", req }) {
  return (
    <div className="f-field">
      <label className="f-label">{label}{req && <span style={{color:"#ef4444"}}> *</span>}</label>
      <input className="f-input" type={type} name={name} placeholder={placeholder} value={value} onChange={onChange} autoComplete="off"/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
const CSS_TABLE = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.app-root{min-height:100vh;background:#f0f4f8;font-family:'Plus Jakarta Sans',sans-serif;padding:28px 28px 60px;color:#1e293b;}
@media(max-width:768px){.app-root{padding:16px 14px 48px;}}

/* header */
.tbl-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px;}
.tbl-header-left{display:flex;align-items:center;gap:12px;}
.app-logo{width:46px;height:46px;background:#2196F3;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.app-title{font-size:21px;font-weight:700;color:#1e293b;letter-spacing:-0.3px;}
.app-sub{font-size:12px;color:#64748b;margin-top:1px;}
.tbl-badge{background:#e3f2fd;color:#1565c0;border:1px solid #90caf9;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:600;}
.back-btn{width:36px;height:36px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#475569;flex-shrink:0;transition:background .15s;}
.back-btn:hover{background:#f1f5f9;}

/* stats */
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;}
@media(max-width:500px){.stat-row{grid-template-columns:1fr 1fr;}  }
.stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;}
.stat-num{font-size:28px;font-weight:700;line-height:1;}
.stat-label{font-size:12px;color:#64748b;margin-top:4px;font-weight:500;}

/* search */
.search-wrap{position:relative;margin-bottom:16px;}
.search-input{width:100%;padding:11px 14px 11px 40px;border:1.5px solid #e2e8f0;border-radius:11px;font-size:14px;font-family:'Plus Jakarta Sans',sans-serif;background:#fff;outline:none;transition:border-color .18s,box-shadow .18s;color:#1e293b;}
.search-input:focus{border-color:#2196F3;box-shadow:0 0 0 3px rgba(33,150,243,.12);}
.search-input::placeholder{color:#c4ccd8;}

/* table */
.tbl-wrap{background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:auto;}
.emp-table{width:100%;border-collapse:collapse;min-width:900px;}
.emp-table thead tr{background:#f8fafc;border-bottom:2px solid #f1f5f9;}
.emp-table th{padding:13px 16px;text-align:left;font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:.6px;text-transform:uppercase;white-space:nowrap;}
.emp-table td{padding:14px 16px;border-bottom:1px solid #f8fafc;vertical-align:middle;}
.emp-row{transition:background .12s;}
.emp-row:hover{background:#f8fbff;}
.emp-row:last-child td{border-bottom:none;}
.tbl-avatar{width:38px;height:38px;border-radius:50%;overflow:hidden;background:#dbeafe;display:flex;align-items:center;justify-content:center;border:2px solid #e2e8f0;}
.tbl-avatar img{width:100%;height:100%;object-fit:cover;}
.tbl-avatar span{font-size:15px;font-weight:700;color:#2196F3;}
.emp-id-pill{background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:3px 9px;font-size:12px;font-weight:600;font-family:monospace;white-space:nowrap;}
.emp-name{font-weight:600;font-size:14px;color:#1e293b;}
.muted-cell{font-size:13px;color:#64748b;}
.status-pill{border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;white-space:nowrap;}
.s-active{background:#dcfce7;color:#166534;}
.s-inactive{background:#fef3c7;color:#92400e;}
.action-row{display:flex;align-items:center;gap:6px;justify-content:center;}
.action-btn{width:32px;height:32px;border-radius:8px;border:1px solid color-mix(in srgb,var(--ac) 25%,transparent);background:color-mix(in srgb,var(--ac) 10%,transparent);color:var(--ac);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,transform .12s;}
.action-btn:hover{background:color-mix(in srgb,var(--ac) 18%,transparent);transform:scale(1.08);}
.tbl-footer{margin-top:14px;font-size:12px;color:#94a3b8;text-align:center;}

/* modal */
.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}
.modal-box{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:460px;}
.modal-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;}
.modal-title{font-size:17px;font-weight:700;color:#1e293b;}
.modal-sub{font-size:13px;color:#64748b;margin-top:3px;}
.modal-close{width:32px;height:32px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;flex-shrink:0;}
.qr-display{display:flex;justify-content:center;margin:8px 0 12px;}
.qr-img{width:220px;height:220px;border-radius:12px;border:3px solid #e3f2fd;}
.qr-url{text-align:center;font-size:11px;font-family:monospace;color:#2196F3;background:#eff6ff;border-radius:8px;padding:7px 12px;word-break:break-all;}
.qr-hint{text-align:center;font-size:12px;color:#94a3b8;margin-top:8px;}
.modal-actions{display:flex;gap:10px;margin-top:20px;}
.del-icon{width:60px;height:60px;background:#fef2f2;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
.btn-danger{flex:1;padding:11px;background:#ef4444;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .18s;}
.btn-danger:hover:not(:disabled){background:#dc2626;}
.btn-danger:disabled{opacity:.6;cursor:not-allowed;}

/* shared buttons */
.btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#2196F3;border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .18s,transform .12s;white-space:nowrap;box-shadow:0 2px 10px rgba(33,150,243,.25);}
.btn-primary:hover:not(:disabled){background:#1976d2;transform:translateY(-1px);}
.btn-primary:disabled{background:#90caf9;cursor:not-allowed;box-shadow:none;}
.btn-secondary{flex:1;padding:11px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;color:#475569;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .15s;}
.btn-secondary:hover{background:#f1f5f9;}
.btn-sm-blue{background:#2196F3;color:#fff;border:none;border-radius:8px;padding:8px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;white-space:nowrap;}
.btn-sm-blue:hover{background:#1976d2;}

/* form */
.f-card{background:#fff;border-radius:16px;border:1px solid #e2e8f0;padding:26px 28px 22px;margin-bottom:14px;}
.f-card:hover{box-shadow:0 2px 16px rgba(33,150,243,.07);}
.sec-head{display:flex;align-items:center;gap:11px;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #f1f5f9;}
.sec-icon{width:34px;height:34px;background:#e3f2fd;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sec-title{font-size:14px;font-weight:700;color:#1e293b;}
.sec-sub{font-size:12px;color:#94a3b8;margin-top:2px;}
.g2{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
@media(max-width:640px){.g2,.g3{grid-template-columns:1fr;}}
@media(min-width:641px) and (max-width:860px){.g3{grid-template-columns:repeat(2,1fr);}}
.f-field{display:flex;flex-direction:column;gap:6px;}
.f-label{font-size:12px;font-weight:600;color:#334155;letter-spacing:.2px;}
.f-input{border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 13px;font-size:14px;color:#1e293b;font-family:'Plus Jakarta Sans',sans-serif;outline:none;background:#fafbfc;width:100%;transition:border-color .18s,box-shadow .18s,background .18s;}
.f-input:focus{border-color:#2196F3;background:#fff;box-shadow:0 0 0 3px rgba(33,150,243,.12);}
.f-input::placeholder{color:#c4ccd8;}
.f-textarea{width:100%;border:1.5px solid #e2e8f0;border-radius:10px;padding:11px 13px;font-size:14px;color:#1e293b;font-family:'Plus Jakarta Sans',sans-serif;outline:none;background:#fafbfc;resize:vertical;min-height:88px;line-height:1.65;transition:border-color .18s,box-shadow .18s;}
.f-textarea:focus{border-color:#2196F3;background:#fff;box-shadow:0 0 0 3px rgba(33,150,243,.12);}
.f-textarea::placeholder{color:#c4ccd8;}
.photo-zone{border:2px dashed #bfdbfe;border-radius:14px;padding:26px 20px;display:flex;align-items:center;gap:20px;cursor:pointer;background:#f8fbff;flex-wrap:wrap;transition:border-color .2s,background .2s;}
.photo-zone.drag,.photo-zone:hover{border-color:#2196F3;background:#eff6ff;}
.f-avatar{width:88px;height:88px;border-radius:50%;border:3px solid #2196F3;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#dbeafe;flex-shrink:0;}
.f-avatar img{width:100%;height:100%;object-fit:cover;}
.photo-title{font-size:14px;font-weight:600;color:#334155;}
.photo-sub{font-size:12px;color:#94a3b8;margin-top:4px;}
.exp-badge{display:inline-flex;align-items:center;gap:7px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:10px 13px;font-size:14px;font-weight:600;color:#1d4ed8;min-height:42px;}
.exp-empty{font-size:13px;color:#c4ccd8;min-height:42px;display:flex;align-items:center;}
.prog-wrap{background:#e2e8f0;border-radius:99px;height:6px;overflow:hidden;}
.prog-bar{height:100%;background:linear-gradient(90deg,#2196F3,#42a5f5);border-radius:99px;transition:width .3s;}
.form-error{background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:12px 16px;font-size:13px;color:#dc2626;margin-bottom:14px;display:flex;align-items:center;gap:8px;font-weight:500;}
.form-actions{display:flex;gap:12px;margin-top:4px;}
@keyframes spin{to{transform:rotate(360deg);}}

/* profile */
.pr-nav{display:flex;align-items:center;gap:12px;margin-bottom:0;padding:0 0 16px;}
.pr-nav-title{font-size:17px;font-weight:700;color:#1e293b;flex:1;}
.pr-nav-badge{display:flex;align-items:center;gap:6px;background:#dcfce7;border:1px solid #86efac;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:600;color:#166534;}
.pr-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block;animation:blink 1.5s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.35}}
.pr-hero{background:linear-gradient(140deg,#0052cc 0%,#0a3a7a 55%,#091e42 100%);border-radius:20px;padding:32px 20px 60px;position:relative;overflow:hidden;margin-bottom:-36px;}
.pr-hero-deco{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;border:40px solid rgba(255,255,255,.05);}
.pr-hero-inner{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;}
.pr-avatar-ring{width:92px;height:92px;border-radius:50%;border:3px solid rgba(255,255,255,.3);padding:3px;margin-bottom:14px;}
.pr-avatar{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#1e40af,#0052cc);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:30px;color:#fff;overflow:hidden;}
.pr-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.pr-name{font-size:22px;font-weight:700;color:#fff;margin-bottom:4px;}
.pr-desig{font-size:13px;color:rgba(255,255,255,.65);margin-bottom:12px;}
.pr-pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.pr-pill{border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;}
.pr-pill-green{background:rgba(34,197,94,.2);border:.5px solid rgba(34,197,94,.45);color:#4ade80;}
.pr-pill-blue{background:rgba(255,255,255,.12);border:.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.85);}
.pr-pill-gray{background:rgba(255,255,255,.1);border:.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);}
.pr-body{padding:0 0 24px;}
.verified-strip{background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:13px;margin:48px 0 16px;position:relative;z-index:5;}
.verified-shield{width:42px;height:42px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.verified-title{font-size:14px;font-weight:700;color:#166534;}
.verified-sub{font-size:12px;color:#4ade80;margin-top:2px;}
.verified-live{background:#dcfce7;color:#166534;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;}
.pr-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;}
.pr-stat{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:14px;text-align:center;}
.pr-stat-val{font-size:18px;font-weight:700;color:#2196F3;line-height:1;}
.pr-stat-label{font-size:10px;color:#94a3b8;font-weight:600;margin-top:5px;text-transform:uppercase;letter-spacing:.5px;}
.pr-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px 18px 10px;margin-bottom:12px;}
.pr-emergency{background:#fff5f5;border-color:#fecaca;}
.pr-card-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;}
.pr-row{display:flex;align-items:flex-start;gap:11px;padding:9px 0;border-bottom:.5px solid #f8fafc;}
.pr-row:last-child{border-bottom:none;}
.pr-icon{width:30px;height:30px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#2196F3;flex-shrink:0;margin-top:1px;}
.pr-label{font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:.4px;text-transform:uppercase;line-height:1;margin-bottom:3px;}
.pr-val{font-size:13px;color:#1e293b;font-weight:500;}
.pr-qr-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:22px;display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:14px;}
.pr-qr-title{font-size:13px;font-weight:600;color:#475569;}
.pr-qr-img{width:180px;height:180px;border-radius:12px;border:3px solid #e3f2fd;}
.pr-qr-url{font-size:10px;font-family:monospace;color:#2196F3;background:#eff6ff;border-radius:7px;padding:6px 10px;text-align:center;word-break:break-all;max-width:100%;}
.pr-footer{background:linear-gradient(135deg,#0052cc,#091e42);border-radius:16px;padding:20px;text-align:center;}
.pr-footer-logo{font-weight:700;font-size:15px;color:#fff;letter-spacing:1.5px;}
.pr-footer-div{width:36px;height:1px;background:rgba(255,255,255,.2);margin:8px auto;}
.pr-footer-tag{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1.5px;}
input[type="date"]::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer;}
`;