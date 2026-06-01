import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../Config";
import { collection, query, where, getDocs } from "firebase/firestore";

import {
  Box, Typography, Avatar, Chip, Paper, Grid,
  CircularProgress, Container, Badge, Button, Modal, IconButton,
} from "@mui/material";
import { createTheme, alpha, ThemeProvider } from "@mui/material/styles";

import VerifiedUserIcon  from "@mui/icons-material/VerifiedUser";
import PhoneIcon         from "@mui/icons-material/Phone";
import EmailIcon         from "@mui/icons-material/Email";
import LocationOnIcon    from "@mui/icons-material/LocationOn";
import AccessTimeIcon    from "@mui/icons-material/AccessTime";
import WorkIcon          from "@mui/icons-material/Work";
import BadgeIcon         from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import FavoriteIcon      from "@mui/icons-material/Favorite";
import PersonIcon        from "@mui/icons-material/Person";
import BusinessIcon      from "@mui/icons-material/Business";
import SearchOffIcon     from "@mui/icons-material/SearchOff";
import EngineeringIcon   from "@mui/icons-material/Engineering";
import HomeIcon          from "@mui/icons-material/Home";
import CakeIcon          from "@mui/icons-material/Cake";
import WcIcon            from "@mui/icons-material/Wc";
import CallIcon          from "@mui/icons-material/Call";
import ZoomInIcon        from "@mui/icons-material/ZoomIn";
import CloseIcon         from "@mui/icons-material/Close";
import StarIcon          from "@mui/icons-material/Star";
import ShieldIcon        from "@mui/icons-material/Shield";

import ctechLogo  from "../assets/ctech-logo.png";
import preconLogo from "../assets/precon-logo.jpg";

// ── Injected global styles ────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.92) }       to { opacity:1; transform:scale(1) } }
  @keyframes shimmer  { 0%,100% { opacity:.6 } 50% { opacity:1 } }
  @keyframes rotateDot{ from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
  @keyframes pulse2   { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.06) } }
  @keyframes blink    { 0%,100%{ opacity:1 } 50%{ opacity:.3 } }
  @keyframes slideRight{ from{ transform:scaleX(0) } to{ transform:scaleX(1) } }

  .profile-card   { animation: fadeUp  .55s cubic-bezier(.22,.61,.36,1) both; }
  .stat-card      { animation: scaleIn .45s cubic-bezier(.22,.61,.36,1) both; }
  .info-section   { animation: fadeUp  .5s  cubic-bezier(.22,.61,.36,1) both; }

  .stat-card:nth-child(1){ animation-delay:.05s }
  .stat-card:nth-child(2){ animation-delay:.12s }
  .stat-card:nth-child(3){ animation-delay:.19s }
  .info-section:nth-child(1){ animation-delay:.15s }
  .info-section:nth-child(2){ animation-delay:.22s }
  .info-section:nth-child(3){ animation-delay:.29s }
  .info-section:nth-child(4){ animation-delay:.36s }

  .info-row-hover { transition: background .18s, padding-left .18s; }
  .info-row-hover:hover { background: rgba(0,0,0,.025); padding-left: 6px; border-radius: 8px; }

  .call-btn-glow:hover { box-shadow: 0 0 18px 2px var(--btn-glow); }
`;

// ── Company config ─────────────────────────────────────────────────────────────
const COMPANY_CONFIG = {
  "C-Tech": {
    primary:      "#1A56DB",
    primaryDark:  "#1347C4",
    primaryDeep:  "#0E3AA8",
    accent:       "#38BDF8",
    accentAlt:    "#818CF8",
    heroStart:    "#0E3AA8",
    heroMid:      "#1347C4",
    heroEnd:      "#1A56DB",
    navBg:        "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)",
    verifiedBg:   "linear-gradient(135deg,#F0F9FF,#E0F2FE)",
    verifiedBorder:"#7DD3FC",
    verifiedText:  "#0369A1",
    verifiedSub:   "#38BDF8",
    infoIconBg:    "#EFF6FF",
    infoIconColor: "#1A56DB",
    chipBg:  (a) => a ? "rgba(34,197,94,.15)"   : "rgba(245,158,11,.15)",
    chipBdr: (a) => a ? "rgba(34,197,94,.35)"   : "rgba(245,158,11,.35)",
    chipCol: (a) => a ? "#22c55e"                : "#f59e0b",
    logoImage: ctechLogo,
    companyLabel: "C-Tech Engineering",
  },
  "Precon": {
    primary:      "#E63946",
    primaryDark:  "#C62831",
    primaryDeep:  "#A11E25",
    accent:       "#FF8FA3",
    accentAlt:    "#FFA07A",
    heroStart:    "#A11E25",
    heroMid:      "#C62831",
    heroEnd:      "#E63946",
    navBg:        "linear-gradient(135deg,#fe5958 0%,#c93a39 100%)",
    verifiedBg:   "linear-gradient(135deg,#FFF5F5,#FEF2F2)",
    verifiedBorder:"#FECACA",
    verifiedText:  "#991B1B",
    verifiedSub:   "#F87171",
    infoIconBg:    "#FFF0F0",
    infoIconColor: "#E63946",
    chipBg:  (a) => a ? "rgba(34,197,94,.15)"   : "rgba(245,158,11,.15)",
    chipBdr: (a) => a ? "rgba(34,197,94,.35)"   : "rgba(245,158,11,.35)",
    chipCol: (a) => a ? "#22c55e"                : "#f59e0b",
    logoImage: preconLogo,
    companyLabel: "Precon",
  },
};

function getConfig(company) {
  return COMPANY_CONFIG[company] || COMPANY_CONFIG["C-Tech"];
}

function buildTheme(cfg) {
  return createTheme({
    palette: {
      mode: "light",
      primary:    { main: cfg.primary, dark: cfg.primaryDark },
      background: { default: "#F4F6FB", paper: "#ffffff" },
      text:       { primary: "#0A0F1E", secondary: "#64748B" },
    },
    typography: { fontFamily: "'DM Sans', sans-serif" },
    shape: { borderRadius: 14 },
    components: {
      MuiPaper:  { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 700 } } },
    },
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function calcExperience(joiningDate) {
  if (!joiningDate) return "";
  const start = new Date(joiningDate);
  const now   = new Date();
  if (isNaN(start) || start > now) return "";
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth()    - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return "< 1 mo";
  const p = [];
  if (years  > 0) p.push(`${years}y`);
  if (months > 0) p.push(`${months}m`);
  return p.join(" ");
}

function calcExperienceFull(joiningDate) {
  if (!joiningDate) return "";
  const start = new Date(joiningDate);
  const now   = new Date();
  if (isNaN(start) || start > now) return "";
  let years  = now.getFullYear() - start.getFullYear();
  let months = now.getMonth()    - start.getMonth();
  if (now.getDate() < start.getDate()) months--;
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) return "< 1 month";
  const p = [];
  if (years  > 0) p.push(`${years} year${years > 1 ? "s" : ""}`);
  if (months > 0) p.push(`${months} mo`);
  return p.join(" ");
}

function calculateAge(dob) {
  if (!dob) return "";
  const b = new Date(dob);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() - b.getMonth() < 0 || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

const handlePhoneCall = (phone) => { if (phone) window.location.href = `tel:${phone}`; };

// ══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════
export default function Employeepublicprofile() {
  const { employeeId } = useParams();
  const [emp,    setEmp]    = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!employeeId) { setStatus("notfound"); return; }
        const q    = query(collection(db, "employees"), where("employeeId", "==", employeeId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setEmp({ id: snap.docs[0].id, ...snap.docs[0].data() });
          setStatus("found");
        } else {
          setStatus("notfound");
        }
      } catch (e) {
        console.error(e);
        setStatus("notfound");
      }
    })();
  }, [employeeId]);

  const cfg   = emp ? getConfig(emp.company) : getConfig("C-Tech");
  const theme = buildTheme(cfg);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: "#F0F3FA" }}>
        {status === "loading"  && <LoaderScreen />}
        {status === "notfound" && <NotFoundScreen employeeId={employeeId} />}
        {status === "found" && emp && <ProfilePage emp={emp} cfg={cfg} />}
      </Box>
    </ThemeProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ProfilePage({ emp, cfg }) {
  const experience     = calcExperience(emp.joiningDate);
  const experienceFull = calcExperienceFull(emp.joiningDate);
  const isActive       = emp.status === "Active";
  const [openPhoto, setOpenPhoto] = useState(false);

  return (
    <Box>
      <style>{`
        :root {
          --primary: ${cfg.primary};
          --primary-dark: ${cfg.primaryDark};
          --accent: ${cfg.accent};
          --accent-alt: ${cfg.accentAlt};
          --btn-glow: ${alpha(cfg.primary, 0.45)};
        }
      `}</style>

      {/* ── HERO ── */}
      <Box sx={{
        background: `linear-gradient(160deg, ${cfg.heroStart} 0%, ${cfg.heroMid} 45%, ${cfg.heroEnd} 100%)`,
        position: "relative",
        overflow: "hidden",
        pt: { xs: 5, sm: 6 },
        pb: { xs: 10, sm: 11 },
      }}>
        {/* Decorative geometry */}
        <Box sx={{
          position:"absolute", inset:0, pointerEvents:"none",
          background:`radial-gradient(ellipse 70% 60% at 80% 20%, ${alpha(cfg.accent,.18)} 0%, transparent 70%),
                      radial-gradient(ellipse 50% 40% at 10% 80%, ${alpha(cfg.accentAlt,.12)} 0%, transparent 65%)`,
        }} />
        {[
          { w:260, h:260, top:"-80px",  right:"-60px",  b:"40px solid" },
          { w:160, h:160, bottom:"-50px",left:"-40px",   b:"28px solid" },
          { w:90,  h:90,  top:"30%",    right:"18%",     b:"16px solid" },
        ].map((r,i) => (
          <Box key={i} sx={{
            position:"absolute", width:r.w, height:r.h,
            top:r.top, bottom:r.bottom, right:r.right, left:r.left,
            borderRadius:"50%", border:`${r.b} rgba(255,255,255,.06)`,
            pointerEvents:"none",
          }} />
        ))}

        {/* Corner logo badge */}
        <Box sx={{
          position:"absolute", top:16, right:16,
          background:"rgba(255,255,255,.1)",
          backdropFilter:"blur(12px)",
          borderRadius:"12px",
          border:"1px solid rgba(255,255,255,.18)",
          px:1.5, py:.75,
          display:"flex", alignItems:"center", gap:.75,
        }}>
          <Box sx={{
            width:20, height:20, borderRadius:"50%",
            background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.primary})`,
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <EngineeringIcon sx={{ fontSize:12, color:"#fff" }} />
          </Box>
          <Typography sx={{ fontSize:10.5, fontWeight:700, color:"rgba(255,255,255,.85)", fontFamily:"'Syne',sans-serif", letterSpacing:".5px" }}>
            {cfg.companyLabel}
          </Typography>
        </Box>

        {/* Avatar + identity */}
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", px:2, position:"relative", zIndex:2 }} className="profile-card">

            {/* Avatar ring */}
            <Box sx={{ position:"relative", mb:2.5 }}>
              <Box sx={{
                position:"absolute", inset:-5,
                borderRadius:"50%",
                background: `conic-gradient(${cfg.accent} 0deg, ${cfg.primary} 120deg, ${cfg.accentAlt} 240deg, ${cfg.accent} 360deg)`,
                animation:"rotateDot 6s linear infinite",
                opacity:.7,
              }} />
              <Box sx={{
                position:"absolute", inset:-3,
                borderRadius:"50%",
                background:"white",
                opacity:.12,
              }} />
              <Avatar
                src={emp.photoURL}
                onClick={() => setOpenPhoto(true)}
                sx={{
                  width:100, height:100,
                  border:"3px solid rgba(255,255,255,.35)",
                  background:`linear-gradient(135deg,${cfg.primaryDeep},${cfg.primaryDark})`,
                  fontSize:38, fontWeight:800, color:"#fff",
                  cursor:"pointer",
                  position:"relative", zIndex:1,
                  boxShadow:`0 12px 40px rgba(0,0,0,.35), 0 0 0 2px rgba(255,255,255,.15)`,
                  transition:"transform .25s",
                  "&:hover":{ transform:"scale(1.04)" },
                }}
              >
                {!emp.photoURL && (emp.fullName||"?")[0].toUpperCase()}
              </Avatar>
              <IconButton
                onClick={() => setOpenPhoto(true)}
                sx={{
                  position:"absolute", bottom:-2, right:-2,
                  width:28, height:28, zIndex:2,
                  bgcolor: cfg.accent,
                  border:"2px solid rgba(255,255,255,.3)",
                  "&:hover":{ bgcolor:cfg.primary },
                  p:.5,
                }}
              >
                <ZoomInIcon sx={{ fontSize:14, color:"#fff" }} />
              </IconButton>
            </Box>

            {/* Name */}
            <Typography sx={{
              fontFamily:"'Syne',sans-serif",
              fontSize:{ xs:24, sm:28 },
              fontWeight:800,
              color:"#fff",
              letterSpacing:"-0.5px",
              lineHeight:1.15,
              mb:.5,
              textShadow:"0 2px 16px rgba(0,0,0,.25)",
            }}>
              {emp.fullName}
            </Typography>

            <Typography sx={{ fontSize:13, color:"rgba(255,255,255,.65)", mb:2.5, fontWeight:500, letterSpacing:".2px" }}>
              {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
            </Typography>

            {/* Status chips row */}
            <Box sx={{ display:"flex", flexWrap:"wrap", gap:1, justifyContent:"center" }}>
              <Chip
                icon={<Box sx={{
                  width:7, height:7, borderRadius:"50%",
                  background: isActive ? "#4ade80" : "#fbbf24",
                  ml:"4px !important",
                  animation:"blink 1.5s infinite",
                }} />}
                label={emp.status || "Active"}
                size="small"
                sx={{
                  background: cfg.chipBg(isActive),
                  border:`1px solid ${cfg.chipBdr(isActive)}`,
                  color: cfg.chipCol(isActive),
                  fontWeight:700, fontSize:11.5,
                  backdropFilter:"blur(8px)",
                }}
              />
              {emp.employeeId && (
                <Chip
                  label={`# ${emp.employeeId}`}
                  size="small"
                  icon={<BadgeIcon style={{ fontSize:12, color:"rgba(255,255,255,.7)" }} />}
                  sx={{
                    background:"rgba(255,255,255,.1)",
                    border:"1px solid rgba(255,255,255,.22)",
                    color:"rgba(255,255,255,.88)",
                    fontWeight:700, fontSize:11,
                    fontFamily:"monospace",
                    backdropFilter:"blur(8px)",
                  }}
                />
              )}
              {emp.location && (
                <Chip
                  icon={<LocationOnIcon style={{ fontSize:12, color:"rgba(255,255,255,.65)" }} />}
                  label={emp.location}
                  size="small"
                  sx={{
                    background:"rgba(255,255,255,.1)",
                    border:"1px solid rgba(255,255,255,.18)",
                    color:"rgba(255,255,255,.75)",
                    fontWeight:600, fontSize:11,
                    backdropFilter:"blur(8px)",
                  }}
                />
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ── BODY ── */}
      <Container maxWidth="sm" disableGutters sx={{ px:{ xs:1.5, sm:2 }, pb:6 }}>

        {/* Pull-up card offset */}
        <Box sx={{ mt:"-36px", position:"relative", zIndex:10 }}>

          {/* ── Verified + Quick stats combined card ── */}
          <Paper elevation={0} sx={{
            borderRadius:"20px",
            border:"1px solid rgba(255,255,255,.9)",
            background:"#fff",
            overflow:"hidden",
            mb:2,
            boxShadow:"0 8px 40px rgba(0,0,0,.08), 0 1px 0 rgba(255,255,255,.9)",
          }} className="profile-card">

            {/* Verified strip */}
            <Box sx={{
              px:2.5, py:1.5,
              background: cfg.verifiedBg,
              borderBottom:`1px solid ${alpha(cfg.verifiedBorder,.5)}`,
              display:"flex", alignItems:"center", gap:1.5,
            }}>
              <Box sx={{
                width:38, height:38, borderRadius:"10px",
                background:`linear-gradient(135deg,${cfg.primary},${cfg.primaryDark})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:`0 4px 14px ${alpha(cfg.primary,.35)}`,
                flexShrink:0,
              }}>
                <ShieldIcon sx={{ fontSize:18, color:"#fff" }} />
              </Box>
              <Box sx={{ flex:1 }}>
                <Typography sx={{ fontSize:13, fontWeight:800, color:cfg.verifiedText, fontFamily:"'Syne',sans-serif" }}>
                  Identity Verified
                </Typography>
                <Typography sx={{ fontSize:11, color:cfg.verifiedSub, mt:.15 }}>
                  Authenticated by {cfg.companyLabel}
                </Typography>
              </Box>
              <Box sx={{
                px:1.25, py:.5, borderRadius:"20px",
                background:alpha(cfg.primary,.12),
                border:`1px solid ${cfg.verifiedBorder}`,
                display:"flex", alignItems:"center", gap:.5,
              }}>
                <Box sx={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", animation:"blink 1.5s infinite" }} />
                <Typography sx={{ fontSize:10, fontWeight:800, color:cfg.verifiedText }}>LIVE</Typography>
              </Box>
            </Box>

            {/* Quick stats */}
            <Box sx={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:0 }}>
              {[
                { val: experience || "—", label:"Experience", color:cfg.primary,   bg:alpha(cfg.primary,.06) },
                { val: emp.bloodGroup||"—", label:"Blood",      color:"#E63946",     bg:"#FFF5F5" },
                { val: emp.status||"Active",label:"Status",     color: isActive?"#16a34a":"#d97706", bg: isActive?alpha("#16a34a",.06):alpha("#d97706",.06) },
              ].map((s,i) => (
                <Box key={i} className="stat-card" sx={{
                  background:s.bg,
                  borderRight: i < 2 ? `1px solid rgba(0,0,0,.05)` : "none",
                  py:2, px:1.5,
                  display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  textAlign:"center",
                  transition:"background .2s",
                  "&:hover":{ background: alpha(s.color,.1) },
                  cursor:"default",
                }}>
                  <Typography sx={{ fontSize:{ xs:17, sm:20 }, fontWeight:800, color:s.color, fontFamily:"'Syne',sans-serif", lineHeight:1.1 }}>
                    {s.val}
                  </Typography>
                  <Typography sx={{ fontSize:9.5, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1px", mt:.5 }}>
                    {s.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* ── Section: Personal Information ── */}
          {(emp.dob || emp.gender || emp.residencyAddress) && (
            <SectionCard title="Personal" icon={<PersonIcon />} cfg={cfg} className="info-section">
              {emp.dob && (
                <InfoRow icon={<CakeIcon />} label="Date of Birth" cfg={cfg}
                  value={new Date(emp.dob).toLocaleDateString("en-IN",{ day:"numeric", month:"long", year:"numeric" })} />
              )}
              {emp.dob && (
                <InfoRow icon={<AccessTimeIcon />} label="Age" cfg={cfg} value={`${calculateAge(emp.dob)} years`} />
              )}
              {emp.gender && (
                <InfoRow icon={<WcIcon />} label="Gender" cfg={cfg} value={emp.gender} />
              )}
              {emp.residencyAddress && (
                <InfoRow icon={<HomeIcon />} label="Residency" cfg={cfg} value={emp.residencyAddress} />
              )}
            </SectionCard>
          )}

          {/* ── Section: Contact ── */}
          <SectionCard title="Contact" icon={<PhoneIcon />} cfg={cfg} className="info-section">
            {emp.contactNumber && (
              <CallRow phone={emp.contactNumber} label="Mobile" cfg={cfg} />
            )}
            <InfoRow icon={<EmailIcon />}     label="Work Email" value={emp.email}      cfg={cfg} />
            <InfoRow icon={<LocationOnIcon />} label="Location"  value={emp.location}   cfg={cfg} />
            <InfoRow icon={<AccessTimeIcon />} label="Work Shift" value={emp.workShift} cfg={cfg} />
          </SectionCard>

          {/* ── Section: Employment ── */}
          <SectionCard title="Employment" icon={<WorkIcon />} cfg={cfg} className="info-section">
            <InfoRow icon={<WorkIcon />}          label="Department"   value={emp.department}  cfg={cfg} />
            <InfoRow icon={<BadgeIcon />}          label="Designation"  value={emp.designation} cfg={cfg} />
            <InfoRow icon={<CalendarTodayIcon />}  label="Date of Joining" cfg={cfg}
              value={emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("en-IN",{ day:"numeric", month:"long", year:"numeric" }) : ""} />
            <InfoRow icon={<AccessTimeIcon />}     label="Work Experience" value={experienceFull} cfg={cfg} />
          </SectionCard>

          {/* ── Section: Medical & Emergency ── */}
          {(emp.bloodGroup || emp.emergencyContact || emp.emergencyPhone) && (
            <SectionCard title="Medical & Emergency" icon={<FavoriteIcon />} cfg={cfg} emergency className="info-section">
              <InfoRow icon={<FavoriteIcon />} label="Blood Group"       value={emp.bloodGroup}       cfg={cfg} emergency />
              <InfoRow icon={<PersonIcon />}   label="Emergency Contact" value={emp.emergencyContact} cfg={cfg} emergency />
              {emp.emergencyPhone && (
                <CallRow phone={emp.emergencyPhone} label="Emergency Phone" cfg={cfg} emergency />
              )}
            </SectionCard>
          )}

          {/* ── Footer ── */}
          <Box sx={{
            mt:1, py:2.5, px:2,
            borderRadius:"14px",
            border:"1px solid #E2E8F0",
            background:"#fff",
            display:"flex", flexDirection:"column", alignItems:"center", gap:.5,
          }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:.75, mb:.25 }}>
              <Box sx={{
                width:20, height:20, borderRadius:"50%",
                background:`linear-gradient(135deg,${cfg.primary},${cfg.primaryDark})`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <StarIcon sx={{ fontSize:11, color:"#fff" }} />
              </Box>
              <Typography sx={{ fontSize:12, fontWeight:700, color:cfg.primary, fontFamily:"'Syne',sans-serif" }}>
                {cfg.companyLabel}
              </Typography>
            </Box>
            <Typography sx={{ fontSize:11, color:"#94a3b8", fontWeight:500 }}>
              © {new Date().getFullYear()} {cfg.companyLabel}. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Container>

      {/* ── Photo Modal ── */}
      <Modal open={openPhoto} onClose={() => setOpenPhoto(false)}>
        <Box sx={{
          position:"absolute", top:"50%", left:"50%",
          transform:"translate(-50%,-50%)",
          maxWidth:"90vw", maxHeight:"90vh",
          bgcolor:"#0A0F1E",
          borderRadius:"20px",
          overflow:"hidden",
          outline:"none",
          boxShadow:"0 40px 80px rgba(0,0,0,.6)",
        }}>
          <IconButton
            onClick={() => setOpenPhoto(false)}
            sx={{
              position:"absolute", top:10, right:10, zIndex:10,
              bgcolor:"rgba(255,255,255,.1)",
              backdropFilter:"blur(8px)",
              color:"#fff",
              "&:hover":{ bgcolor:"rgba(255,255,255,.2)" },
            }}
          >
            <CloseIcon />
          </IconButton>
          {emp.photoURL ? (
            <img src={emp.photoURL} alt={emp.fullName}
              style={{ display:"block", width:"100%", maxHeight:"90vh", objectFit:"contain" }} />
          ) : (
            <Box sx={{
              width:380, height:380,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:`linear-gradient(135deg,${cfg.heroStart},${cfg.heroEnd})`,
            }}>
              <Typography sx={{ fontSize:130, color:"rgba(255,255,255,.9)", fontWeight:800, fontFamily:"'Syne',sans-serif" }}>
                {(emp.fullName||"?")[0].toUpperCase()}
              </Typography>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, cfg, children, emergency, className }) {
  const accent = emergency ? "#E63946" : cfg.primary;
  return (
    <Paper elevation={0} className={className} sx={{
      borderRadius:"18px",
      border:`1px solid ${emergency ? "#FECACA" : "#E9EEF5"}`,
      background: emergency ? "#FFF8F8" : "#fff",
      overflow:"hidden",
      mb:2,
      boxShadow:"0 2px 16px rgba(0,0,0,.04)",
    }}>
      {/* Header */}
      <Box sx={{
        px:2.25, py:1.4,
        background: emergency
          ? "linear-gradient(135deg,#FFF0F0,#FFF5F5)"
          : `linear-gradient(135deg,${alpha(cfg.primary,.06)},${alpha(cfg.primary,.02)})`,
        borderBottom:`1px solid ${emergency ? "#FEE2E2" : "#F1F5F9"}`,
        display:"flex", alignItems:"center", gap:1.25,
      }}>
        <Box sx={{
          width:32, height:32, borderRadius:"9px",
          background:`linear-gradient(135deg,${accent},${emergency ? "#C62831" : cfg.primaryDark})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 3px 10px ${alpha(accent,.3)}`,
        }}>
          {React.cloneElement(icon, { sx:{ fontSize:16, color:"#fff" } })}
        </Box>
        <Typography sx={{
          fontSize:11, fontWeight:800,
          color: emergency ? "#991B1B" : cfg.primaryDeep,
          textTransform:"uppercase",
          letterSpacing:"1.5px",
          fontFamily:"'Syne',sans-serif",
        }}>
          {title}
        </Typography>

        {/* Decorative line */}
        <Box sx={{ flex:1, height:"1px", background:`linear-gradient(90deg,${alpha(accent,.2)},transparent)`, ml:.5 }} />
      </Box>

      <Box sx={{ px:2.25, py:.5 }}>{children}</Box>
    </Paper>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, cfg, emergency }) {
  if (!value) return null;
  const iconBg    = emergency ? "#FFF0F0" : (cfg?.infoIconBg    || "#EFF6FF");
  const iconColor = emergency ? "#E63946" : (cfg?.infoIconColor || "#1A56DB");
  return (
    <Box className="info-row-hover" sx={{
      display:"flex", alignItems:"center", gap:1.5,
      py:1.4,
      borderBottom:`1px solid ${emergency ? "#FFF0F0" : "#F7F9FC"}`,
      "&:last-child":{ borderBottom:"none" },
    }}>
      <Box sx={{
        width:36, height:36, borderRadius:"10px",
        background:iconBg,
        display:"flex", alignItems:"center", justifyContent:"center",
        flexShrink:0,
      }}>
        {React.cloneElement(icon, { sx:{ fontSize:16, color:iconColor } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize:9.5, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1px", lineHeight:1, mb:.45 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize:13.5, color:"#0A0F1E", fontWeight:500, lineHeight:1.3, fontFamily:"'DM Sans',sans-serif" }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

// ── Call Row ──────────────────────────────────────────────────────────────────
function CallRow({ phone, label, cfg, emergency }) {
  const accent = emergency ? "#E63946" : cfg.primary;
  const iconBg = emergency ? "#FFF0F0" : cfg.infoIconBg;
  return (
    <Box className="info-row-hover" sx={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      py:1.4,
      borderBottom:`1px solid ${emergency ? "#FFF0F0" : "#F7F9FC"}`,
      "&:last-child":{ borderBottom:"none" },
    }}>
      <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
        <Box sx={{
          width:36, height:36, borderRadius:"10px",
          background:iconBg,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
        }}>
          <PhoneIcon sx={{ fontSize:16, color:accent }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize:9.5, fontWeight:800, color:"#94a3b8", textTransform:"uppercase", letterSpacing:"1px", lineHeight:1, mb:.45 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize:13.5, color:"#0A0F1E", fontWeight:500, lineHeight:1.3 }}>
            {phone}
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained"
        size="small"
        startIcon={<CallIcon sx={{ fontSize:"14px !important" }} />}
        onClick={() => handlePhoneCall(phone)}
        className="call-btn-glow"
        sx={{
          background:`linear-gradient(135deg,${accent},${emergency ? "#C62831" : cfg.primaryDark})`,
          "&:hover":{ background:`linear-gradient(135deg,${emergency ? "#C62831" : cfg.primaryDark},${accent})` },
          fontSize:12,
          px:2, py:.75,
          borderRadius:"20px",
          boxShadow:`0 4px 14px ${alpha(accent,.35)}`,
          transition:"all .2s",
          minWidth:"80px",
        }}
      >
        Call
      </Button>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOADER
// ══════════════════════════════════════════════════════════════════════════════
function LoaderScreen() {
  return (
    <Box sx={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3, px:3 }}>
      <Box sx={{
        width:80, height:80, borderRadius:"22px",
        background:"linear-gradient(135deg,#1A56DB,#0E3AA8)",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 12px 36px rgba(26,86,219,.4)",
        animation:"pulse2 2.2s ease-in-out infinite",
      }}>
        <EngineeringIcon sx={{ color:"#fff", fontSize:38 }} />
      </Box>
      <CircularProgress size={28} thickness={4} sx={{ color:"#1A56DB" }} />
      <Box sx={{ textAlign:"center" }}>
        <Typography sx={{ fontSize:17, fontWeight:800, color:"#0A0F1E", mb:.5, fontFamily:"'Syne',sans-serif" }}>
          Loading Profile
        </Typography>
        <Typography sx={{ fontSize:13, color:"#94a3b8" }}>Please wait a moment…</Typography>
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOT FOUND
// ══════════════════════════════════════════════════════════════════════════════
function NotFoundScreen({ employeeId }) {
  return (
    <Box sx={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", px:3, textAlign:"center" }}>
      <Box sx={{
        width:88, height:88, borderRadius:"24px",
        background:"linear-gradient(135deg,#FEF2F2,#FEE2E2)",
        border:"1px solid #FECACA",
        display:"flex", alignItems:"center", justifyContent:"center",
        mb:3,
        boxShadow:"0 10px 30px rgba(220,38,38,.12)",
        animation:"pulse2 2s ease-in-out infinite",
      }}>
        <SearchOffIcon sx={{ fontSize:40, color:"#E63946" }} />
      </Box>
      <Typography sx={{ fontSize:22, fontWeight:800, color:"#0A0F1E", mb:1, fontFamily:"'Syne',sans-serif" }}>
        Employee Not Found
      </Typography>
      <Typography sx={{ fontSize:13.5, color:"#64748b", lineHeight:1.8, maxWidth:320 }}>
        No record exists for ID{" "}
        <Box component="span" sx={{ fontWeight:700, color:"#0A0F1E", fontFamily:"monospace", background:"#F1F5F9", px:.85, py:.3, borderRadius:1 }}>
          {employeeId}
        </Box>.{" "}Verify the QR code or contact HR.
      </Typography>
      <Box sx={{
        mt:3.5, px:2.5, py:1.5, borderRadius:3,
        border:"1px solid #E2E8F0",
        background:"#fff",
        display:"inline-flex", alignItems:"center", gap:1,
        boxShadow:"0 2px 12px rgba(0,0,0,.06)",
      }}>
        <BusinessIcon sx={{ fontSize:16, color:"#1A56DB" }} />
        <Typography sx={{ fontSize:12.5, fontWeight:600, color:"#475569" }}>HR Department</Typography>
      </Box>
    </Box>
  );
}