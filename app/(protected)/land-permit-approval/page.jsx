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
  buildLandPermitApprovalStats,
  createLandPermitApprovalColumns,
  filterLandPermitApprovals,
  isLandPermitWaitingForUser,
  PAGE_SIZE_OPTIONS,
  TABLE_SCROLL_WIDTH,
} from "./LandPermitApprovalTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

export default function LandPermitApprovalPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [approvals, setApprovals] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
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

  const fetchApprovals = async ({ showLoading = true } = {}) => {
    if (!user?.role_id) return;

    if (showLoading) {
      setLoadingMessage("Mengambil data approval izin lahan...");
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/land-permit-approval/by-role", {
        params: { role_id: user.role_id },
      });

      if (response.data?.success) {
        setApprovals(response.data.data || []);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal mengambil approval izin lahan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat mengambil approval izin lahan.",
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
    const applicationId = Number(params.get("land_permit_application_id"));
    const openMode = params.get("open");
    if (!applicationId || !["approval", "progress"].includes(openMode)) return;

    const target = approvals.find(
      (item) => Number(item.land_permit_application_id) === applicationId,
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
    () => filterLandPermitApprovals(approvals, searchText),
    [approvals, searchText],
  );

  const stats = useMemo(
    () => buildLandPermitApprovalStats(approvals, theme, user),
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
    if (!selectedData?.id || !selectedData?.land_permit_application_id) return;

    setApproving(true);
    setLoading(true);
    setLoadingMessage("Memproses approval izin lahan...");
    try {
      const response = await axios.put(
        `/api/land-permit-approval/${selectedData.id}`,
        {
          land_permit_application_id: selectedData.land_permit_application_id,
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
    if (!selectedData?.id || !selectedData?.land_permit_application_id) return;

    setLoading(true);
    setLoadingMessage("Memproses penolakan izin lahan...");
    try {
      const response = await axios.put(
        `/api/land-permit-approval/rejected/${selectedData.id}`,
        {
          land_permit_application_id: selectedData.land_permit_application_id,
          status: "rejected",
          notes,
        },
      );

      if (response.data?.success) {
        showSnackbar(response.data.message || "Permohonan berhasil ditolak.");
        setRejectOpen(false);
        setSelectedData(null);
        await fetchApprovals({ showLoading: false });
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menolak permohonan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menolak permohonan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const columns = useMemo(
    () =>
      createLandPermitApprovalColumns({
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
    selectedData && isLandPermitWaitingForUser(selectedData, user);

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
        breadcrumbs={[
          {
            label: "Transaksi",
            value: "transactions",
            path: "#",
            icon: "healthicons:money-bag",
          },
          {
            label: "Persetujuan Izin Lahan",
            value: "land-permit-approval",
            path: "/land-permit-approval",
            icon: "ph:seal-check-duotone",
          },
        ]}
        title="Persetujuan Izin Lahan"
        description="Tinjau permohonan izin lahan sesuai tahapan role Anda, lalu proses persetujuan atau penolakan."
        icon="ph:seal-check-duotone"
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {stats.map((item) => (
          <SummaryStatCard key={item.label} {...item} />
        ))}
      </Box>

      <DataTableShell
        title="Daftar Approval Izin Lahan"
        description={`${filteredData.length} dari ${approvals.length} approval ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari pemohon, NIK, lokasi, sektor, lahan, komoditas..."
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
            className: "land-permit-approval-action-column",
            buttonsClassName: "land-permit-approval-action-buttons",
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
        title="Tolak Permohonan Izin Lahan"
        description="Berikan alasan singkat agar keputusan penolakan tercatat jelas."
        confirmLabel="Tolak Permohonan"
        maxLength={250}
        loading={loading}
        onSubmit={handleReject}
      />

      <ApprovalTrackingModal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        selectedData={selectedData}
        variant="landPermit"
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
