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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import LandPermitApplicationFormModal from "./LandPermitApplicationFormModal";
import LandPermitApplicantDetailModal from "./LandPermitApplicantDetailModal";
import {
  buildLandPermitStats,
  filterLandPermitApplications,
} from "./landPermitApplicationUtils";
import { getLandPermitApplicationColumns } from "./LandPermitApplicationTableColumns";
import { useReactToPrint } from "react-to-print";
import SuratPernyataanIzinLahan from "@/app/components/documents/SuratPernyataanIzinLahan";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const ACTION_COLUMN_WIDTH = 190;
const TABLE_SCROLL_WIDTH = 1540;

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

export default function LandPermitApplicationsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [applications, setApplications] = useState([]);
  const [identities, setIdentities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);
  const printRef = useRef(null);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchData = useCallback(
    async (message = "Memuat data izin lahan...") => {
      setLoadingMessage(message);
      setLoading(true);
      try {
        const [
          applicationResponse,
          identityResponse,
          locationResponse,
          sectorResponse,
          stallResponse,
        ] = await Promise.all([
          axios.get("/api/land-permit-applications"),
          axios.get("/api/identity-list"),
          axios.get("/api/locations"),
          axios.get("/api/land-sectors"),
          axios.get("/api/land-stalls"),
        ]);

        if (!applicationResponse.data?.success) {
          showSnackbar("Gagal mengambil data permohonan izin lahan.", "error");
          return false;
        }

        setApplications(applicationResponse.data.data || []);
        setIdentities(identityResponse.data?.data || []);
        setLocations(locationResponse.data?.data || []);
        setSectors(sectorResponse.data?.data || []);
        setStalls(stallResponse.data?.data || []);
        return true;
      } catch (error) {
        showSnackbar(
          error?.response?.data?.message ||
            "Terjadi kesalahan saat mengambil data permohonan izin lahan.",
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
    fetchData();
  }, [fetchData]);

  const filteredApplications = useMemo(
    () => filterLandPermitApplications(applications, searchText),
    [applications, searchText],
  );
  const stats = useMemo(
    () => buildLandPermitStats(applications, theme),
    [applications, theme],
  );

  const openCreateModal = async () => {
    if (loading) return;
    setSelectedData(null);
    setFormMode("create");
    const loaded = await fetchData("Memuat data form permohonan izin lahan...");
    if (loaded) setFormOpen(true);
  };

  const openEditModal = async (record) => {
    if (loading) return;
    setSelectedData(record);
    setFormMode("edit");
    const loaded = await fetchData("Memuat data form permohonan izin lahan...");
    if (loaded) setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedData(record);
    setDeleteOpen(true);
  };

  const handleSave = async (payload) => {
    setLoadingMessage("Menyimpan permohonan izin lahan...");
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedData?.land_permit_application_id
          ? axios.put(
              `/api/land-permit-applications/${selectedData.land_permit_application_id}`,
              payload,
            )
          : axios.post("/api/land-permit-applications", payload);

      const response = await request;
      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Permohonan izin lahan berhasil disimpan.",
        );
        setFormOpen(false);
        setSelectedData(null);
        await fetchData("Memuat ulang data permohonan izin lahan...");
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyimpan permohonan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan permohonan izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handleDelete = async () => {
    if (!selectedData?.land_permit_application_id) return;

    setLoadingMessage("Menghapus permohonan izin lahan...");
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/land-permit-applications/${selectedData.land_permit_application_id}`,
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Permohonan izin lahan berhasil dihapus.",
        );
        setDeleteOpen(false);
        setSelectedData(null);
        await fetchData("Memuat ulang data permohonan izin lahan...");
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menghapus permohonan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menghapus permohonan izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: printData?.tenant_name
      ? `Surat Pernyataan Izin Lahan - ${printData.tenant_name}`
      : "Surat Pernyataan Izin Lahan",
    pageStyle: `
      @page {
        size: auto portrait;
        margin: 8mm 10mm;
      }

      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          min-width: 0 !important;
          width: auto !important;
          background: #fff !important;
          color: #000 !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .land-permit-statement {
          width: 100% !important;
          max-width: none !important;
          min-height: 0 !important;
          box-shadow: none !important;
          break-after: auto;
        }
      }
    `,
    onAfterPrint: () => setTimeout(() => setPrintData(null), 300),
    onPrintError: () => {
      setPrintData(null);
      showSnackbar("Dokumen izin lahan gagal dicetak.", "error");
    },
  });

  useEffect(() => {
    if (!printData) return;

    const timeout = setTimeout(() => {
      if (printRef.current) handlePrintAction();
    }, 250);

    return () => clearTimeout(timeout);
  }, [handlePrintAction, printData]);

  const columns = useMemo(
    () =>
      getLandPermitApplicationColumns({
        data: applications,
        theme,
        actionColumnWidth: ACTION_COLUMN_WIDTH,
        isMobile,
        onEdit: openEditModal,
        onDelete: openDeleteModal,
        onApproval: (record) => {
          setSelectedData(record);
          setApprovalOpen(true);
        },
        onDetail: (record) => {
          setSelectedData(record);
          setDetailOpen(true);
        },
        onPrint: (record) => setPrintData(record),
      }),
    [applications, isMobile, theme],
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2, lg: 2.25 },
        transition: "background-color 0.2s ease",
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          eyebrow="Transaksi"
          breadcrumbs={[
            { label: "Transaksi", icon: "healthicons:money-bag" },
            {
              label: "Permohonan Izin Lahan",
              icon: "solar:document-add-bold-duotone",
            },
          ]}
          title="Permohonan Izin Lahan"
          description="Kelola permohonan izin lahan, identitas pedagang, lokasi, lahan, masa izin, dan progress persetujuan."
          icon="solar:document-add-bold-duotone"
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:add-circle-bold-duotone" />}
              onClick={openCreateModal}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 700,
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 6px 14px rgba(255, 152, 0, 0.18)"
                    : "0 6px 14px rgba(230, 9, 9, 0.16)",
              }}
            >
              Tambah Permohonan
            </Button>
          }
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {stats.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Permohonan Izin Lahan"
          description={`${filteredApplications.length} dari ${applications.length} permohonan ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari pemohon, NIK, lokasi, sektor, lahan, status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey="land_permit_application_id"
            columns={columns}
            dataSource={filteredApplications}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={setPageSize}
            scroll={{ x: TABLE_SCROLL_WIDTH, y: 430 }}
            fixedActionColumn={{
              className: "land-permit-action-column",
              buttonsClassName: "land-permit-action-buttons",
              buttonsOffsetX: 6,
              width: ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <LandPermitApplicationFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedData}
        identities={identities}
        locations={locations}
        sectors={sectors}
        stalls={stalls}
        applications={applications}
        loading={loading}
        onClose={() => !loading && setFormOpen(false)}
        onSubmit={handleSave}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Permohonan"
        titleDescription="Permohonan yang sudah disetujui tidak dapat dihapus."
        description="Permohonan izin lahan yang dihapus tidak dapat diproses lagi. Anda yakin ingin menghapus permohonan"
        highlight={selectedData?.tenant_name}
        confirmLabel="Hapus Permohonan"
        loading={loading}
        loadingLabel="Menghapus..."
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      <ApprovalTrackingModal
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        selectedData={selectedData}
        variant="landPermit"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedData}
      />

      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />

      <Box sx={{ display: "none" }}>
        {printData && (
          <SuratPernyataanIzinLahan ref={printRef} data={printData} />
        )}
      </Box>
    </Box>
  );
}
