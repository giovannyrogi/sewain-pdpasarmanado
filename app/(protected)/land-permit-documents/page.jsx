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
import TraderCardPrintGuide from "./TraderCardPrintGuide";
import { administrationLabel, validatePrinterProfile, waitForTraderPrintAssets } from "@/app/utils/traderCardPrinting";
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
    onPrintError: () => {
      notify("Dialog cetak gagal dibuka. Silakan coba lagi.", "error");
      setPrintPayload(null);
    },
    documentTitle:
      printPayload?.documents?.length === 1
        ? `${printPayload.title || "Dokumen Izin Lahan"} - ${
            printPayload.documents[0]?.document_number || "Tanpa Nomor"
          }`
        : printPayload?.title || "Dokumen Izin Lahan dan Kartu Pedagang",
    pageStyle: `
@page { size: ${printPayload?.media === "pvc" ? `${printPayload.printerProfile.pageWidth}mm ${printPayload.printerProfile.pageHeight}mm` : "A4 portrait"}; margin: 0; }
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
        .filter((item) => administrationLabel(item.administration_type) === "KIP")
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
      try {
        await waitForTraderPrintAssets(printRef.current);
        if (!cancelled && printRef.current) handlePrint();
      } catch (error) {
        if (!cancelled) {
          notify(error.message || "Gagal menyiapkan cetakan.", "error");
          setPrintPayload(null);
        }
      }
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

  const handlePrintDocuments = useCallback((items, mode, options = {}) => {
    const config = PRINT_MODE_CONFIG[mode];
    if (!config) return;
    const documentsToPrint = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!documentsToPrint.length && !options.calibration) {
      notify("Pilih minimal satu dokumen untuk dicetak.", "warning");
      return;
    }
    if (options.media === "pvc") {
      const error = validatePrinterProfile(options.printerProfile, !options.calibration);
      if (error || !["card-front", "card-back"].includes(mode) || documentsToPrint.length > 2) {
        notify(error || "PVC hanya mencetak satu sisi untuk maksimal dua kartu.", "warning");
        return;
      }
    }
    if (config.cardSide && !options.calibration) {
      const invalid = documentsToPrint.find(item => !/^[A-Za-z0-9_-]{32,120}$/.test(item.qr_token || ""));
      if (invalid) {
        notify(`QR tidak valid untuk ${invalid.tenant_name || invalid.document_number}. Periksa dokumen sebelum mencetak.`, "error");
        return;
      }
    }
    setPrintPayload({
      ...options, mode, documents: documentsToPrint,
      includePermit: config.includePermit, cardSide: config.cardSide,
      title: options.calibration ? "Kalibrasi PVC Epson L8050" : config.title,
      media: options.media || "a4",
    });
  }, []);

  const openManualPrintGuide = useCallback((items) => {
    const documentsToPrint = Array.isArray(items) ? items.filter(Boolean) : [];
    if (!documentsToPrint.length) {
      notify("Pilih minimal satu dokumen untuk dicetak.", "warning");
      return;
    }

    setManualPrintDocuments(documentsToPrint.map(item => ({ ...item })));
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
      <TraderCardPrintGuide
        open={manualPrintOpen}
        documents={manualPrintDocuments}
        busy={Boolean(printPayload)}
        onClose={() => setManualPrintOpen(false)}
        onPrint={handlePrintDocuments}
      />
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
            media={printPayload.media}
            printerProfile={printPayload.printerProfile}
            calibration={printPayload.calibration}
          />
        )}
      </div>
    </Box>
  );
}
