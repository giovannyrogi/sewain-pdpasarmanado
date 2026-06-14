"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import AppModal from "@/app/components/modals/AppModal";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import { useUser } from "@/app/utils/useUser";
import moment from "moment";
import {
  createRoomSyncItemColumns,
  createRoomSyncLogColumns,
  formatSyncDateTime,
  getRunSourceLabel,
  getRunStatusLabel,
} from "./RoomSyncLogsTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Laporan",
    value: "reports",
    path: "#",
    icon: "solar:chart-square-bold-duotone",
  },
  {
    label: "Log Sinkron Ruangan",
    value: "room-sync-logs",
    path: "/room-sync-logs",
    icon: "solar:refresh-circle-bold-duotone",
  },
];

const getRunNumber = (value) => Number(value || 0);

const getLatestRunText = (rows) => {
  if (!rows.length) return "Belum sinkron";
  return rows[0].started_at
    ? moment(rows[0].started_at).format("DD MMM, HH:mm")
    : "-";
};

function RunDetailModal({ open, run, items, loading, onClose }) {
  const theme = useTheme();
  const itemColumns = useMemo(() => createRoomSyncItemColumns(), []);

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title="Detail Sinkronisasi Ruangan"
      description="Rincian ruangan yang dibuat tersedia kembali atau dilewati dalam satu proses sinkronisasi."
      icon="solar:document-text-bold-duotone"
      width={1120}
      maxHeight="88vh"
    >
      {loading ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography sx={{ fontWeight: 700 }}>
            Mengambil detail log...
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 1.5,
            }}
          >
            {[
              ["Sumber", getRunSourceLabel(run?.trigger_source)],
              ["Status", getRunStatusLabel(run?.status)],
              ["Mulai", formatSyncDateTime(run?.started_at)],
              ["Selesai", formatSyncDateTime(run?.finished_at)],
              [
                "Eksekutor",
                run?.trigger_source === "cron"
                  ? "Sistem Cron"
                  : run?.executed_by_name || "-",
              ],
              ["Dicek", `${getRunNumber(run?.total_checked)} ruangan`],
              [
                "Tersedia Kembali",
                `${getRunNumber(run?.total_released)} ruangan`,
              ],
              ["Dilewati", `${getRunNumber(run?.total_skipped)} ruangan`],
            ].map(([label, value]) => (
              <Box
                key={label}
                sx={{
                  border: `1px solid ${theme.ui.dashboardCardBorder}`,
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.035)"
                      : "rgba(17,24,39,0.03)",
                }}
              >
                <Typography
                  sx={{
                    color: theme.ui.mutedText,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </Typography>
                <Typography sx={{ mt: 0.5, fontWeight: 700, fontSize: 12 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          {run?.error_message && (
            <Box
              sx={{
                border: `1px solid ${theme.palette.error.main}`,
                borderRadius: 2,
                p: 1.5,
                color: theme.palette.error.main,
                fontWeight: 700,
              }}
            >
              {run.error_message}
            </Box>
          )}

          <Divider />

          <ReusableAntTable
            rowKey="id"
            columns={itemColumns}
            dataSource={items}
            pageSize={5}
            scroll={{ x: 1500, y: 360 }}
          />
        </Stack>
      )}
    </AppModal>
  );
}

/**
 * Menu audit superadmin untuk menjalankan dan memantau sinkronisasi room.
 * Proses sync hanya dipicu dari halaman ini atau endpoint cron, sehingga
 * perubahan status ruangan tidak terjadi diam-diam dari halaman operasional.
 */
export default function RoomSyncLogsPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchLogs = async ({ showLoading = true } = {}) => {
    if (!user) return;

    if (showLoading) {
      setLoadingMessage("Mengambil log sinkronisasi ruangan...");
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/room-sync-logs", {
        params: { limit: 100 },
      });
      setRows(response.data?.data || []);
    } catch (error) {
      console.error("Gagal mengambil log sinkronisasi ruangan:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil log sinkronisasi ruangan.",
        "error",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
        setLoadingMessage(DEFAULT_LOADING_MESSAGE);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  const runManualSync = async () => {
    setLoadingMessage("Menyinkronkan status ruangan...");
    setLoading(true);

    try {
      const response = await axios.post("/api/room-sync-manual");
      const result = response.data;
      showSnackbar(
        result?.alreadyRunning
          ? "Sinkronisasi lain sedang berjalan."
          : `Sinkronisasi selesai. ${result?.totalReleased || 0} ruangan tersedia kembali.`,
        result?.alreadyRunning ? "warning" : "success",
      );
      await fetchLogs({ showLoading: false });
    } catch (error) {
      console.error("Gagal menjalankan sinkronisasi manual:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal menjalankan sinkronisasi ruangan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const openDetail = async (run) => {
    setSelectedRun(run);
    setSelectedItems([]);
    setDetailLoading(true);

    try {
      const response = await axios.get(`/api/room-sync-logs/${run.id}`);
      setSelectedRun(response.data?.data?.run || run);
      setSelectedItems(response.data?.data?.items || []);
    } catch (error) {
      console.error("Gagal mengambil detail log sinkronisasi:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil detail log sinkronisasi.",
        "error",
      );
      setSelectedRun(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteLog = async () => {
    if (!deleteTarget?.id) return;

    setDeleteLoading(true);

    try {
      await axios.delete(`/api/room-sync-logs/${deleteTarget.id}`);
      showSnackbar("Log sinkronisasi berhasil dihapus.");
      setDeleteTarget(null);
      await fetchLogs({ showLoading: false });
    } catch (error) {
      console.error("Gagal menghapus log sinkronisasi:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal menghapus log sinkronisasi.",
        "error",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredRows = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) =>
      [
        row.id,
        getRunSourceLabel(row.trigger_source),
        getRunStatusLabel(row.status),
        row.executed_by_name,
        row.error_message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [rows, searchText]);

  const summary = useMemo(
    () => ({
      totalRuns: rows.length,
      totalReleased: rows.reduce(
        (total, row) => total + getRunNumber(row.total_released),
        0,
      ),
      failedRuns: rows.filter((row) => row.status === "failed").length,
      latestRun: getLatestRunText(rows),
    }),
    [rows],
  );

  const columns = useMemo(
    () =>
      createRoomSyncLogColumns({
        onViewDetail: openDetail,
        onDelete: setDeleteTarget,
      }),
    [],
  );

  if (user && Number(user.role_id) !== 1) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100%",
          p: { xs: 1.5, sm: 2 },
        }}
      >
        <Stack spacing={2}>
          <PageHeader
            breadcrumbs={PAGE_BREADCRUMBS}
            title="Log Sinkron Ruangan"
            description="Halaman audit sinkronisasi status ruangan hanya tersedia untuk superadmin."
          />
          <Box
            sx={{
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              borderRadius: 3,
              bgcolor: theme.ui.dashboardCardBg,
              boxShadow: theme.ui.dashboardCardShadow,
              p: 3,
            }}
          >
            <Typography sx={{ fontWeight: 700 }}>
              Anda tidak memiliki akses ke halaman ini.
            </Typography>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        p: { xs: 1.5, sm: 2 },
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <PageHeader
        breadcrumbs={PAGE_BREADCRUMBS}
        title="Log Sinkron Ruangan"
        description="Pantau audit perubahan status ruangan menjadi tersedia kembali dari kontrak selesai atau termination final."
        action={
          <Button
            variant="contained"
            startIcon={<Icon icon="solar:refresh-circle-bold-duotone" />}
            onClick={runManualSync}
            sx={{
              fontFamily: "Poppins",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.25,
              py: 1.1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            Sinkronkan Sekarang
          </Button>
        }
        actionSx={{ width: { xs: "100%", sm: "auto" } }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <SummaryStatCard
          label="Total Run"
          value={summary.totalRuns}
          icon="solar:document-text-bold-duotone"
          color={theme.palette.primary.main}
        />
        <SummaryStatCard
          label="Ruangan Tersedia Kembali"
          value={summary.totalReleased}
          icon="solar:check-circle-bold-duotone"
          color={theme.palette.success.main}
        />
        <SummaryStatCard
          label="Run Gagal"
          value={summary.failedRuns}
          icon="solar:close-circle-bold-duotone"
          color={theme.palette.error.main}
        />
        <SummaryStatCard
          label="Sync Terakhir"
          value={summary.latestRun}
          icon="solar:clock-circle-bold-duotone"
          color={theme.palette.info.main}
          valueSx={{
            fontSize: { xs: 20, sm: 22 },
            lineHeight: 1.25,
            overflowWrap: "anywhere",
          }}
        />
      </Box>

      <DataTableShell
        title="Riwayat Sinkronisasi"
        description={`${filteredRows.length} dari ${rows.length} log ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari status, sumber, atau eksekutor"
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey="id"
          columns={columns}
          dataSource={filteredRows}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          scroll={{ x: 1800, y: isMobile ? 430 : 520 }}
          fixedActionColumn={{
            className: "room-sync-actions-cell",
            buttonsClassName: "room-sync-actions",
            width: 132,
            paddingX: 12,
          }}
        />
      </DataTableShell>

      <RunDetailModal
        open={Boolean(selectedRun)}
        run={selectedRun}
        items={selectedItems}
        loading={detailLoading}
        onClose={() => {
          setSelectedRun(null);
          setSelectedItems([]);
        }}
      />

      <CrudConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus Log Sinkronisasi"
        description="Log sinkronisasi dan detail ruangan pada proses ini akan dihapus permanen."
        confirmDescription="Anda yakin ingin menghapus log sinkronisasi ini?"
        highlight={formatSyncDateTime(deleteTarget?.started_at)}
        confirmLabel="Hapus Log"
        loadingLabel="Menghapus log sinkronisasi..."
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteTarget(null);
        }}
        onConfirm={deleteLog}
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
