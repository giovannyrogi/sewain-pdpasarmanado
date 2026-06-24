"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import SuratIzinLahan from "@/app/components/documents/SuratIzinLahan";
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
  const [printData, setPrintData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") =>
    setSnackbar({ open: true, message, severity });

  const fetchDocuments = useCallback(async (message = "Memuat dokumen izin lahan...") => {
    setLoadingMessage(message);
    setLoading(true);
    try {
      const response = await axios.get("/api/land-permit-documents");
      if (!response.data?.success) {
        notify(response.data?.message || "Gagal mengambil dokumen izin lahan.", "error");
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
  }, []);

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
      notify(response.data?.message || "Gagal membuat dokumen izin lahan.", "error");
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
      notify(response.data?.message || "Gagal menghapus dokumen izin lahan.", "error");
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
    documentTitle: printData?.document_number || "Surat Izin Lahan",
    pageStyle: `
      @page { size: auto; margin: 0; }
      @media print {
        html, body {
          width: 100% !important;
          min-height: 100% !important;
          margin: 0;
          padding: 0;
          overflow: visible;
        }
        .land-permit-document {
          width: 100% !important;
          min-height: 100vh !important;
          margin: 0 !important;
        }
      }
    `,
    onAfterPrint: () => {
      if (printData?.document_id) {
        axios
          .put(`/api/land-permit-documents/${printData.document_id}`)
          .then(() => fetchDocuments("Memperbarui riwayat cetak dokumen..."))
          .catch(() => {});
      }
      setTimeout(() => setPrintData(null), 200);
    },
  });

  useEffect(() => {
    if (!printData) return;
    const timeout = setTimeout(() => {
      if (printRef.current) handlePrint();
    }, 250);
    return () => clearTimeout(timeout);
  }, [handlePrint, printData]);

  const filteredData = useMemo(
    () => filterLandPermitDocuments(documents, searchText),
    [documents, searchText],
  );
  const stats = useMemo(
    () => buildLandPermitDocumentStats(documents, theme),
    [documents, theme],
  );
  const columns = useMemo(
    () =>
      createLandPermitDocumentColumns({
        theme,
        isMobile,
        onDetail: (record) => {
          setSelectedData(record);
          setDetailOpen(true);
        },
        onPrint: setPrintData,
        canDelete: [1, 9].includes(Number(user?.role_id)),
        onDelete: (record) => {
          setSelectedData(record);
          setDeleteOpen(true);
        },
      }),
    [isMobile, theme, user],
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
        >
          <ReusableAntTable
            rowKey={(record) => record.document_id}
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
      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />

      <div style={{ display: "none" }}>
        {printData && <SuratIzinLahan ref={printRef} data={printData} />}
      </div>
    </Box>
  );
}
