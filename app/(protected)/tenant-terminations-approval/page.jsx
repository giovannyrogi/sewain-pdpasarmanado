"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import { useUser } from "@/app/utils/useUser";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import TerminationReasonModal from "@/app/components/modals/TerminationReasonModal";
import {
  TERMINATION_APPROVAL_ACTION_COLUMN_WIDTH,
  TERMINATION_APPROVAL_PAGE_SIZE_OPTIONS,
  TERMINATION_APPROVAL_TABLE_SCROLL_WIDTH,
  buildTerminationApprovalStats,
  createTerminationApprovalColumns,
  filterTerminationApprovals,
  isTerminationApprovalActionable,
} from "./TenantTerminationApprovalTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Transaksi",
    value: "transactions",
    path: "#",
    icon: "solar:money-bag-bold-duotone",
  },
  {
    label: "Persetujuan Non-Aktif Ruangan",
    value: "tenant-terminations-approval",
    path: "/tenant-terminations-approval",
    icon: "solar:lock-keyhole-minimalistic-bold-duotone",
  },
];

/**
 * Halaman Termination Approval berfokus pada keputusan approver.
 * Layout baru memisahkan data fetching, kolom table, dan modal agar maintenance
 * lebih mudah serta tetap konsisten dengan halaman approval lain.
 */
export default function TenantTerminationApprovalPage() {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [approvalList, setApprovalList] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(DEFAULT_LOADING_MESSAGE);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openProgressModal, setOpenProgressModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openReasonModal, setOpenReasonModal] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [handledNotificationTarget, setHandledNotificationTarget] =
    useState(null);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const hideGlobalNotificationLoading = () => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("sewain:global-loading-hide"));
  };

  const resetNotificationFeedback = () => {
    setSnackbar((current) => ({ ...current, open: false, message: "" }));
  };

  const clearNotificationRouteState = () => {
    if (typeof window === "undefined") return;

    window.sessionStorage.removeItem("sewain:tenant-termination-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") ||
      params.has("tenant_early_termination_id") ||
      params.has("deleted");

    /**
     * URL notifikasi hanya dipakai sebagai trigger. Setelah record dibuka,
     * parameter dibersihkan agar refresh halaman tidak membuka modal lama.
     */
    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataApprovals = async ({ showLoading = true } = {}) => {
    if (!user) return;

    if (showLoading) {
      setLoadingMessage("Mengambil data termination approval...");
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/tenant-termination-approval/by-role");

      if (response.data?.success) {
        setApprovalList(response.data.data || []);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal mengambil data termination approval.",
        "error",
      );
    } catch (error) {
      console.error("Error fetch termination approval:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal mengambil data termination approval.",
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
    if (user) {
      getDataApprovals();
    }
  }, [user]);

  useEffect(() => {
    const handleNotificationOpenSignal = () => {
      setNotificationOpenSignal((value) => value + 1);
    };

    window.addEventListener(
      "sewain:tenant-termination-notification-open",
      handleNotificationOpenSignal,
    );

    return () => {
      window.removeEventListener(
        "sewain:tenant-termination-notification-open",
        handleNotificationOpenSignal,
      );
    };
  }, []);

  useEffect(() => {
    const getNotificationTarget = () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      const storageValue = window.sessionStorage.getItem(
        "sewain:tenant-termination-target",
      );

      if (storageValue) {
        try {
          const parsed = JSON.parse(storageValue);
          return {
            openMode: parsed.openMode || "detail",
            terminationId: Number(parsed.tenantEarlyTerminationId),
            deletedFromNotification: Boolean(parsed.deleted),
            requestedAt: parsed.requestedAt,
          };
        } catch {
          window.sessionStorage.removeItem("sewain:tenant-termination-target");
        }
      }

      return {
        openMode: params.get("open"),
        terminationId: Number(params.get("tenant_early_termination_id")),
        deletedFromNotification: params.get("deleted") === "1",
        requestedAt: 0,
      };
    };

    const target = getNotificationTarget();
    const openMode = target?.openMode;
    const terminationId = target?.terminationId;
    const deletedFromNotification = target?.deletedFromNotification;
    const targetKey = `${terminationId}-${openMode}-${deletedFromNotification}-${
      target?.requestedAt || 0
    }`;

    if (
      !["detail", "approval", "progress"].includes(openMode) ||
      !terminationId ||
      !user ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openApprovalFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan data termination approval...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:tenant-termination-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          setSelectedData(null);
          setOpenDetailModal(false);
          setOpenProgressModal(false);
          showSnackbar(
            "Data nonaktif tenant ini sudah dihapus, sehingga detail tidak dapat ditampilkan.",
            "error",
          );
          return;
        }

        /**
         * Klik notifikasi selalu mengambil data terbaru dari backend agar modal
         * tidak memakai status stale ketika step approval sudah berpindah.
         */
        const response = await axios.get("/api/tenant-termination-approval/by-role");
        const freshApprovals = response.data?.data || [];
        setApprovalList(freshApprovals);

        const selectedApproval = freshApprovals.find(
          (item) =>
            Number(item?.tenant_early_termination_id) === Number(terminationId),
        );

        await new Promise((resolve) => setTimeout(resolve, 700));

        if (selectedApproval) {
          resetNotificationFeedback();
          setSelectedData(selectedApproval);

          if (openMode === "progress") {
            setOpenProgressModal(true);
          } else {
            setOpenDetailModal(true);
          }
          return;
        }

        showSnackbar(
          "Data termination approval tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
          "error",
        );
      } catch (error) {
        console.error("Error open termination approval from notification:", error);
        showSnackbar(
          "Gagal menampilkan termination approval dari notifikasi.",
          "error",
        );
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage(DEFAULT_LOADING_MESSAGE);
        hideGlobalNotificationLoading();
      }
    };

    openApprovalFromNotification();
  }, [handledNotificationTarget, notificationOpenSignal, user]);

  const handleOpenDetail = (record) => {
    setSelectedData(record);
    setOpenDetailModal(true);
  };

  const handleOpenProgress = (record) => {
    setSelectedData(record);
    setOpenProgressModal(true);
  };

  const handleOpenReason = (record) => {
    setSelectedData(record);
    setOpenReasonModal(true);
  };

  const handleReject = (record) => {
    setSelectedData(record);
    setOpenRejectModal(true);
  };

  /**
   * Approval terminasi dikirim tanpa approver_id dari frontend. Backend sudah
   * membaca user aktif dari session dan melakukan validasi role/step.
   */
  const handleApproveTermination = async () => {
    if (!selectedData) return;

    setLoading(true);
    setLoadingMessage("Memproses approval terminasi...");
    setIsSubmittingApproval(true);

    try {
      const response = await axios.put(
        `/api/tenant-termination-approval/${selectedData.termination_approval_id}`,
        {
          tenant_early_termination_id: selectedData.tenant_early_termination_id,
          status: "approved",
          room_id: selectedData.room_id,
          tenant_identity_id: selectedData.tenant_identity_id,
        },
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Approval terminasi berhasil diproses.",
          "success",
        );
        await getDataApprovals({ showLoading: false });
        setOpenDetailModal(false);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyetujui permintaan non-aktif.",
        "error",
      );
    } catch (error) {
      console.error("Error approving termination:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menyetujui permintaan non-aktif.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
      setIsSubmittingApproval(false);
    }
  };

  const handleRejectTermination = async (notes) => {
    if (!selectedData) return;

    setLoading(true);
    setLoadingMessage("Memproses penolakan terminasi...");

    try {
      const response = await axios.put(
        `/api/tenant-termination-approval/tenant-rejected/${selectedData.termination_approval_id}`,
        {
          notes,
          status: "rejected",
          tenant_early_termination_id: selectedData.tenant_early_termination_id,
        },
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Penolakan terminasi berhasil diproses.",
          "success",
        );
        await getDataApprovals({ showLoading: false });
        setOpenRejectModal(false);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menolak permintaan non-aktif.",
        "error",
      );
    } catch (error) {
      console.error("Error rejecting termination:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Gagal menolak permintaan non-aktif.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const filteredData = useMemo(
    () => filterTerminationApprovals(approvalList, searchText),
    [approvalList, searchText],
  );

  const stats = useMemo(
    () => buildTerminationApprovalStats(approvalList, theme, user),
    [approvalList, theme, user],
  );

  const columns = useMemo(
    () =>
      createTerminationApprovalColumns({
        data: approvalList,
        user,
        theme,
        isMobile,
        onDetail: handleOpenDetail,
        onReason: handleOpenReason,
        onProgress: handleOpenProgress,
        onReject: handleReject,
      }),
    [approvalList, user, theme, isMobile],
  );

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
        title="Persetujuan Non-Aktif Ruangan"
        description="Tinjau permintaan non-aktif kontrak tenant sesuai tahapan role Anda, lalu proses approval atau penolakan dengan catatan yang jelas."
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
          gap: { xs: 1.5, sm: 2 },
          alignItems: "stretch",
          width: "100%",
        }}
      >
        {stats.map((item) => (
          <Box key={item.label} sx={{ minWidth: 0 }}>
            <SummaryStatCard {...item} />
          </Box>
        ))}
      </Box>

      <DataTableShell
        title="Daftar Termination Approval"
        description={`${filteredData.length} dari ${approvalList.length} approval ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari pemohon, NIK, lokasi, ruangan, alasan, status"
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey="termination_approval_id"
          columns={columns}
          dataSource={filteredData}
          pageSize={pageSize}
          pageSizeOptions={TERMINATION_APPROVAL_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: TERMINATION_APPROVAL_TABLE_SCROLL_WIDTH, y: 430 }}
          fixedActionColumn={{
            className: "termination-approval-action-column",
            buttonsClassName: "termination-approval-action-buttons",
            buttonsOffsetX: 6,
            width: TERMINATION_APPROVAL_ACTION_COLUMN_WIDTH,
            paddingX: 16,
          }}
        />
      </DataTableShell>

      <TenantLeaseDetailModal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        selectedData={selectedData}
        canApprove={isTerminationApprovalActionable(selectedData, user)}
        approving={isSubmittingApproval}
        onApprove={handleApproveTermination}
        showTerminationDetail
      />

      <ApprovalTrackingModal
        open={openProgressModal}
        onClose={() => setOpenProgressModal(false)}
        selectedData={selectedData}
        variant="termination"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />

      <TerminationReasonModal
        open={openReasonModal}
        onClose={() => setOpenReasonModal(false)}
        selectedData={selectedData}
      />

      <RejectReasonModal
        open={openRejectModal}
        onClose={() => setOpenRejectModal(false)}
        title="Tolak Permintaan Non-Aktif"
        description="Catat alasan penolakan agar riwayat keputusan terminasi jelas."
        confirmLabel="Tolak Permintaan"
        loading={loading}
        onSubmit={handleRejectTermination}
      />

      <LoadingBackdrop message={loadingMessage} open={loading} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
