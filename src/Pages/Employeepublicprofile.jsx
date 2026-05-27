import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../Config"; // Make sure this path is correct
import { doc, getDoc } from "firebase/firestore";
import QRCode from "qrcode";

// ── helper ─────────────────────────────────────────────────────────────────────
function calcExperience(joiningDate) {
  if (!joiningDate) return "";
  const start = new Date(joiningDate);
  const now   = new Date();
  if (isNaN(start) || start > now) return "";
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth()    - start.getMonth();
  const days = now.getDate()     - start.getDate();
  if (days   < 0) months  -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return "< 1 month";
  const p = [];
  if (years  > 0) p.push(`${years}  yr${years  > 1 ? "s" : ""}`);
  if (months > 0) p.push(`${months} mo`);
  return p.join(" ");
}

async function downloadQR(emp, id) {
  const url = `${window.location.origin}/#/employee/profile/${id}`;
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300, margin: 2,
    color: { dark: "#0052cc", light: "#ffffff" },
  });
  const a = document.createElement("a");
  a.href     = dataUrl;
  a.download = `QR_${emp.employeeId || id}.png`;
  a.click();
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Employeepublicprofile() {
  const { id } = useParams();
  const [emp,    setEmp]    = useState(null);
  const [status, setStatus] = useState("loading"); // loading | found | notfound
  const [qrUrl,  setQrUrl]  = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "employees", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setEmp(data);
          setStatus("found");
          const url = `${window.location.origin}/#/employee/profile/${id}`;
          const dataUrl = await QRCode.toDataURL(url, {
            width: 260, margin: 2,
            color: { dark: "#0052cc", light: "#ffffff" },
          });
          setQrUrl(dataUrl);
        } else {
          setStatus("notfound");
        }
      } catch {
        setStatus("notfound");
      }
    })();
  }, [id]);

  if (status === "loading") return <Loader />;
  if (status === "notfound") return <NotFound />;

  return (
    <>
      <style>{CSS}</style>
      <div className="pub-root">

        {/* ── Top nav ── */}
        <div className="pub-nav">
          <div className="pub-nav-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="2 20 12 4 22 20"/><line x1="2" y1="20" x2="22" y2="20"/><line x1="12" y1="14" x2="12" y2="20"/>
            </svg>
          </div>
          <span className="pub-nav-brand">C-TECH ENGINEERING</span>
          <div className="pub-nav-badge">
            <span className="blink-dot" />QR Verified
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="pub-hero">
          <div className="hero-deco" />
          <div className="hero-inner">
            <div className="hero-avatar-ring">
              <div className="hero-avatar">
                {emp.photoURL
                  ? <img src={emp.photoURL} alt={emp.fullName} />
                  : <span>{(emp.fullName || "?")[0].toUpperCase()}</span>
                }
              </div>
            </div>
            <h1 className="hero-name">{emp.fullName}</h1>
            <p className="hero-desig">
              {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
            </p>
            <div className="hero-pills">
              <span className={`pill ${emp.status === "Active" ? "pill-green" : "pill-gray"}`}>
                <span className="blink-dot" />{emp.status || "Active"}
              </span>
              {emp.employeeId && <span className="pill pill-blue">{emp.employeeId}</span>}
              {emp.location   && <span className="pill pill-blue">{emp.location}</span>}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="pub-body">

          {/* Verified strip */}
          <div className="verified-strip">
            <div className="v-shield">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div style={{flex:1}}>
              <div className="v-title">Identity Verified</div>
              <div className="v-sub">Officially authenticated by C-Tech Engineering</div>
            </div>
            <span className="v-live">Live</span>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <Stat label="Experience" val={calcExperience(emp.joiningDate) || "—"} />
            <Stat label="Blood Group" val={emp.bloodGroup || "—"} />
            <Stat label="Status"     val={emp.status || "Active"} />
          </div>

          {/* Contact */}
          <Card title="Contact Information">
            <Row icon={<PhoneIco />} label="Mobile"     val={emp.contactNumber} />
            <Row icon={<MailIco  />} label="Work Email" val={emp.email} />
            <Row icon={<PinIco   />} label="Location"   val={emp.location} />
            <Row icon={<ClockIco />} label="Work Shift" val={emp.workShift} />
          </Card>

          {/* Employment */}
          <Card title="Employment Details">
            <Row icon={<BagIco  />} label="Department"      val={emp.department} />
            <Row icon={<UserIco />} label="Designation"     val={emp.designation} />
            <Row icon={<CalIco  />} label="Date of Joining" val={
              emp.joiningDate
                ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
                : ""
            } />
            <Row icon={<ClockIco />} label="Work Experience" val={calcExperience(emp.joiningDate)} />
          </Card>

          {/* Emergency */}
          {(emp.bloodGroup || emp.emergencyContact || emp.emergencyPhone) && (
            <Card title="Medical & Emergency" emergency>
              <Row icon={<HeartIco />} label="Blood Group"       val={emp.bloodGroup} />
              <Row icon={<UserIco  />} label="Emergency Contact" val={emp.emergencyContact} />
              <Row icon={<PhoneIco />} label="Emergency Phone"   val={emp.emergencyPhone} />
            </Card>
          )}

          {/* Notes */}
          {emp.notes && (
            <Card title="Notes">
              <p style={{fontSize:13,color:"#475569",lineHeight:1.75,marginTop:4}}>{emp.notes}</p>
            </Card>
          )}

          {/* QR */}
          <div className="qr-card">
            <p className="qr-card-title">Scan QR to Open This Profile</p>
            {qrUrl && <img src={qrUrl} alt="QR Code" className="qr-img" />}
            <p className="qr-url">{`${window.location.origin}/#/employee/profile/${id}`}</p>
            <button className="dl-btn" onClick={() => downloadQR(emp, id)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download QR PNG
            </button>
          </div>

          {/* Footer */}
          <div className="pub-footer">
            <div className="footer-logo">C-TECH ENGINEERING</div>
            <div className="footer-div" />
            <div className="footer-tag">BUILDING TRUST. DELIVERING EXCELLENCE.</div>
            <div className="footer-copy">© {new Date().getFullYear()} C-Tech Engineering Co. All rights reserved.</div>
          </div>

        </div>
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Card({ title, children, emergency }) {
  return (
    <div className={`pub-card${emergency ? " pub-card-emg" : ""}`}>
      <div className={`card-title${emergency ? " card-title-emg" : ""}`}>{title}</div>
      {children}
    </div>
  );
}

function Row({ icon, label, val }) {
  if (!val) return null;
  return (
    <div className="detail-row">
      <div className="detail-icon">{icon}</div>
      <div>
        <div className="detail-label">{label}</div>
        <div className="detail-val">{val}</div>
      </div>
    </div>
  );
}

function Stat({ label, val }) {
  return (
    <div className="stat-box">
      <div className="stat-val">{val}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Loader() {
  return (
    <>
      <style>{CSS}</style>
      <div className="pub-root" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <div style={{textAlign:"center"}}>
          <svg style={{animation:"spin .8s linear infinite",display:"block",margin:"0 auto 16px"}} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2196F3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          <div style={{fontSize:14,color:"#64748b",fontFamily:"sans-serif"}}>Loading employee profile…</div>
        </div>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <>
      <style>{CSS}</style>
      <div className="pub-root" style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
        <div style={{textAlign:"center",padding:32}}>
          <div style={{fontSize:48,marginBottom:12}}>🔍</div>
          <div style={{fontSize:18,fontWeight:700,color:"#1e293b",fontFamily:"sans-serif"}}>Employee not found</div>
          <div style={{fontSize:14,color:"#64748b",marginTop:8,fontFamily:"sans-serif"}}>This QR code may be invalid or the employee record was removed.</div>
        </div>
      </div>
    </>
  );
}

// ── Tiny SVG icons ─────────────────────────────────────────────────────────────
const Ico = (d) => () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);
const PhoneIco = Ico("M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z");
const MailIco  = Ico("M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z");
const PinIco   = Ico("M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z");
const ClockIco = Ico("M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z");
const BagIco   = Ico("M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z");
const UserIco  = Ico("M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2");
const CalIco   = Ico("M3 4h18v16H3z");
const HeartIco = Ico("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z");

// ── Styles ─────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#f0f4f8;}
.pub-root{min-height:100vh;background:#f0f4f8;font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;}

/* nav */
.pub-nav{background:#2196F3;padding:12px 18px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
.pub-nav-logo{width:34px;height:34px;background:rgba(255,255,255,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.pub-nav-brand{font-size:14px;font-weight:700;color:#fff;letter-spacing:1px;flex:1;}
.pub-nav-badge{display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 12px;font-size:11px;font-weight:600;color:#fff;white-space:nowrap;}

/* hero */
.pub-hero{background:linear-gradient(140deg,#0052cc 0%,#0a3a7a 55%,#091e42 100%);padding:32px 20px 60px;position:relative;overflow:hidden;}
.hero-deco{position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;border:40px solid rgba(255,255,255,.05);}
.hero-inner{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;}
.hero-avatar-ring{width:96px;height:96px;border-radius:50%;border:3px solid rgba(255,255,255,.3);padding:3px;margin-bottom:14px;}
.hero-avatar{width:100%;height:100%;border-radius:50%;background:linear-gradient(135deg,#1e40af,#0052cc);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:32px;color:#fff;overflow:hidden;}
.hero-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.hero-name{font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;}
.hero-desig{font-size:13px;color:rgba(255,255,255,.65);margin-bottom:14px;}
.hero-pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;}
.pill{border-radius:20px;padding:4px 13px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:5px;}
.pill-green{background:rgba(34,197,94,.2);border:.5px solid rgba(34,197,94,.45);color:#4ade80;}
.pill-blue{background:rgba(255,255,255,.12);border:.5px solid rgba(255,255,255,.25);color:rgba(255,255,255,.85);}
.pill-gray{background:rgba(255,255,255,.1);border:.5px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);}
.blink-dot{width:6px;height:6px;background:#22c55e;border-radius:50%;display:inline-block;animation:blink 1.5s infinite;}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* body */
.pub-body{padding:0 14px 32px;}

/* verified */
.verified-strip{background:#f0fdf4;border:1px solid #86efac;border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;margin:46px 0 14px;position:relative;z-index:5;}
.v-shield{width:42px;height:42px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.v-title{font-size:14px;font-weight:700;color:#166534;}
.v-sub{font-size:11px;color:#4ade80;margin-top:2px;}
.v-live{background:#dcfce7;color:#166534;border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;white-space:nowrap;}

/* stats */
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;}
.stat-box{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:14px 10px;text-align:center;}
.stat-val{font-size:17px;font-weight:700;color:#2196F3;line-height:1;}
.stat-label{font-size:10px;color:#94a3b8;font-weight:600;margin-top:5px;text-transform:uppercase;letter-spacing:.5px;}

/* cards */
.pub-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 16px 8px;margin-bottom:10px;}
.pub-card-emg{background:#fff5f5;border-color:#fecaca;}
.card-title{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;}
.card-title-emg{color:#b91c1c;}
.detail-row{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:.5px solid #f8fafc;}
.detail-row:last-child{border-bottom:none;}
.detail-icon{width:30px;height:30px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#2196F3;flex-shrink:0;margin-top:1px;}
.detail-label{font-size:10px;color:#94a3b8;font-weight:600;letter-spacing:.4px;text-transform:uppercase;line-height:1;margin-bottom:3px;}
.detail-val{font-size:13px;color:#1e293b;font-weight:500;}

/* qr */
.qr-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:12px;}
.qr-card-title{font-size:13px;font-weight:600;color:#475569;}
.qr-img{width:170px;height:170px;border-radius:12px;border:3px solid #e3f2fd;}
.qr-url{font-size:10px;font-family:monospace;color:#2196F3;background:#eff6ff;border-radius:7px;padding:6px 10px;text-align:center;word-break:break-all;max-width:100%;}
.dl-btn{display:inline-flex;align-items:center;gap:8px;padding:10px 22px;background:#2196F3;border:none;border-radius:10px;color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:background .18s;}
.dl-btn:hover{background:#1976d2;}

/* footer */
.pub-footer{background:linear-gradient(135deg,#0052cc,#091e42);border-radius:16px;padding:20px;text-align:center;}
.footer-logo{font-weight:700;font-size:14px;color:#fff;letter-spacing:1.5px;}
.footer-div{width:36px;height:1px;background:rgba(255,255,255,.2);margin:8px auto;}
.footer-tag{font-size:10px;color:rgba(255,255,255,.45);letter-spacing:1.5px;text-transform:uppercase;}
.footer-copy{font-size:10px;color:rgba(255,255,255,.25);margin-top:8px;}
@keyframes spin{to{transform:rotate(360deg);)}
`;