"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import AppModal from "@/app/components/modals/AppModal";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import TraderCardPrintBundle from "@/app/components/documents/TraderCardPrintBundle";
import { useUser } from "@/app/utils/useUser";
import LandPermitDocumentFormModal from "./LandPermitDocumentFormModal";
import {
  LAND_DOCUMENT_ACTION_COLUMN_WIDTH,
  LAND_DOCUMENT_PAGE_SIZE_OPTIONS,
  LAND_DOCUMENT_TABLE_SCROLL_WIDTH,
  buildLandPermitDocumentStats,
  createLandPermitDocumentColumns,
  filterLandPermitDocuments,
} from "./LandPermitDocumentTableColumns";

/**
 * react-to-print bisa membuka dialog sebelum gambar/QR selesai dirender.
 * Fungsi ini menunggu semua gambar dan font di area print agar logo, pas foto,
 * dan QR code tampil stabil di print preview, termasuk saat batch print.
 */
const waitForPrintAssets = async (rootElement) => {
  if (!rootElement || typeof window === "undefined") return;

  const images = Array.from(rootElement.querySelectorAll("img"));
  await Promise.all(
    images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve();
      if (typeof image.decode === "function") {
        return image.decode().catch(() => undefined);
      }

      return new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    }),
  );

  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
};

const PRINT_MODE_CONFIG = {
  permit: {
    includePermit: true,
    cardSide: null,
    title: "Surat Izin Lahan",
  },
  "card-front": {
    includePermit: false,
    cardSide: "front",
    title: "Kartu Pedagang Bagian Depan",
  },
  "card-back": {
    includePermit: false,
    cardSide: "back",
    title: "Kartu Pedagang Bagian Belakang",
  },
  "card-both": {
    includePermit: false,
    cardSide: "both",
    title: "Kartu Pedagang Lengkap",
  },
  "bundle-duplex": {
    includePermit: true,
    cardSide: "both",
    title: "Surat Izin Lahan dan Kartu Pedagang",
  },
};

export default function LandPermitDocumentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useUser();
  const printRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [printPayload, setPrintPayload] = useState(null);
  const [manualPrintOpen, setManualPrintOpen] = useState(false);
  const [manualPrintDocuments, setManualPrintDocuments] = useState([]);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const fetchDocuments = useCallback(
    async (message = "Memuat dokumen izin lahan...") => {
      setLoadingMessage(message);
      setLoading(true);
      try {
        const response = await axios.get("/api/land-permit-documents");
        if (!response.data?.success) {
          notify(
            response.data?.message || "Gagal mengambil dokumen izin lahan.",
            "error",
          );
          return false;
        }
        setDocuments(response.data.data || []);
        setEligibleApplications(response.data.eligible_applications || []);
        return true;
      } catch (error) {
        notify(
          error?.response?.data?.message ||
            "Terjadi kesalahan saat mengambil dokumen izin lahan.",
          "error",
        );
        return false;
      } finally {
        setLoading(false);
        setLoadingMessage("Loading...");
      }
    },
    [],
  );

  useEffect(() => {
    if (user) fetchDocuments();
  }, [fetchDocuments, user]);

  const handleCreate = async (payload) => {
    setLoadingMessage("Menyimpan dokumen izin lahan...");
    setLoading(true);
    try {
      const response = await axios.post("/api/land-permit-documents", payload);
      if (response.data?.success) {
        notify(response.data.message || "Dokumen izin lahan berhasil dibuat.");
        setFormOpen(false);
        await fetchDocuments("Memuat ulang dokumen izin lahan...");
        return;
      }
      notify(
        response.data?.message || "Gagal membuat dokumen izin lahan.",
        "error",
      );
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat membuat dokumen izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handleDelete = async () => {
    if (!selectedData?.document_id) return;

    setLoadingMessage("Menghapus dokumen izin lahan...");
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/land-permit-documents/${selectedData.document_id}`,
      );
      if (response.data?.success) {
        notify(response.data.message || "Dokumen izin lahan berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedData(null);
        await fetchDocuments("Memuat ulang dokumen izin lahan...");
        return;
      }
      notify(
        response.data?.message || "Gagal menghapus dokumen izin lahan.",
        "error",
      );
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menghapus dokumen izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      printPayload?.documents?.length === 1
        ? `${printPayload.title || "Dokumen Izin Lahan"} - ${
            printPayload.documents[0]?.document_number || "Tanpa Nomor"
          }`
        : printPayload?.title || "Dokumen Izin Lahan dan Kartu Pedagang",
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body {
          width: 100% !important;
          min-height: 100% !important;
          margin: 0;
          padding: 0;
          overflow: visible;
        }
        .land-permit-print-source {
          position: static !important;
          left: auto !important;
          top: auto !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          pointer-events: auto !important;
        }
        .land-permit-document {
          width: 100% !important;
          min-height: 100vh !important;
          margin: 0 !important;
        }
      }
    `,
    onAfterPrint: () => {
      const shouldMarkPermitPrinted = Boolean(printPayload?.includePermit);
      const documentIds = (printPayload?.documents || [])
        .map((item) => item.document_id)
        .filter(Boolean);

      if (shouldMarkPermitPrinted && documentIds.length) {
        Promise.allSettled(
          documentIds.map((id) =>
            axios.put(`/api/land-permit-documents/${id}`),
          ),
        ).then(() => fetchDocuments("Memperbarui riwayat cetak dokumen..."));
      }
      setTimeout(() => setPrintPayload(null), 200);
    },
  });

  useEffect(() => {
    if (!printPayload) return;

    let cancelled = false;
    const timeout = setTimeout(async () => {
      await waitForPrintAssets(printRef.current);
      if (!cancelled && printRef.current) handlePrint();
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [handlePrint, printPayload]);

  const filteredData = useMemo(
    () => filterLandPermitDocuments(documents, searchText),
    [documents, searchText],
  );
  const stats = useMemo(
    () => buildLandPermitDocumentStats(documents, theme),
    [documents, theme],
  );
  const selectedDocuments = useMemo(() => {
    const selectedKeySet = new Set(selectedDocumentKeys);
    return documents.filter((item) => selectedKeySet.has(item.document_id));
  }, [documents, selectedDocumentKeys]);

  const handlePrintDocuments = useCallback((items, mode) => {
    const documentsToPrint = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!documentsToPrint.length) {
      notify("Pilih minimal satu dokumen untuk dicetak.", "warning");
      return;
    }

    const config = PRINT_MODE_CONFIG[mode] || PRINT_MODE_CONFIG.permit;
    setPrintPayload({
      mode,
      documents: documentsToPrint,
      includePermit: config.includePermit,
      cardSide: config.cardSide,
      title: config.title,
    });
  }, []);

  const openManualPrintGuide = useCallback((items) => {
    const documentsToPrint = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!documentsToPrint.length) {
      notify("Pilih minimal satu dokumen untuk dicetak.", "warning");
      return;
    }

    setManualPrintDocuments(documentsToPrint);
    setManualPrintOpen(true);
  }, []);
  const columns = useMemo(
    () =>
      createLandPermitDocumentColumns({
        theme,
        isMobile,
        onDetail: (record) => {
          setSelectedData(record);
          setDetailOpen(true);
        },
        onPrintGuide: (record) => openManualPrintGuide([record]),
        canDelete: [1, 9].includes(Number(user?.role_id)),
        onDelete: (record) => {
          setSelectedData(record);
          setDeleteOpen(true);
        },
      }),
    [isMobile, openManualPrintGuide, theme, user],
  );

  const canCreate = [1, 9].includes(Number(user?.role_id));
  const administrationType = manualPrintDocuments?.[0]?.administration_type;

  const printSteps =
    administrationType === "kip"
      ? [
          {
            step: "1",
            title: "Cetak Surat Izin Lahan",
            description: "Mencetak seluruh surat izin lahan terlebih dahulu.",
            label: "Cetak Surat Izin",
            mode: "permit",
          },
          {
            step: "2",
            title: "Cetak Kartu Bagian Depan",
            description:
              "Mencetak sisi depan kartu pedagang pada lembar kartu.",
            label: "Cetak Kartu Depan",
            mode: "card-front",
          },
          {
            step: "3",
            title: "Masukkan Ulang Kertas",
            description:
              "Ambil kertas kartu depan, balik atau putar sesuai arah printer, lalu masukkan kembali ke tray.",
            label: null,
            mode: null,
          },
          {
            step: "4",
            title: "Cetak Kartu Bagian Belakang",
            description:
              "Mencetak sisi belakang kartu dengan posisi grid yang sama seperti sisi depan.",
            label: "Cetak Kartu Belakang",
            mode: "card-back",
          },
        ]
      : [
          {
            step: "1",
            title: "Cetak Kartu Bagian Depan",
            description:
              "Mencetak sisi depan kartu pedagang pada lembar kartu.",
            label: "Cetak Kartu Depan",
            mode: "card-front",
          },
          {
            step: "2",
            title: "Masukkan Ulang Kertas",
            description:
              "Ambil kertas kartu depan, balik atau putar sesuai arah printer, lalu masukkan kembali ke tray.",
            label: null,
            mode: null,
          },
          {
            step: "3",
            title: "Cetak Kartu Bagian Belakang",
            description:
              "Mencetak sisi belakang kartu dengan posisi grid yang sama seperti sisi depan.",
            label: "Cetak Kartu Belakang",
            mode: "card-back",
          },
        ];

  return (
    <Box sx={{ width: "100%", minHeight: "100%", p: { xs: 1.25, sm: 2 } }}>
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          breadcrumbs={[
            {
              label: "Transaksi",
              value: "transactions",
              path: "#",
              icon: "solar:money-bag-bold-duotone",
            },
            {
              label: "Dokumen Izin Lahan",
              value: "land-permit-documents",
              path: "/land-permit-documents",
              icon: "solar:document-text-bold-duotone",
            },
          ]}
          title="Dokumen Izin Lahan"
          description="Buat dan cetak Surat Izin Lahan untuk pemohon yang pembayarannya telah disetujui."
          icon="solar:document-text-bold-duotone"
          actionSx={{ width: { xs: "100%", md: "auto" } }}
          action={
            canCreate && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<Icon icon="solar:document-add-bold-duotone" />}
                onClick={async () => {
                  const loaded = await fetchDocuments(
                    "Memuat data form dokumen izin lahan...",
                  );
                  if (loaded) setFormOpen(true);
                }}
                sx={{
                  minHeight: 46,
                  px: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Buat Dokumen
              </Button>
            )
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {stats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Dokumen Izin Lahan"
          description={`${filteredData.length} dari ${documents.length} dokumen ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari penyewa, NIK, nomor dokumen, lokasi, sektor, atau lahan"
          onSearchChange={setSearchText}
          headerAction={
            <TableActionButton
              label={`Cetak Terpilih (${selectedDocuments.length})`}
              title="Buka panduan cetak manual"
              icon="solar:printer-2-bold-duotone"
              color="warning"
              disabled={!selectedDocuments.length}
              keepLabelOnMobile
              fullWidthOnMobile
              onClick={() => openManualPrintGuide(selectedDocuments)}
            />
          }
        >
          <ReusableAntTable
            rowKey={(record) => record.document_id}
            rowSelection={{
              selectedRowKeys: selectedDocumentKeys,
              preserveSelectedRowKeys: true,
              onChange: setSelectedDocumentKeys,
            }}
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={LAND_DOCUMENT_PAGE_SIZE_OPTIONS}
            onPageSizeChange={setPageSize}
            tableLayout="fixed"
            scroll={{ x: LAND_DOCUMENT_TABLE_SCROLL_WIDTH, y: 430 }}
            fixedActionColumn={{
              className: "land-documents-action-column",
              buttonsClassName: "land-documents-action-buttons",
              buttonsOffsetX: 6,
              width: LAND_DOCUMENT_ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <LandPermitDocumentFormModal
        open={formOpen}
        applications={eligibleApplications}
        loading={loading}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedData}
      />
      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Dokumen"
        titleDescription="Konfirmasi penghapusan dokumen dari sistem."
        description={`Dokumen ${selectedData?.document_number || "-"} atas nama ${
          selectedData?.tenant_name || "-"
        } akan dihapus. Pemohon dapat dipilih kembali untuk dibuatkan dokumen baru.`}
        confirmLabel="Hapus Dokumen"
        loadingLabel="Menghapus dokumen izin lahan..."
        severity="error"
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <AppModal
        open={manualPrintOpen}
        title="Panduan Cetak Manual"
        titleDescription="Cetak surat izin dan kartu pedagang secara bertahap untuk printer tanpa duplex otomatis."
        icon="solar:printer-2-bold-duotone"
        width={680}
        onClose={() => setManualPrintOpen(false)}
      >
        <Stack spacing={1.5}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(255,152,0,0.08)"
                  : "rgba(255,152,0,0.06)",
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
              {manualPrintDocuments.length} dokumen dipilih
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                color: theme.ui?.mutedText || "text.secondary",
                fontSize: 12.5,
                fontWeight: 600,
                lineHeight: 1.6,
              }}
            >
              Ikuti urutan ini agar bagian depan dan belakang kartu pedagang
              bisa tercetak pada kertas yang sama.
            </Typography>
          </Box>

          {printSteps.map((item) => (
            <Box
              key={item.step}
              sx={{
                p: { xs: 1.5, sm: 1.75 },
                borderRadius: 2,
                border: `1px solid ${theme.ui?.dashboardCardBorder || theme.palette.divider}`,
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "42px minmax(0, 1fr) auto",
                },
                gap: { xs: 1.25, sm: 1.5 },
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.14)"
                      : "rgba(255,152,0,0.12)",
                  fontWeight: 700,
                }}
              >
                {item.step}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    mt: 0.4,
                    color: theme.ui?.mutedText || "text.secondary",
                    fontSize: 12.25,
                    fontWeight: 600,
                    lineHeight: 1.55,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>
              {item.mode && (
                <Button
                  variant={item.step === "1" ? "contained" : "outlined"}
                  onClick={() =>
                    handlePrintDocuments(manualPrintDocuments, item.mode)
                  }
                  sx={{
                    minHeight: 40,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: "none",
                    width: { xs: "100%", sm: "auto" },
                    justifySelf: { xs: "stretch", sm: "end" },
                  }}
                >
                  {item.label}
                </Button>
              )}
            </Box>
          ))}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="flex-end"
            sx={{ pt: 0.5 }}
          >
            {/* {administrationType === "kip" && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() =>
                  handlePrintDocuments(manualPrintDocuments, "bundle-duplex")
                }
              >
                Cetak Semua Sekaligus
              </Button>
            )} */}

            <Button
              variant="contained"
              color="inherit"
              onClick={() => setManualPrintOpen(false)}
              sx={{
                minHeight: 42,
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Kembali
            </Button>
          </Stack>
        </Stack>
      </AppModal>
      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />

      <div
        className="land-permit-print-source"
        style={{
          position: "fixed",
          left: "-10000px",
          top: 0,
          width: "210mm",
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {printPayload && (
          <TraderCardPrintBundle
            ref={printRef}
            documents={printPayload.documents}
            includePermit={printPayload.includePermit}
            includeCards={Boolean(printPayload.cardSide)}
            cardSide={printPayload.cardSide || "both"}
          />
        )}
      </div>
    </Box>
  );
}
