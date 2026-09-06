"use client";

import { useState } from "react";
import { Alert, Box, Button, Checkbox, Collapse, Divider, FormControlLabel, IconButton, MenuItem, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const fieldGrid = { display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", sm: "repeat(2,minmax(0,1fr))" }, gap: 2.5 };
export default function PrinterCalibrationPanel({ profile, busy, error, tested, storageError, onChange, onPrint, onConfirm }) {
  const [help, setHelp] = useState(false);
  const field = (label, value, update, hint) => <TextField fullWidth size="small" label={label} type="number" value={value} disabled={busy} onChange={event => update(event.target.value)} helperText={hint} inputProps={{ step: 0.1, inputMode: "decimal" }} sx={{
    "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
    "& input[type=number]": { MozAppearance: "textfield" },
    "& .MuiInputLabel-root:not(.Mui-focused):not(.Mui-disabled)": { color: theme => theme.ui?.mutedText || theme.palette.text.secondary },
    "& .MuiFormHelperText-root": { mx: 0, mt: 0.75, color: theme => theme.ui?.mutedText || theme.palette.text.secondary },
  }} />;
  return <Stack spacing={2.5}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Box><Typography fontWeight={700}>Pengaturan posisi cetak</Typography><Typography variant="body2" color="text.secondary">Khusus tray PVC. Semua ukuran dalam milimeter (mm).</Typography></Box>
      <Tooltip title="Fungsi dan cara mengisi kalibrasi"><IconButton aria-label="Bantuan kalibrasi" aria-expanded={help} aria-controls="calibration-help" color="info" onClick={() => setHelp(value => !value)}><InfoOutlinedIcon /></IconButton></Tooltip>
    </Stack>
    <Collapse in={help}><Box id="calibration-help" sx={{ p: 2, borderLeft: 3, borderColor: "info.main", bgcolor: "action.hover" }}>
      <Typography fontWeight={700} gutterBottom>Apa itu kalibrasi? Apakah wajib?</Typography>
      <Typography variant="body2" paragraph>Kalibrasi menyelaraskan posisi desain dari SewaIN dengan dua slot kartu pada tray. Wajib dikonfirmasi sebelum cetak PVC pertama kali, tetapi tidak diperlukan untuk cetak A4. Pengaturan disimpan otomatis pada browser ini. Periksa ulang jika berganti printer, driver, browser, atau tray.</Typography>
      <Typography fontWeight={700} gutterBottom>Cara mengisi dan memeriksa</Typography>
      <Box component="ol" sx={{ pl: 2.5, m: 0, "& li": { mb: 1.25, fontSize: 14, lineHeight: 1.6, textAlign: "justify" } }}>
        <li>Buka preferensi cetak Epson L8050 dan pilih media/tray ID card yang sesuai. Catat lebar dan tinggi halaman yang dipakai driver. Angka ini bukan otomatis ukuran kartu 85,6 x 54 mm atau A4.</li>
        <li>Isi koordinat slot dari template tray yang cocok dengan driver. X adalah jarak dari tepi kiri halaman ke sudut kiri atas kartu; Y adalah jarak dari tepi atas. Jika tidak tersedia, minta template posisi dari penyedia tray atau teknisi printer. Jangan menebak angka.</li>
        <li>Mulai offset depan dan belakang dari 0. Jika hasil terlalu ke kanan 2 mm, kurangi offset X sebesar 2. Jika terlalu ke bawah 1 mm, kurangi offset Y sebesar 1. Nilai positif menggeser ke kanan/bawah; nilai negatif ke kiri/atas.</li>
        <li>Cetak pola uji pada media/tray yang sesuai, skala 100%, tanpa fit-to-page dan tanpa header/footer browser. Ukur garis uji: panjangnya harus 50 mm. Jika salah ukuran, perbaiki skala/ukuran halaman pada driver sebelum mengubah offset.</li>
        <li>Balik setiap kartu ke slot semula lalu uji belakang. Pilih rotasi 180 derajat hanya jika hasil belakang terbalik. Setelah posisi kedua slot, ukuran, dan arah benar, centang konfirmasi kedua sisi.</li>
      </Box>
      <Typography variant="body2">SewaIN tidak membaca pengaturan driver atau mendeteksi hasil cetak. Centang konfirmasi hanya setelah memeriksa kartu fisik, bukan sekadar setelah dialog cetak ditutup.</Typography>
    </Box></Collapse>
    <Alert severity="info">Ukuran desain kartu sudah otomatis 85,6 x 54 mm. Offset awal 0 mm dan rotasi belakang 0 derajat. Ukuran halaman driver dan posisi dua slot berbeda dari ukuran kartu: isi sesuai driver/template tray L8050 Anda. Nilai tersimpan pada browser ini sehingga tidak perlu diisi setiap kali mencetak.</Alert>
    <Typography variant="body2">Pada driver Epson, pilih sumber kertas Disc/ID Card Tray dan jenis media PVC ID Card. Setelah mengubah pengaturan, cetak uji dan konfirmasi kedua sisi sebelum mencetak kartu pedagang.</Typography>
    <Typography fontWeight={700}>1. Ukuran halaman driver</Typography>
    <Box sx={fieldGrid}>
      {field("Lebar halaman driver (mm)", profile.pageWidth, value => onChange({ ...profile, pageWidth: value }), "Lebar halaman pada pengaturan driver Epson.")}
      {field("Tinggi halaman driver (mm)", profile.pageHeight, value => onChange({ ...profile, pageHeight: value }), "Tinggi halaman pada pengaturan driver Epson.")}
    </Box>
    <Divider /><Typography fontWeight={700}>2. Posisi slot kartu</Typography>
    {profile.slots.map((slot, index) => <Box key={index} sx={fieldGrid}>
      {["x", "y"].map(axis => <Box key={axis}>{field(`Slot ${index + 1} - ${axis.toUpperCase()} (mm)`, slot[axis], value => onChange({ ...profile, slots: profile.slots.map((item, i) => i === index ? { ...item, [axis]: value } : item) }), axis === "x" ? "Jarak sudut kiri kartu dari tepi kiri halaman." : "Jarak sudut atas kartu dari tepi atas halaman.")}</Box>)}
    </Box>)}
    <Divider /><Typography fontWeight={700}>3. Koreksi posisi dan arah</Typography>
    <Box sx={fieldGrid}>{["front", "back"].map(side => ["X", "Y"].map(axis => <Box key={`${side}-${axis}`}>{field(`Offset ${side === "front" ? "depan" : "belakang"} ${axis} (mm)`, profile[`${side}${axis}`], value => onChange({ ...profile, [`${side}${axis}`]: value }), axis === "X" ? "Awali 0. Positif ke kanan, negatif ke kiri." : "Awali 0. Positif ke bawah, negatif ke atas.")}</Box>))}
      <TextField select fullWidth size="small" label="Rotasi sisi belakang" value={profile.backRotation} disabled={busy} onChange={event => onChange({ ...profile, backRotation: Number(event.target.value) })}><MenuItem value={0}>0 derajat - arah tetap</MenuItem><MenuItem value={180}>180 derajat - putar balik</MenuItem></TextField>
    </Box>
    <Divider /><Typography fontWeight={700}>4. Cetak uji dan konfirmasi</Typography>
    {error && <Alert severity="warning">{error}</Alert>}
    {["front", "back"].map(side => <Stack key={side} spacing={1}>
      <Button disabled={busy || Boolean(error)} variant="outlined" startIcon={<Icon icon="solar:printer-linear" />} onClick={() => onPrint(side, true)}>Cetak Uji {side === "front" ? "Depan" : "Belakang"}</Button>
      <FormControlLabel sx={{ m: 0, alignItems: "flex-start" }} control={<Checkbox color="success" checked={Boolean(profile[side === "front" ? "confirmedFront" : "confirmedBack"])} disabled={busy || Boolean(error) || !(tested[side] || profile[side === "front" ? "confirmedFront" : "confirmedBack"])} onChange={event => onConfirm(side, event.target.checked)} />} label={`Hasil ${side === "front" ? "depan" : "belakang"}: garis 50 mm, posisi kedua slot dan arah kartu sudah tepat.`} />
    </Stack>)}
    {storageError && <Alert severity="error">{storageError}</Alert>}
  </Stack>;
}
