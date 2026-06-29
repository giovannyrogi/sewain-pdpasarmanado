"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import LandPermitTerminationFormModal from "./LandPermitTerminationFormModal";
import {
  LAND_TERMINATION_ACTION_COLUMN_WIDTH,
  LAND_TERMINATION_PAGE_SIZE_OPTIONS,
  LAND_TERMINATION_TABLE_SCROLL_WIDTH,
  buildLandPermitTerminationStats,
  createLandPermitTerminationColumns,
  filterLandPermitTerminations,
} from "./LandPermitTerminationsTableColumns";

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

export default function LandPermitTerminationsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [terminations, setTerminations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (payload, severity = "success") => {
    if (typeof payload === "object") {
      setSnackbar({
        open: true,
        message: payload.message || "",
        severity: payload.severity || severity,
      });
      return;
    }

    setSnackbar({ open: true, message: payload, severity });
  };

  const fetchTerminations = useCallback(
    async (message = "Memuat data non-aktif izin lahan...") => {
      setLoadingMessage(message);
      setLoading(true);
      try {
        const response = await axios.get("/api/land-permit-terminations");
        if (response.data?.success) {
          setTerminations(response.data.data || []);
          return true;
        }
        showSnackbar(
          response.data?.message || "Gagal mengambil data non-aktif izin lahan.",
          "error",
        );
        return false;
      } catch (error) {
        showSnackbar(
          error?.response?.data?.message ||
            "Terjadi kesalahan saat mengambil data non-aktif izin lahan.",
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
    fetchTerminations();
  }, [fetchTerminations]);

  const filteredTerminations = useMemo(
    () => filterLandPermitTerminations(terminations, searchText),
    [searchText, terminations],
  );

  const stats = useMemo(
    () => buildLandPermitTerminationStats(terminations, theme),
    [terminations, theme],
  );

  const columns = useMemo(
    () =>
      createLandPermitTerminationColumns({
        theme,
        isMobile,
        onViewDetail: (record) => {
          setSelectedData(record);
          setDetailOpen(true);
        },
        onViewProgress: (record) => {
          setSelectedData(record);
          setProgressOpen(true);
        },
        onCancel: (record) => {
          setSelectedData(record);
          setCancelOpen(true);
        },
      }),
    [isMobile, theme],
  );

  const handleCancelTermination = async () => {
    if (!selectedData?.land_permit_termination_id) return;

    setLoadingMessage("Membatalkan pengajuan non-aktif izin lahan...");
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/land-permit-terminations/${selectedData.land_permit_termination_id}`,
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message ||
            "Pengajuan non-aktif izin lahan berhasil dibatalkan.",
        );
        setCancelOpen(false);
        setSelectedData(null);
        await fetchTerminations("Memuat ulang data non-aktif izin lahan...");
        return;
      }

      showSnackbar(
        response.data?.message ||
          "Gagal membatalkan pengajuan non-aktif izin lahan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat membatalkan pengajuan non-aktif izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

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
              label: "Non-Aktif Izin Lahan",
              icon: "solar:lock-keyhole-minimalistic-bold-duotone",
            },
          ]}
          title="Non-Aktif Izin Lahan"
          description="Kelola permintaan non-aktif izin lahan aktif sebelum lahan dapat digunakan kembali."
          icon="solar:lock-keyhole-minimalistic-bold-duotone"
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:add-circle-bold-duotone" />}
              onClick={() => setFormOpen(true)}
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
              Ajukan Nonaktif
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
          title="Daftar Non-Aktif Izin Lahan"
          description={`${filteredTerminations.length} dari ${terminations.length} pengajuan ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari pemohon, NIK, lokasi, sektor, lahan, status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey="land_permit_termination_id"
            columns={columns}
            dataSource={filteredTerminations}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={LAND_TERMINATION_PAGE_SIZE_OPTIONS}
            onPageSizeChange={setPageSize}
            scroll={{ x: LAND_TERMINATION_TABLE_SCROLL_WIDTH, y: 430 }}
            fixedActionColumn={{
              className: "land-terminations-action-column",
              buttonsClassName: "land-terminations-action-buttons",
              buttonsOffsetX: 6,
              width: LAND_TERMINATION_ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <LandPermitTerminationFormModal
        open={formOpen}
        loading={loading}
        onClose={() => setFormOpen(false)}
        onSubmitSuccess={() =>
          fetchTerminations("Memuat ulang data non-aktif izin lahan...")
        }
        onLoadingChange={setLoading}
        onLoadingMessageChange={setLoadingMessage}
        onNotify={showSnackbar}
      />

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        selectedData={selectedData}
      />

      <ApprovalTrackingModal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        selectedData={selectedData}
        variant="landPermitTermination"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />

      <CrudConfirmModal
        open={cancelOpen}
        title="Batalkan Non-Aktif"
        titleDescription="Hanya pengajuan yang ditolak yang dapat dibatalkan."
        description="Pengajuan non-aktif izin lahan akan dihapus dari daftar proses."
        highlight={selectedData?.tenant_name}
        confirmLabel="Batalkan Pengajuan"
        loading={loading}
        loadingLabel="Membatalkan..."
        onClose={() => !loading && setCancelOpen(false)}
        onConfirm={handleCancelTermination}
      />

      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
