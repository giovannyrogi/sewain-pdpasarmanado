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
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toBlob } from "html-to-image";
import moment from "moment";
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
import {
  administrationLabel,
  applyPngDensity,
  TRADER_CARD_EXPORT_DPI,
  waitForTraderPrintAssets,
} from "@/app/utils/traderCardPrinting";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import TraderCardPrintBundle from "@/app/components/documents/TraderCardPrintBundle";
import TraderCardDownloadAssets from "@/app/components/documents/TraderCardDownloadAssets";
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

const sanitizeFilename = (value) =>
  String(value || "kartu-pedagang")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "kartu-pedagang";

const getCardFilename = (document, side) =>
  `${sanitizeFilename(document.document_number || document.tenant_name)}-${
    sanitizeFilename(document.document_id || "kartu")
  }-${
    side === "front" ? "depan" : "belakang"
  }.png`;

export default function LandPermitDocumentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user } = useUser();
  const printRef = useRef(null);
  const cardAssetsRef = useRef(null);
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
  const [downloadBusy, setDownloadBusy] = useState(false);
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
      const documentIds = (printPayload?.documents || [])
        .filter((item) => administrationLabel(item.administration_type) === "KIP")
        .map((item) => item.document_id)
        .filter(Boolean);

      if (documentIds.length) {
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

  const handlePrintPermits = useCallback((items) => {
    const permits = (Array.isArray(items) ? items : []).filter(
      (item) => administrationLabel(item.administration_type) === "KIP",
    );
    if (!permits.length) {
      notify("Tidak ada surat izin KIP untuk dicetak.", "warning");
      return;
    }
    setPrintPayload({
      documents: permits,
      includePermit: true,
      cardSide: null,
      title: "Surat Izin Lahan",
    });
  }, []);

  const handleDownloadCards = useCallback(async (items, requestedSide) => {
    const selected = (Array.isArray(items) ? items : []).filter(Boolean);
    if (!selected.length) {
      notify("Pilih minimal satu kartu untuk diunduh.", "warning");
      return;
    }

    const invalid = selected.find(
      (item) => !/^[A-Za-z0-9_-]{32,120}$/.test(item.qr_token || ""),
    );
    if (invalid) {
      notify(
        `QR tidak valid untuk ${invalid.tenant_name || invalid.document_number}. Periksa dokumen sebelum mengunduh.`,
        "error",
      );
      return;
    }

    const root = cardAssetsRef.current;
    if (!root) {
      notify("Aset kartu belum siap. Silakan coba kembali.", "error");
      return;
    }

    const sides = requestedSide === "both" ? ["front", "back"] : [requestedSide];
    const useZip = selected.length > 1 || sides.length > 1;
    setDownloadBusy(true);
    setLoadingMessage("Menyiapkan gambar kartu pedagang...");
    try {
      await waitForTraderPrintAssets(root);
      const zip = useZip ? new JSZip() : null;

      for (const item of selected) {
        for (const side of sides) {
          const node = root.querySelector(
            `[data-card-download-id="${item.document_id}"][data-card-download-side="${side}"]`,
          );
          if (!node) throw new Error("Desain kartu tidak ditemukan.");
          const imageBlob = await toBlob(node, {
            backgroundColor: "#ffffff",
            cacheBust: true,
            pixelRatio: TRADER_CARD_EXPORT_DPI / 96,
          });
          const blob = imageBlob && await applyPngDensity(imageBlob);
          if (!blob) throw new Error("Gagal membuat gambar kartu.");
          const filename = getCardFilename(item, side);
          if (zip) zip.file(`${side === "front" ? "depan" : "belakang"}/${filename}`, blob);
          else saveAs(blob, filename);
        }
      }

      if (zip) {
        const archive = await zip.generateAsync({ type: "blob" });
        saveAs(archive, `kartu-pedagang-${moment().format("YYYYMMDD-HHmmss")}.zip`);
      }
      notify(
        useZip ? "Paket kartu berhasil diunduh." : "Gambar kartu berhasil diunduh.",
      );
    } catch (error) {
      notify(error.message || "Gagal membuat gambar kartu.", "error");
    } finally {
      setDownloadBusy(false);
      setLoadingMessage("Loading...");
    }
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
              label={`Unduh Terpilih (${selectedDocuments.length})`}
              title="Buka panduan unduh kartu"
              icon="solar:download-minimalistic-bold-duotone"
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
        busy={Boolean(printPayload) || downloadBusy}
        onClose={() => setManualPrintOpen(false)}
        onDownload={handleDownloadCards}
        onPrintPermits={handlePrintPermits}
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
          />
        )}
      </div>
      <TraderCardDownloadAssets
        ref={cardAssetsRef}
        documents={manualPrintDocuments}
      />
    </Box>
  );
}
