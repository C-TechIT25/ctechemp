import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../Config";
import { collection, query, where, getDocs } from "firebase/firestore";

// MUI Core
import {
  Box, Typography, Avatar, Chip, Paper, Grid,
  CircularProgress, Container, Badge, Button,
} from "@mui/material";
import { createTheme, alpha ,ThemeProvider} from "@mui/material/styles";

// MUI Icons
import VerifiedUserIcon   from "@mui/icons-material/VerifiedUser";
import PhoneIcon          from "@mui/icons-material/Phone";
import EmailIcon          from "@mui/icons-material/Email";
import LocationOnIcon     from "@mui/icons-material/LocationOn";
import AccessTimeIcon     from "@mui/icons-material/AccessTime";
import WorkIcon           from "@mui/icons-material/Work";
import BadgeIcon          from "@mui/icons-material/Badge";
import CalendarTodayIcon  from "@mui/icons-material/CalendarToday";
import FavoriteIcon       from "@mui/icons-material/Favorite";
import PersonIcon         from "@mui/icons-material/Person";
import NoteAltIcon        from "@mui/icons-material/NoteAlt";
import BusinessIcon       from "@mui/icons-material/Business";
import SearchOffIcon      from "@mui/icons-material/SearchOff";
import EngineeringIcon    from "@mui/icons-material/Engineering";
import HomeIcon           from "@mui/icons-material/Home";
import CakeIcon           from "@mui/icons-material/Cake";
import WcIcon             from "@mui/icons-material/Wc";
import CallIcon           from "@mui/icons-material/Call";

// Import logos from assets folder
import ctechLogo from "../assets/ctech-logo.png"; // Adjust path as needed
import preconLogo from "../assets/precon-logo.jpg"; // Adjust path as needed

// ── Company Config ─────────────────────────────────────────────────────────────
const COMPANY_CONFIG = {
  "C-Tech": {
    primary:     "#1565C0",
    primaryDark: "#0D47A1",
    primaryDeep: "#0052CC",
    heroStart:   "#0052CC",
    heroMid:     "#0A3A7A",
    heroEnd:     "#091E42",
    navBg:       "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)",
    footerBg:    "linear-gradient(145deg,#0052CC 0%,#091E42 100%)",
    verifiedBg:  "linear-gradient(135deg,#F0FDF4,#ECFDF5)",
    verifiedBorder: "#86EFAC",
    verifiedText:   "#166534",
    verifiedSub:    "#4ade80",
    infoIconBg:     "#EFF6FF",
    infoIconColor:  "#1565C0",
    chipBg: (active) => active ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)",
    logoType: "ctech",
    logoImage: ctechLogo,
  },
  "Precon": {
    primary:     "#fe5958",
    primaryDark: "#e04847",
    primaryDeep: "#c93a39",
    heroStart:   "#fe5958",
    heroMid:     "#b83534",
    heroEnd:     "#7a1f1f",
    navBg:       "linear-gradient(135deg,#fe5958 0%,#c93a39 100%)",
    footerBg:    "linear-gradient(145deg,#fe5958 0%,#7a1f1f 100%)",
    verifiedBg:  "linear-gradient(135deg,#FFF5F5,#FEF2F2)",
    verifiedBorder: "#FECACA",
    verifiedText:   "#991b1b",
    verifiedSub:    "#f87171",
    infoIconBg:     "#FFF0F0",
    infoIconColor:  "#fe5958",
    chipBg: (active) => active ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)",
    logoType: "precon",
    logoImage: preconLogo,
  },
};

function getConfig(company) {
  return COMPANY_CONFIG[company] || COMPANY_CONFIG["C-Tech"];
}

// ── Theme factory ──────────────────────────────────────────────────────────────
function buildTheme(cfg) {
  return createTheme({
    palette: {
      mode: "light",
      primary:    { main: cfg.primary, light: cfg.primary, dark: cfg.primaryDark },
      success:    { main: "#16a34a" },
      error:      { main: "#dc2626" },
      warning:    { main: "#d97706" },
      background: { default: "#EEF2F7", paper: "#ffffff" },
      text:       { primary: "#0F172A", secondary: "#64748b" },
    },
    typography: { fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif" },
    shape: { borderRadius: 12 },
    components: {
      MuiPaper:  { styleOverrides: { root: { backgroundImage: "none" } } },
      MuiChip:   { styleOverrides: { root: { fontWeight: 600 } } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600, borderRadius: 10 } } },
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
  const days = now.getDate()     - start.getDate();
  if (days   < 0) months  -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years === 0 && months === 0) return "< 1 month";
  const p = [];
  if (years  > 0) p.push(`${years} yr${years > 1 ? "s" : ""}`);
  if (months > 0) p.push(`${months} mo`);
  return p.join(" ");
}

function calculateAge(dob) {
  if (!dob) return "";
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Handle phone call redirection
const handlePhoneCall = (phoneNumber) => {
  if (phoneNumber) {
    window.location.href = `tel:${phoneNumber}`;
  }
};

// ── Full Width Company Logo ────────────────────────────────────────────
function FullWidthCompanyLogo({ logoImage, alt = "Company Logo" }) {
  return (
    <Box sx={{
      width: "100%",
      backgroundColor: "#fff",
      py: 2,
      px: 2,
      // borderBottom: "1px solid #E2E8F0",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
     <img 
  src={logoImage} 
  alt={alt}
  style={{
    width: window.innerWidth <= 768 ? "100%" : "40%",
    height: "auto",
    objectFit: "contain",
  }}
/>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════
export default function Employeepublicprofile() {
  const { employeeId } = useParams();
  const [emp,    setEmp]    = useState(null);
  const [status, setStatus] = useState("loading");

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

  const cfg = emp ? getConfig(emp.company) : getConfig("C-Tech");
  const theme = buildTheme(cfg);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: "white" }}>
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
  const experience = calcExperience(emp.joiningDate);
  const isActive   = emp.status === "Active";

  return (
    <Box>
      {/* ── Full Width Company Logo Only ── */}
      <FullWidthCompanyLogo logoImage={cfg.logoImage} alt={`${emp.company} Logo`} />

      <Container maxWidth="sm" disableGutters sx={{ pb: 5 }}>

        {/* ── Hero Banner ── */}
        <Box sx={{
          background: `linear-gradient(145deg,${cfg.heroStart} 0%,${cfg.heroMid} 58%,${cfg.heroEnd} 100%)`,
          position: "relative", overflow: "hidden",
          pt: 5, pb: 7, px: 2,
        }}>
          <Box sx={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", border: "45px solid rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", border: "30px solid rgba(255,255,255,0.04)" }} />
          <Box sx={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 70% 40%,${alpha(cfg.primary, 0.22)} 0%,transparent 65%)` }} />

          <Box sx={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <Box sx={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: isActive ? "#22c55e" : "#f59e0b",
                  border: `2.5px solid ${cfg.heroEnd}`,
                  boxShadow: `0 0 10px ${isActive ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}`,
                }} />
              }>
              <Avatar src={emp.photoURL}
                sx={{
                  width: 96, height: 96,
                  border: "3px solid rgba(255,255,255,0.3)",
                  background: `linear-gradient(135deg,${cfg.primaryDark},${cfg.primaryDeep})`,
                  fontSize: 34, fontWeight: 800, color: "#fff",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                {!emp.photoURL && (emp.fullName || "?")[0].toUpperCase()}
              </Avatar>
            </Badge>

            <Typography sx={{ fontSize: { xs: 22, sm: 26 }, fontWeight: 800, color: "#fff", mt: 2, mb: 0.5, letterSpacing: "-0.5px" }}>
              {emp.fullName}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "rgba(255,255,255,0.6)", mb: 2 }}>
              {emp.designation}{emp.department ? ` · ${emp.department}` : ""}
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
              <Chip
                icon={<Box sx={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: isActive ? "#4ade80" : "#fbbf24",
                  ml: "4px !important",
                  animation: "blink 1.5s infinite",
                  "@keyframes blink": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
                }} />}
                label={emp.status || "Active"}
                size="small"
                sx={{
                  background: cfg.chipBg(isActive),
                  border: `0.5px solid ${isActive ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"}`,
                  color: isActive ? "#4ade80" : "#fbbf24",
                  fontWeight: 700, fontSize: 11.5,
                }}
              />
              {emp.employeeId && (
                <Chip label={emp.employeeId} size="small"
                  sx={{ background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: 11.5, fontFamily: "monospace" }} />
              )}
              {emp.location && (
                <Chip icon={<LocationOnIcon style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }} />}
                  label={emp.location} size="small"
                  sx={{ background: "rgba(255,255,255,0.1)", border: "0.5px solid rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.75)", fontWeight: 600, fontSize: 11.5 }} />
              )}
            </Box>
          </Box>
        </Box>

        {/* ── Content Area ── */}
        <Box sx={{ px: { xs: 1.5, sm: 2 }, mt: "-28px", position: "relative", zIndex: 10 }}>

          {/* Verified Strip */}
          <Paper elevation={0} sx={{
            p: "14px 18px", borderRadius: 3,
            border: `1px solid ${cfg.verifiedBorder}`,
            background: cfg.verifiedBg,
            display: "flex", alignItems: "center", gap: 1.5, mb: 2,
          }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: "50%",
              background: alpha(cfg.primary, 0.12),
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${alpha(cfg.primary, 0.18)}`,
            }}>
              <VerifiedUserIcon sx={{ color: cfg.verifiedText, fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: cfg.verifiedText }}>Identity Verified</Typography>
              <Typography sx={{ fontSize: 11.5, color: cfg.verifiedSub, mt: 0.2 }}>
                Officially authenticated by {emp.company === "Precon" ? "Precon" : "C-Tech Engineering"}
              </Typography>
            </Box>
            <Chip label="Live" size="small" sx={{ background: alpha(cfg.primary, 0.1), color: cfg.verifiedText, fontWeight: 800, fontSize: 11, border: `1px solid ${cfg.verifiedBorder}` }} />
          </Paper>

          {/* Quick Stats */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {[
              { label: "Experience", value: experience || "—",       color: cfg.primary,                          bg: alpha(cfg.primary, 0.08) },
              { label: "Blood Group", value: emp.bloodGroup || "—",  color: "#dc2626",                            bg: alpha("#dc2626", 0.08) },
              { label: "Status",      value: emp.status || "Active", color: isActive ? "#16a34a" : "#d97706",     bg: isActive ? alpha("#16a34a", 0.08) : alpha("#d97706", 0.08) },
            ].map((s) => (
              <Grid item xs={4} key={s.label} width={'100%'}>
                <Paper elevation={0} sx={{
                  borderRadius: "10px",
                  background: s.bg,
                  p: { xs: 2, sm: 2.5 },
                  height: "100%",
                  minHeight: { xs: 80, sm: 90 },
                  width:'100%',
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  transition: "transform .2s, box-shadow .2s",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 20px ${alpha(s.color, 0.12)}` },
                }}>
                  <Typography sx={{
                    fontSize: { xs: 18, sm: 22 },
                    fontWeight: 800,
                    color: s.color,
                    lineHeight: 1.2,
                    mb: 0.5
                  }}>
                    {s.value}
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: 10, sm: 11 },
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    {s.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Personal Information */}
          {(emp.dob || emp.gender || emp.residencyAddress) && (
            <InfoCard title="Personal Information" icon={<PersonIcon />} iconColor={cfg.primary} cfg={cfg}>
              {emp.dob && (
                <InfoRow icon={<CakeIcon />} label="Date of Birth" cfg={cfg}
                  value={new Date(emp.dob).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
              )}
              {emp.dob && (
                <InfoRow icon={<AccessTimeIcon />} label="Age" cfg={cfg} value={`${calculateAge(emp.dob)} years`} />
              )}
              {emp.gender && (
                <InfoRow icon={<WcIcon />} label="Gender" cfg={cfg} value={emp.gender} />
              )}
              {emp.residencyAddress && (
                <InfoRow icon={<HomeIcon />} label="Residency Address" cfg={cfg} value={emp.residencyAddress} />
              )}
            </InfoCard>
          )}

          {/* Contact Information - with call button */}
          <InfoCard title="Contact Information" icon={<PhoneIcon />} iconColor={cfg.primary} cfg={cfg}>
            {/* Mobile number with call action */}
            {emp.contactNumber && (
              <Box sx={{
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                py: 1.4, 
                borderBottom: "1px solid #F8FAFC",
                "&:last-child": { borderBottom: "none" },
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: cfg.infoIconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: cfg.infoIconColor }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1, mb: 0.4 }}>
                      Mobile
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500, lineHeight: 1.3 }}>
                      {emp.contactNumber}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<CallIcon />}
                  onClick={() => handlePhoneCall(emp.contactNumber)}
                  sx={{
                    bgcolor: cfg.primary,
                    '&:hover': { bgcolor: cfg.primaryDark },
                    textTransform: "none",
                    fontSize: "12px",
                    px: 2,
                    py: 0.75,
                    borderRadius: "20px",
                  }}
                >
                  Call
                </Button>
              </Box>
            )}
            <InfoRow icon={<EmailIcon />} label="Work Email" value={emp.email} cfg={cfg} />
            <InfoRow icon={<LocationOnIcon />} label="Location" value={emp.location} cfg={cfg} />
            <InfoRow icon={<AccessTimeIcon />} label="Work Shift" value={emp.workShift} cfg={cfg} />
          </InfoCard>

          {/* Employment Details */}
          <InfoCard title="Employment Details" icon={<WorkIcon />} iconColor={cfg.primary} cfg={cfg}>
            <InfoRow icon={<WorkIcon />} label="Department" value={emp.department} cfg={cfg} />
            <InfoRow icon={<BadgeIcon />} label="Designation" value={emp.designation} cfg={cfg} />
            <InfoRow
              icon={<CalendarTodayIcon />}
              label="Date of Joining"
              cfg={cfg}
              value={emp.joiningDate
                ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            />
            <InfoRow icon={<AccessTimeIcon />} label="Work Experience" value={experience} cfg={cfg} />
          </InfoCard>

          {/* Medical & Emergency */}
          {(emp.bloodGroup || emp.emergencyContact || emp.emergencyPhone) && (
            <InfoCard title="Medical & Emergency" icon={<FavoriteIcon />} iconColor="#dc2626" cfg={cfg} emergency>
              <InfoRow icon={<FavoriteIcon />} label="Blood Group" value={emp.bloodGroup} cfg={cfg} />
              <InfoRow icon={<PersonIcon />} label="Emergency Contact" value={emp.emergencyContact} cfg={cfg} />
              {/* Emergency phone with call action */}
              {emp.emergencyPhone && (
                <Box sx={{
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between",
                  py: 1.4, 
                  borderBottom: "1px solid #FEF2F2",
                  "&:last-child": { borderBottom: "none" },
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "#FFF0F0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PhoneIcon sx={{ fontSize: 16, color: "#dc2626" }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1, mb: 0.4 }}>
                        Emergency Phone
                      </Typography>
                      <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500, lineHeight: 1.3 }}>
                        {emp.emergencyPhone}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CallIcon />}
                    onClick={() => handlePhoneCall(emp.emergencyPhone)}
                    sx={{
                      bgcolor: "#dc2626",
                      '&:hover': { bgcolor: "#b91c1c" },
                      textTransform: "none",
                      fontSize: "12px",
                      px: 2,
                      py: 0.75,
                      borderRadius: "20px",
                    }}
                  >
                    Call
                  </Button>
                </Box>
              )}
            </InfoCard>
          )}

          {/* Footer — copyright only */}
          <Box sx={{
            borderRadius: 1,
            border: "1px solid #E2E8F0",
            background: "#fff",
            py: 2,
            textAlign: "center",
            mt: 1,
          }}>
            <Typography sx={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 500 }}>
              © {new Date().getFullYear()} {emp.company === "Precon" ? "Precon" : "C-Tech Engineering Co."}. All rights reserved.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// ── Info Card ──────────────────────────────────────────────────────────────────
function InfoCard({ title, icon, iconColor, children, emergency, cfg }) {
  return (
    <Paper elevation={0} sx={{
      borderRadius: 3,
      border: `1px solid ${emergency ? "#FECACA" : "#E2E8F0"}`,
      background: emergency ? "#FFF5F5" : "#fff",
      overflow: "hidden", mb: 2,
    }}>
      <Box sx={{
        px: 2.25, py: 1.5,
        borderBottom: `1px solid ${emergency ? "#FEE2E2" : "#F1F5F9"}`,
        display: "flex", alignItems: "center", gap: 1.25,
        background: emergency ? "#FFF0F0" : "#FAFBFC",
      }}>
        <Box sx={{ width: 30, height: 30, borderRadius: "8px", background: alpha(iconColor, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
          {React.cloneElement(icon, { sx: { fontSize: 16, color: iconColor } })}
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: emergency ? "#b91c1c" : "#64748b", textTransform: "uppercase", letterSpacing: "1.2px" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ px: 2.25, pb: 0.5, pt: 0.5 }}>{children}</Box>
    </Paper>
  );
}

// ── Info Row ───────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, cfg }) {
  if (!value) return null;
  const iconBg    = cfg?.infoIconBg    || "#EFF6FF";
  const iconColor = cfg?.infoIconColor || "#1565C0";
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5,
      py: 1.4, borderBottom: "1px solid #F8FAFC",
      "&:last-child": { borderBottom: "none" },
    }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { fontSize: 16, color: iconColor } })}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", lineHeight: 1, mb: 0.4 }}>{label}</Typography>
        <Typography sx={{ fontSize: 13.5, color: "#0F172A", fontWeight: 500, lineHeight: 1.3 }}>{value}</Typography>
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// LOADER
// ══════════════════════════════════════════════════════════════════════════════
function LoaderScreen() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2.5, px: 3 }}>
      <Box sx={{
        width: 72, height: 72, borderRadius: "20px",
        background: "linear-gradient(135deg,#1565C0,#0D47A1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 28px rgba(21,101,192,0.35)",
        animation: "pulse 2s ease-in-out infinite",
        "@keyframes pulse": {
          "0%,100%": { transform: "scale(1)",    boxShadow: "0 8px 28px rgba(21,101,192,0.35)" },
          "50%":     { transform: "scale(1.05)", boxShadow: "0 12px 36px rgba(21,101,192,0.5)" },
        },
      }}>
        <EngineeringIcon sx={{ color: "#fff", fontSize: 34 }} />
      </Box>
      <CircularProgress size={28} thickness={4.5} sx={{ color: "#1565C0" }} />
      <Box sx={{ textAlign: "center" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 0.5 }}>Loading Employee Profile</Typography>
        <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Please wait a moment…</Typography>
      </Box>
    </Box>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NOT FOUND
// ══════════════════════════════════════════════════════════════════════════════
function NotFoundScreen({ employeeId }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", px: 3, textAlign: "center" }}>
      <Box sx={{
        width: 80, height: 80, borderRadius: "22px",
        background: "linear-gradient(135deg,#FEF2F2,#FEE2E2)",
        border: "1px solid #FECACA",
        display: "flex", alignItems: "center", justifyContent: "center",
        mb: 2.5, boxShadow: "0 8px 24px rgba(220,38,38,0.12)",
      }}>
        <SearchOffIcon sx={{ fontSize: 38, color: "#dc2626" }} />
      </Box>
      <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#0F172A", mb: 1 }}>Employee Not Found</Typography>
      <Typography sx={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.75, maxWidth: 320 }}>
        No employee record exists for ID{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "#0F172A", fontFamily: "monospace", background: "#F1F5F9", px: 0.75, py: 0.25, borderRadius: 1 }}>
          {employeeId}
        </Box>.{" "}Please verify the QR code or contact HR.
      </Typography>
      <Box sx={{ mt: 3, px: 3, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff", display: "inline-flex", alignItems: "center", gap: 1 }}>
        <BusinessIcon sx={{ fontSize: 16, color: "#1565C0" }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>HR Department</Typography>
      </Box>
    </Box>
  );
}