"use client";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import AppModal from "@/app/components/modals/AppModal";
import { administrationLabel } from "@/app/utils/traderCardPrinting";

export default function TraderCardPrintGuide({
  open,
  documents = [],
  busy,
  onClose,
  onDownload,
  onPrintPermits,
}) {
  const permits = documents.filter(
    (item) => administrationLabel(item.administration_type) === "KIP",
  );

  return (
    <AppModal
      open={open}
      title="Unduh Kartu Pedagang"
      titleDescription={`${documents.length} kartu dipilih`}
      icon="solar:card-send-bold-duotone"
      width={720}
      onClose={() => !busy && onClose()}
    >
      <Stack spacing={2.25}>
        <Alert severity="info">
          Sistem menghasilkan PNG landscape 86 × 54 mm pada 600 DPI. Unduh
          file lalu cetak melalui Epson Photo+ dengan profil PVC/ID Card,
          orientasi landscape, ukuran asli/100%; sistem tidak lagi mengirim
          kartu ke dialog print browser.
        </Alert>

        {permits.length > 0 && (
          <Box sx={{ py: 1.5, borderBottom: 1, borderColor: "divider" }}>
            <Typography fontWeight={700}>Surat Izin Lahan KIP</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
              Surat izin tetap dicetak di kertas A4. KKIP tidak memiliki surat izin lahan.
            </Typography>
            <Button
              sx={{ mt: 1.5 }}
              variant="outlined"
              startIcon={<Icon icon="solar:printer-2-bold-duotone" />}
              disabled={busy}
              onClick={() => onPrintPermits(permits)}
            >
              Cetak Surat Izin KIP ({permits.length})
            </Button>
          </Box>
        )}

        <Box sx={{ py: 0.25 }}>
          <Typography fontWeight={700}>File Kartu Siap Cetak</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.65 }}>
            Untuk satu kartu, unduh sisi yang diperlukan. Untuk banyak kartu,
            gunakan paket ZIP yang menyimpan folder `depan` dan `belakang`.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} sx={{ mt: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Icon icon="solar:download-minimalistic-bold-duotone" />}
              disabled={busy}
              onClick={() => onDownload(documents, "front")}
            >
              Unduh Depan
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Icon icon="solar:download-minimalistic-bold-duotone" />}
              disabled={busy}
              onClick={() => onDownload(documents, "back")}
            >
              Unduh Belakang
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:box-minimalistic-bold-duotone" />}
              disabled={busy}
              onClick={() => onDownload(documents, "both")}
            >
              Unduh ZIP
            </Button>
          </Stack>
        </Box>

        <Alert severity="warning">
          Saat mencetak di Epson Photo+, pilih PVC/ID Card 86 × 54 mm,
          orientasi landscape, ukuran asli/100%, tanpa “fit to page”, dan
          lakukan uji satu kartu sebelum produksi massal.
        </Alert>

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 0.5 }}>
          <Button
            variant="contained"
            color="error"
            disabled={busy}
            onClick={onClose}
            startIcon={<Icon icon="solar:close-circle-linear" />}
          >
            Kembali
          </Button>
        </Box>
      </Stack>
    </AppModal>
  );
}
