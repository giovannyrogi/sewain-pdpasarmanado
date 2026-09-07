"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Checkbox, Chip, FormControlLabel, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import PrinterCalibrationPanel from "./PrinterCalibrationPanel";
import AppModal from "@/app/components/modals/AppModal";
import { administrationLabel, formatLandDocumentNumber, chunkCards, defaultPrinterProfile, PRINTER_PROFILE_KEY, validatePrinterProfile } from "@/app/utils/traderCardPrinting";
export default function TraderCardPrintGuide({
  open,
  documents,
  onClose,
  onPrint,
  busy
}) {
  const [media, setMedia] = useState("a4");
  const [group, setGroup] = useState(0);
  const [profile, setProfile] = useState(defaultPrinterProfile);
  const [calibrating, setCalibrating] = useState(false);
  const [results, setResults] = useState({});
  const [tested, setTested] = useState({});
  const [storageError, setStorageError] = useState("");
  useEffect(() => {
    if (!open) return;
    setMedia("a4");
    setGroup(0);
    setResults({});
    setTested({});
    setCalibrating(false);
    try {
      const saved = JSON.parse(localStorage.getItem(PRINTER_PROFILE_KEY) || "null");
      setProfile(saved && !validatePrinterProfile(saved) ? saved : defaultPrinterProfile());
    } catch {
      setProfile(defaultPrinterProfile());
    }
  }, [open]);
  const groups = chunkCards(documents, 2);
  const active = groups[group] || [];
  const permits = documents.filter(item => administrationLabel(item.administration_type) === "KIP");
  const profileError = validatePrinterProfile(profile);
  const productionError = validatePrinterProfile(profile);
  const updateProfile = next => {
    const updated = {
      ...next,
      confirmedFront: false,
      confirmedBack: false
    };
    setProfile(updated);
    setTested({});
    try {
      localStorage.setItem(PRINTER_PROFILE_KEY, JSON.stringify(updated));
    } catch {
      setStorageError("Pengaturan tidak dapat disimpan pada browser ini.");
    }
  };
  const confirmCalibration = (side, checked) => {
    const updated = {
      ...profile,
      [side === "front" ? "confirmedFront" : "confirmedBack"]: checked
    };
    setProfile(updated);
    try {
      localStorage.setItem(PRINTER_PROFILE_KEY, JSON.stringify(updated));
      setStorageError("");
    } catch {
      setStorageError("Pengaturan tidak dapat disimpan pada browser ini.");
    }
  };
  const printSide = (side, calibration = false) => {
    if (calibration) setTested(current => ({
      ...current,
      [side]: true
    }));else setResults(current => ({
      ...current,
      [`${group}-${side}`]: false
    }));
    onPrint(calibration ? [] : active, `card-${side}`, {
      media: "pvc",
      printerProfile: structuredClone(profile),
      calibration,
      group
    });
  };
  const step = (number, title, description, action) => <Box sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
    <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} gap={2}>
      <Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={700}>{number}. {title}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.6 }}>{description}</Typography></Box>
      {action}
    </Stack>
  </Box>;
  const printIcon = <Icon icon="solar:printer-linear" width={18} />;
  return <AppModal open={open} title="Panduan Cetak" icon="solar:printer-2-bold-duotone" titleDescription={`${documents.length} dokumen dipilih`} width={780} onClose={() => !busy && onClose()}>
    <Stack spacing={2.5} sx={{
      "& .MuiButton-root": { fontWeight: 700, textTransform: "none", minHeight: 42, borderRadius: 1.5, px: 2 },
      "& .MuiTypography-root": { overflowWrap: "anywhere" },
      "& .MuiTypography-body2": { color: theme => theme.ui?.mutedText || theme.palette.text.secondary, textAlign: "justify" },
      "& .MuiAlert-message": { textAlign: "justify" },
      "& .MuiFormControlLabel-root": { gap: 1.25, py: 0.75, minHeight: 44 },
      "& .MuiFormControlLabel-root .MuiCheckbox-root": { p: 0, flexShrink: 0 },
      "& .MuiFormControlLabel-label": { fontSize: 13, lineHeight: "24px", minWidth: 0 },
    }}>
      <ToggleButtonGroup value={media} exclusive onChange={(_, value) => { if (value) { setMedia(value); setCalibrating(false); } }} disabled={busy} fullWidth size="small" aria-label="Media cetak" sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700, py: 1.25 }, "& .Mui-selected": { color: "primary.main", borderColor: "primary.main" } }}>
        <ToggleButton value="a4">Kertas A4</ToggleButton><ToggleButton value="pvc">PVC Epson L8050</ToggleButton>
      </ToggleButtonGroup>
      {media === "a4" ? <>
        <Typography variant="body2">Cetak beberapa kartu pada satu lembar A4. Tidak perlu mengisi kalibrasi PVC.</Typography>
        {permits.length > 0 && step("1", "Surat izin", "Dicetak pada lembar A4 terpisah dari kartu pedagang.", <Button disabled={busy} variant="outlined" startIcon={printIcon} onClick={() => onPrint(permits, "permit")}>Cetak Surat Izin ({permits.length}) - A4</Button>)}
        {step(permits.length ? "2" : "1", "Bagian depan kartu", "Pilih A4, skala 100%, dan nonaktifkan header/footer browser. Uji satu lembar terlebih dahulu.", <Button disabled={busy} variant="contained" startIcon={printIcon} onClick={() => onPrint(documents, "card-front")}>Cetak Kartu Depan</Button>)}
        {step(permits.length ? "3" : "2", "Balik lembar, lalu cetak belakang", "Balik kertas pada sisi panjang dan masukkan ulang sesuai arah pengumpan printer. Pastikan urutan tumpukan tidak tertukar.", <Button disabled={busy} variant="outlined" startIcon={printIcon} onClick={() => onPrint(documents, "card-back")}>Cetak Kartu Belakang</Button>)}
        <Accordion elevation={0} disableGutters sx={{ bgcolor: "transparent", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<Icon icon="solar:alt-arrow-down-linear" />}><Typography fontWeight={700}>Pilihan cetak lengkap</Typography></AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}><Stack spacing={2}>
            <Typography variant="body2">Kartu lengkap memuat kedua sisi dalam satu job. Paket lengkap juga menyertakan surat izin KIP. Periksa rentang halaman dan pengaturan duplex; surat harus berada pada lembar tersendiri.</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}><Button fullWidth disabled={busy} variant="outlined" startIcon={printIcon} onClick={() => onPrint(documents, "card-both")}>Cetak Kartu Lengkap</Button><Button fullWidth disabled={busy} variant="outlined" startIcon={printIcon} onClick={() => onPrint(documents, "bundle-duplex")}>Cetak Paket Lengkap</Button></Stack>
          </Stack></AccordionDetails>
        </Accordion>
      </> : <>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} gap={1.5}>
          <Chip size="small" variant="outlined" color={productionError ? "warning" : profile.confirmedFront && profile.confirmedBack ? "success" : "info"} label={productionError ? "Profil cetak perlu diperiksa" : profile.confirmedFront && profile.confirmedBack ? "Kalibrasi terkonfirmasi" : "Profil awal siap dicetak"} sx={{ alignSelf: "flex-start", fontWeight: 600 }} />
          <Button variant="outlined" disabled={busy} startIcon={<Icon icon={calibrating ? "solar:arrow-left-linear" : "solar:settings-linear"} />} onClick={() => setCalibrating(value => !value)}>{calibrating ? "Tutup Kalibrasi" : "Kalibrasi Cetak"}</Button>
        </Stack>
        {calibrating ? <PrinterCalibrationPanel profile={profile} busy={busy} error={profileError} tested={tested} storageError={storageError} onChange={updateProfile} onPrint={printSide} onConfirm={confirmCalibration} /> : <>
          {productionError ? <Alert severity="warning">Profil cetak tidak valid. Buka Kalibrasi Cetak untuk memperbaiki ukuran halaman atau posisi slot.</Alert> : <Alert severity={profile.confirmedFront && profile.confirmedBack ? "success" : "info"}>{profile.confirmedFront && profile.confirmedBack ? "Kalibrasi kedua sisi sudah dikonfirmasi." : "Profil awal dua kartu sudah aktif. Anda dapat langsung mencetak; gunakan Kalibrasi Cetak hanya bila posisi atau arah hasil fisik belum tepat."}</Alert>}
          <Typography fontWeight={700}>Kelompok {group + 1} dari {groups.length}</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {[0, 1].map(slot => <Box key={slot} sx={{ p: 1.5, bgcolor: "action.hover", borderLeft: 3, borderColor: active[slot] ? "primary.main" : "divider", minWidth: 0 }}>
              <Typography fontWeight={700}>Slot {slot + 1}: {active[slot]?.tenant_name || "Kosong"}</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>{active[slot] ? formatLandDocumentNumber(active[slot].document_number, active[slot].administration_type) : "Tidak dicetak"}</Typography>
            </Box>)}
          </Box>
          {permits.length > 0 && <Button disabled={busy} variant="outlined" startIcon={printIcon} onClick={() => onPrint(permits, "permit")}>Cetak Surat Izin ({permits.length}) - A4</Button>}
          {["front", "back"].map((side, index) => <Stack key={side} spacing={1.25} sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography fontWeight={700}>{index + 1}. {side === "front" ? "Cetak bagian depan" : "Balik kartu dan cetak belakang"}</Typography>
            <Typography variant="body2">{side === "front" ? "Kirim job, tunggu indikator/perintah Epson, lalu masukkan tray dengan sisi cetak menghadap ke atas." : "Setelah depan selesai, balik setiap kartu dan kembalikan ke slot yang sama. Gunakan arah belakang sesuai hasil kalibrasi."}</Typography>
            <Button variant={side === "front" ? "contained" : "outlined"} startIcon={printIcon} disabled={busy || Boolean(productionError)} onClick={() => printSide(side)}>Cetak {side === "front" ? "Depan" : "Belakang"}</Button>
            <FormControlLabel sx={{ m: 0, alignItems: "flex-start" }} control={<Checkbox color="success" checked={Boolean(results[`${group}-${side}`])} disabled={busy || Boolean(productionError)} onChange={event => setResults(current => ({ ...current, [`${group}-${side}`]: event.target.checked }))} />} label={`Hasil ${side === "front" ? "depan" : "belakang"} kelompok ini sudah benar`} />
          </Stack>)}
          <Typography variant="body2">Periksa hasil fisik sebelum mencentang kedua konfirmasi. Dialog yang ditutup atau dibatalkan tidak menandakan cetak berhasil. Anda dapat mencetak ulang sisi yang sama.</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.5}><Button fullWidth variant="outlined" startIcon={<Icon icon="solar:arrow-left-linear" />} disabled={busy || group === 0} onClick={() => setGroup(value => value - 1)}>Sebelumnya</Button><Button fullWidth variant="contained" endIcon={<Icon icon="solar:arrow-right-linear" />} disabled={busy || group >= groups.length - 1 || !results[`${group}-front`] || !results[`${group}-back`]} onClick={() => setGroup(value => value + 1)}>Berikutnya</Button></Stack>
          {group === groups.length - 1 && results[`${group}-front`] && results[`${group}-back`] && <Alert severity="success">Kelompok terakhir sudah dikonfirmasi. Gunakan Sebelumnya untuk memeriksa kelompok lain atau tutup panduan.</Alert>}
        </>}
      </>}
      <Box sx={{ position: "sticky", bottom: -1, pt: 2, pb: 0.5, borderTop: 1, borderColor: "divider", bgcolor: "background.paper", display: "flex", justifyContent: "flex-end", zIndex: 1 }}>
        <Button disabled={busy} variant="contained" color="error" startIcon={<Icon icon="solar:close-circle-linear" />} onClick={onClose} sx={{ width: { xs: "100%", sm: "auto" } }}>Kembali</Button>
      </Box>
    </Stack>
  </AppModal>;
}
