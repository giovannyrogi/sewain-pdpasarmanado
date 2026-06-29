"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import axios from "axios";
import { useUser } from "@/app/utils/useUser";
import PageHeader from "@/app/components/page-header/PageHeader";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import LandPermitApplicantDetailModal from "@/app/(protected)/land-permit-applications/LandPermitApplicantDetailModal";
import {
  ACTION_COLUMN_WIDTH,
  PAGE_SIZE_OPTIONS,
  TABLE_SCROLL_WIDTH,
  buildLandPermitTerminationApprovalStats,
  createLandPermitTerminationApprovalColumns,
  filterLandPermitTerminationApprovals,
  isLandPermitTerminationWaitingForUser,
} from "./LandPermitTerminationApprovalTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

export default function LandPermitTerminationApprovalPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [approvals, setApprovals] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    DEFAULT_LOADING_MESSAGE,
  );
  const [selectedData, setSelectedData] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Mengambil antrean approval sesuai role login. Role approver hanya melihat
   * tahapnya sendiri, sementara superadmin memakai endpoint yang sama untuk
   * monitoring tanpa mem-bypass validasi approval backend.
   */
  const fetchApprovals = async ({ showLoading = true } = {}) => {
    if (!user?.role_id) return;

    if (showLoading) {
      setLoadingMessage("Mengambil approval non-aktif izin lahan...");
      setLoading(true);
    }

    try {
      const response = await axios.get(
        "/api/land-permit-termination-approval/by-role",
        { params: { role_id: user.role_id } },
      );

      if (response.data?.success) {
        setApprovals(response.data.data || []);
        return;
      }

      showSnackbar(
        response.data?.message ||
          "Gagal mengambil approval non-aktif izin lahan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat mengambil approval non-aktif izin lahan.",
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
    fetchApprovals();
  }, [user?.role_id]);

  useEffect(() => {
    if (typeof window === "undefined" || approvals.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const terminationId = Number(params.get("land_permit_termination_id"));
    const openMode = params.get("open");
    if (!terminationId || !["approval", "detail", "progress"].includes(openMode)) {
      return;
    }

    const target = approvals.find(
      (item) => Number(item.land_permit_termination_id) === terminationId,
    );
    if (!target) return;

    setSelectedData(target);
    if (openMode === "progress") {
      setProgressOpen(true);
    } else {
      setDetailOpen(true);
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [approvals]);

  const filteredData = useMemo(
    () => filterLandPermitTerminationApprovals(approvals, searchText),
    [approvals, searchText],
  );

  const stats = useMemo(
    () => buildLandPermitTerminationApprovalStats(approvals, theme, user),
    [approvals, theme, user],
  );

  const openDetail = (record) => {
    setSelectedData(record);
    setDetailOpen(true);
  };

  const openProgress = (record) => {
    setSelectedData(record);
    setProgressOpen(true);
  };

  const openReject = (record) => {
    setSelectedData(record);
    setRejectOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedData?.id || !selectedData?.land_permit_termination_id) return;

    setApproving(true);
    setLoading(true);
    setLoadingMessage("Memproses approval non-aktif izin lahan...");
    try {
      const response = await axios.put(
        `/api/land-permit-termination-approval/${selectedData.id}`,
        {
          land_permit_termination_id:
            selectedData.land_permit_termination_id,
          status: "approved",
        },
      );

      if (response.data?.success) {
        showSnackbar(response.data.message || "Approval berhasil diproses.");
        setDetailOpen(false);
        setSelectedData(null);
        await fetchApprovals({ showLoading: false });
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal memproses approval.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat memproses approval.",
        "error",
      );
    } finally {
      setApproving(false);
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const handleReject = async (notes) => {
    if (!selectedData?.id || !selectedData?.land_permit_termination_id) return;

    setLoading(true);
    setLoadingMessage("Memproses penolakan non-aktif izin lahan...");
    try {
      const response = await axios.put(
        `/api/land-permit-termination-approval/rejected/${selectedData.id}`,
        {
          land_permit_termination_id:
            selectedData.land_permit_termination_id,
          status: "rejected",
          notes,
        },
      );

      if (response.data?.success) {
        showSnackbar(response.data.message || "Pengajuan berhasil ditolak.");
        setRejectOpen(false);
        setSelectedData(null);
        await fetchApprovals({ showLoading: false });
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menolak pengajuan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menolak pengajuan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const columns = useMemo(
    () =>
      createLandPermitTerminationApprovalColumns({
        user,
        theme,
        isMobile,
        onDetail: openDetail,
        onProgress: openProgress,
        onReject: openReject,
      }),
    [isMobile, theme, user],
  );

  const canApprove =
    selectedData && isLandPermitTerminationWaitingForUser(selectedData, user);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2, lg: 2.25 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 1.5, lg: 2 },
      }}
    >
      <PageHeader
        breadcrumbs={[
          {
            label: "Transaksi",
            value: "transactions",
            path: "#",
            icon: "healthicons:money-bag",
          },
          {
            label: "Persetujuan Non-Aktif Izin Lahan",
            value: "land-permit-termination-approval",
            path: "/land-permit-termination-approval",
            icon: "solar:lock-keyhole-minimalistic-bold-duotone",
          },
        ]}
        title="Persetujuan Non-Aktif Izin Lahan"
        description="Tinjau permintaan non-aktif izin lahan sesuai tahapan role Anda, lalu proses approval atau penolakan dengan catatan yang jelas."
        icon="solar:lock-keyhole-minimalistic-bold-duotone"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1.25, sm: 1.5 },
        }}
      >
        {stats.map((item) => (
          <SummaryStatCard key={item.label} {...item} />
        ))}
      </Box>

      <DataTableShell
        title="Daftar Persetujuan Non-Aktif Izin Lahan"
        description={`${filteredData.length} dari ${approvals.length} approval ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari pemohon, NIK, lokasi, sektor, lahan, alasan..."
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: TABLE_SCROLL_WIDTH, y: 430 }}
          fixedActionColumn={{
            className: "land-permit-termination-approval-action-column",
            buttonsClassName:
              "land-permit-termination-approval-action-buttons",
            buttonsOffsetX: 6,
            width: ACTION_COLUMN_WIDTH,
            paddingX: 16,
          }}
        />
      </DataTableShell>

      <LandPermitApplicantDetailModal
        open={detailOpen}
        onClose={() => !approving && setDetailOpen(false)}
        selectedData={selectedData}
        canApprove={canApprove}
        approving={approving}
        onApprove={handleApprove}
      />

      <RejectReasonModal
        open={rejectOpen}
        onClose={() => !loading && setRejectOpen(false)}
        title="Tolak Permintaan Non-Aktif Izin Lahan"
        description="Catat alasan penolakan agar riwayat keputusan non-aktif izin lahan jelas."
        confirmLabel="Tolak Permintaan"
        maxLength={250}
        loading={loading}
        onSubmit={handleReject}
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
