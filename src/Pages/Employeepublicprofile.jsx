import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { db } from "../Config";
import { collection, query, where, getDocs } from "firebase/firestore";
import JsBarcode from "jsbarcode";

// MUI Core
import {
  Box, Typography, Avatar, Chip, Paper, Grid,ThemeProvider,
  CircularProgress, Container, Badge, Button,
} from "@mui/material";
import { createTheme, ThemeProvider, alpha } from "@mui/material/styles";

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
import DownloadIcon       from "@mui/icons-material/Download";
import QrCodeScannerIcon  from "@mui/icons-material/QrCodeScanner";

// ── Theme ──────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: "light",
    primary:    { main: "#1565C0", light: "#1976d2", dark: "#0D47A1" },
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

// ── Barcode Card ───────────────────────────────────────────────────────────────
function BarcodeCard({ employeeId, employeeName, designation, department }) {
  const canvasRef         = useRef(null);
  const [rendered, setRendered]   = useState(false);
  const [barcodeErr, setBarcodeErr] = useState(false);

  useEffect(() => {
    setRendered(false);
    setBarcodeErr(false);
    if (!employeeId) return;
    const t = setTimeout(() => {
      if (!canvasRef.current) return;
      try {
        const safe = String(employeeId).replace(/[^\x20-\x7E]/g, "");
        JsBarcode(canvasRef.current, safe, {
          format:        "CODE128",
          width:         2.2,
          height:        72,
          displayValue:  true,
          text:          safe,
          fontOptions:   "bold",
          font:          "DM Sans, monospace",
          textAlign:     "center",
          textPosition:  "bottom",
          textMargin:    6,
          fontSize:      14,
          background:    "#ffffff",
          lineColor:     "#0F172A",
          margin:        14,
        });
        setRendered(true);
      } catch { setBarcodeErr(true); }
    }, 100);
    return () => clearTimeout(t);
  }, [employeeId]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `Barcode_${employeeId}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid #E2E8F0", overflow: "hidden", mb: 2 }}>

      {/* Card header */}
      <Box sx={{
        px: 2.25, py: 1.5, borderBottom: "1px solid #F1F5F9",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#FAFBFC",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box sx={{ width: 30, height: 30, borderRadius: "8px", background: alpha("#1565C0", 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCodeScannerIcon sx={{ fontSize: 16, color: "#1565C0" }} />
          </Box>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "1.2px" }}>
            Employee Barcode
          </Typography>
        </Box>
        <Chip label="CODE128" size="small"
          sx={{ background: "#EFF6FF", color: "#1565C0", border: "1px solid #BFDBFE", fontSize: 10, fontWeight: 700 }} />
      </Box>

      {/* Barcode body */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>

        {barcodeErr ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#94a3b8", fontSize: 13 }}>
              Unable to render barcode for: <strong>{employeeId}</strong>
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 2.5,
            p: 1, width: "100%", display: "flex", justifyContent: "center",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
            minHeight: 110, alignItems: "center", position: "relative",
          }}>
            {!rendered && (
              <CircularProgress size={24} sx={{ color: "#1565C0", position: "absolute" }} />
            )}
            <canvas
              ref={canvasRef}
              style={{
                maxWidth: "100%", display: "block",
                opacity: rendered ? 1 : 0,
                transition: "opacity 0.35s ease",
              }}
            />
          </Box>
        )}

        {/* Employee info label */}
        {!barcodeErr && (
          <Box sx={{ textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{employeeName}</Typography>
            {(designation || department) && (
              <Typography sx={{ fontSize: 11.5, color: "#64748b", mt: 0.3 }}>
                {designation}{department ? ` · ${department}` : ""}
              </Typography>
            )}
          </Box>
        )}

        {/* Download */}
        {!barcodeErr && (
          <Button
            variant="contained"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleDownload}
            disabled={!rendered}
            sx={{
              px: 2.5, py: 1,
              background: "linear-gradient(135deg,#1565C0,#0D47A1)",
              boxShadow: "0 4px 14px rgba(21,101,192,0.28)",
              fontSize: 13,
              "&:hover": { background: "linear-gradient(135deg,#0D47A1,#0A3070)", boxShadow: "0 6px 20px rgba(21,101,192,0.38)" },
              "&:disabled": { background: "#93c5fd", boxShadow: "none" },
            }}
          >
            Download Barcode
          </Button>
        )}
      </Box>
    </Paper>
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

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: "linear-gradient(160deg,#EEF2F7 0%,#E3EAF4 100%)" }}>
        {status === "loading"  && <LoaderScreen />}
        {status === "notfound" && <NotFoundScreen employeeId={employeeId} />}
        {status === "found" && emp && <ProfilePage emp={emp} />}
      </Box>
    </ThemeProvider>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════════
function ProfilePage({ emp }) {
  const experience = calcExperience(emp.joiningDate);
  const isActive   = emp.status === "Active";

  return (
    <Box>

      {/* ── Sticky Top Nav ── */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 100,
        background: "linear-gradient(135deg,#1565C0 0%,#0D47A1 100%)",
        boxShadow: "0 4px 20px rgba(21,101,192,0.35)",
      }}>
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ px: { xs: 2, sm: 3 }, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            {/* Logo box */}
            <Box sx={{
              width: 38, height: 38, borderRadius: "11px",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <EngineeringIcon sx={{ color: "#fff", fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: { xs: 12.5, sm: 14 }, fontWeight: 800, color: "#fff",
                letterSpacing: "0.8px", lineHeight: 1.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                C-TECH ENGINEERING
              </Typography>
              <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.55)", letterSpacing: "0.3px" }}>
                Employee Identity Portal
              </Typography>
            </Box>
            <Chip
              icon={<Box sx={{
                width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                ml: "4px !important",
                animation: "blink 1.5s infinite",
                "@keyframes blink": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.3 } },
              }} />}
              label="Verified"
              size="small"
              sx={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700, fontSize: 11, flexShrink: 0 }}
            />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="sm" disableGutters sx={{ pb: 5 }}>

        {/* ── Hero Banner ── */}
        <Box sx={{
          background: "linear-gradient(145deg,#0052CC 0%,#0A3A7A 58%,#091E42 100%)",
          position: "relative", overflow: "hidden",
          pt: 5, pb: 7, px: 2,
        }}>
          <Box sx={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", border: "45px solid rgba(255,255,255,0.05)" }} />
          <Box sx={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", border: "30px solid rgba(255,255,255,0.04)" }} />
          <Box sx={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 40%,rgba(33,150,243,0.15) 0%,transparent 65%)" }} />

          <Box sx={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <Box sx={{
                  width: 20, height: 20, borderRadius: "50%",
                  background: isActive ? "#22c55e" : "#f59e0b",
                  border: "2.5px solid #091E42",
                  boxShadow: `0 0 10px ${isActive ? "rgba(34,197,94,0.5)" : "rgba(245,158,11,0.5)"}`,
                }} />
              }>
              <Avatar src={emp.photoURL}
                sx={{
                  width: 96, height: 96,
                  border: "3px solid rgba(255,255,255,0.3)",
                  background: "linear-gradient(135deg,#1e40af,#0052cc)",
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
                  background: isActive ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)",
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
            border: "1px solid #86EFAC",
            background: "linear-gradient(135deg,#F0FDF4,#ECFDF5)",
            display: "flex", alignItems: "center", gap: 1.5, mb: 2,
          }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#DCFCE7,#BBF7D0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 12px rgba(22,163,74,0.2)" }}>
              <VerifiedUserIcon sx={{ color: "#16a34a", fontSize: 22 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>Identity Verified</Typography>
              <Typography sx={{ fontSize: 11.5, color: "#4ade80", mt: 0.2 }}>Officially authenticated by C-Tech Engineering</Typography>
            </Box>
            <Chip label="Live" size="small" sx={{ background: "#DCFCE7", color: "#166534", fontWeight: 800, fontSize: 11, border: "1px solid #86EFAC" }} />
          </Paper>

          {/* Quick Stats */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {[
              { label: "Experience", value: experience || "—",       color: "#1565C0", border: "#1565C0" },
              { label: "Blood Group", value: emp.bloodGroup || "—",  color: "#dc2626", border: "#dc2626" },
              { label: "Status",      value: emp.status || "Active", color: isActive ? "#16a34a" : "#d97706", border: isActive ? "#16a34a" : "#d97706" },
            ].map((s) => (
              <Grid item xs={4} key={s.label}>
                <Paper elevation={0} sx={{
                  p: { xs: "12px 8px", sm: "14px 12px" },
                  borderRadius: 2.5,
                  border: "1px solid #E2E8F0",
                  borderTop: `3px solid ${s.border}`,
                  textAlign: "center", background: "#fff",
                  transition: "transform .2s, box-shadow .2s",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 20px ${alpha(s.color, 0.12)}` },
                }}>
                  <Typography sx={{ fontSize: { xs: 15, sm: 18 }, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</Typography>
                  <Typography sx={{ fontSize: { xs: 9, sm: 10 }, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", mt: 0.6 }}>{s.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* ── Barcode ── */}
          <BarcodeCard
            employeeId={emp.employeeId}
            employeeName={emp.fullName}
            designation={emp.designation}
            department={emp.department}
          />

          {/* Contact Information */}
          <InfoCard title="Contact Information" icon={<PhoneIcon />} iconColor="#1565C0">
            <InfoRow icon={<PhoneIcon />}     label="Mobile"     value={emp.contactNumber} />
            <InfoRow icon={<EmailIcon />}     label="Work Email" value={emp.email} />
            <InfoRow icon={<LocationOnIcon />}label="Location"   value={emp.location} />
            <InfoRow icon={<AccessTimeIcon />}label="Work Shift" value={emp.workShift} />
          </InfoCard>

          {/* Employment Details */}
          <InfoCard title="Employment Details" icon={<WorkIcon />} iconColor="#7C3AED">
            <InfoRow icon={<WorkIcon />}         label="Department"      value={emp.department} />
            <InfoRow icon={<BadgeIcon />}         label="Designation"     value={emp.designation} />
            <InfoRow
              icon={<CalendarTodayIcon />}
              label="Date of Joining"
              value={emp.joiningDate
                ? new Date(emp.joiningDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            />
            <InfoRow icon={<AccessTimeIcon />} label="Work Experience" value={experience} />
          </InfoCard>

          {/* Medical & Emergency */}
          {(emp.bloodGroup || emp.emergencyContact || emp.emergencyPhone) && (
            <InfoCard title="Medical & Emergency" icon={<FavoriteIcon />} iconColor="#dc2626" emergency>
              <InfoRow icon={<FavoriteIcon />}label="Blood Group"       value={emp.bloodGroup} />
              <InfoRow icon={<PersonIcon />}  label="Emergency Contact" value={emp.emergencyContact} />
              <InfoRow icon={<PhoneIcon />}   label="Emergency Phone"   value={emp.emergencyPhone} />
            </InfoCard>
          )}

          {/* Notes */}
          {emp.notes && (
            <InfoCard title="Additional Notes" icon={<NoteAltIcon />} iconColor="#0891b2">
              <Typography sx={{ fontSize: 13.5, color: "#475569", lineHeight: 1.8, pt: 0.5 }}>{emp.notes}</Typography>
            </InfoCard>
          )}

          {/* Footer */}
          <Box sx={{
            background: "linear-gradient(145deg,#0052CC 0%,#091E42 100%)",
            borderRadius: 3.5, p: 3, textAlign: "center", mt: 1,
            position: "relative", overflow: "hidden",
          }}>
            <Box sx={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", border: "20px solid rgba(255,255,255,0.05)" }} />
            <Box sx={{ position: "relative", zIndex: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 0.75 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: "8px", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EngineeringIcon sx={{ color: "#fff", fontSize: 16 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "1.5px" }}>C-TECH ENGINEERING</Typography>
              </Box>
              <Box sx={{ width: 40, height: 1, background: "rgba(255,255,255,0.2)", mx: "auto", my: 1.25 }} />
              <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                BUILDING TRUST. DELIVERING EXCELLENCE.
              </Typography>
              <Typography sx={{ fontSize: 10, color: "rgba(255,255,255,0.22)", mt: 1 }}>
                © {new Date().getFullYear()} C-Tech Engineering Co. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// ── Info Card ──────────────────────────────────────────────────────────────────
function InfoCard({ title, icon, iconColor, children, emergency }) {
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
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5,
      py: 1.4, borderBottom: "1px solid #F8FAFC",
      "&:last-child": { borderBottom: "none" },
    }}>
      <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { fontSize: 16, color: "#1565C0" } })}
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
        </Box>.{" "}Please verify the barcode or contact HR.
      </Typography>
      <Box sx={{ mt: 3, px: 3, py: 1.5, borderRadius: 2.5, border: "1px solid #E2E8F0", background: "#fff", display: "inline-flex", alignItems: "center", gap: 1 }}>
        <BusinessIcon sx={{ fontSize: 16, color: "#1565C0" }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>C-Tech Engineering · HR Department</Typography>
      </Box>
    </Box>
  );
}