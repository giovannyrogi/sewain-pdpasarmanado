"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import { useUser } from "@/app/utils/useUser";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import {
  TENANT_APPROVAL_ACTION_COLUMN_WIDTH,
  TENANT_APPROVAL_PAGE_SIZE_OPTIONS,
  TENANT_APPROVAL_TABLE_SCROLL_WIDTH,
  buildTenantApprovalStats,
  createTenantApprovalColumns,
  filterTenantApprovals,
} from "./TenantApprovalTableColumns";

const DEFAULT_LOADING_MESSAGE = "Loading...";

const PAGE_BREADCRUMBS = [
  {
    label: "Transactions",
    value: "transactions",
    path: "#",
    icon: "healthicons:money-bag",
  },
  {
    label: "Tenant Approval",
    value: "tenant-approval",
    path: "/tenant-approval",
    icon: "carbon:document-set",
  },
];

const TenantApproval = () => {
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
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [
    openTenantApprovalInformationModal,
    setOpenTenantApprovalInformationModal,
  ] = useState(false);
  const [openTenantRejectModal, setOpenTenantRejectModal] = useState(false);
  const [isTenantApprovalSubmitting, setIsTenantApprovalSubmitting] =
    useState(false);
  const [handledNotificationTarget, setHandledNotificationTarget] =
    useState(null);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const hideGlobalNotificationLoading = () => {
    window.dispatchEvent(new Event("sewain:global-loading-hide"));
  };

  const resetNotificationFeedback = () => {
    setSnackbar((current) => ({ ...current, open: false, message: "" }));
  };

  const clearNotificationRouteState = () => {
    if (typeof window === "undefined") return;

    window.sessionStorage.removeItem("sewain:tenant-approval-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") ||
      params.has("tenant_application_id") ||
      params.has("deleted");

    /**
     * Parameter notifikasi hanya dipakai sebagai trigger pembuka modal. Setelah
     * target diproses, URL dibersihkan agar klik notifikasi berikutnya tidak
     * membaca state lama dari browser.
     */
    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataApprovals = async ({ showLoading = true } = {}) => {
    if (!user) return;

    if (showLoading) {
      setLoadingMessage("Mengambil data approval...");
      setLoading(true);
    }

    try {
      const response = await axios.get("/api/tenant-approval/by-role", {
        params: { role_id: user.role_id },
      });

      if (response.data?.success) {
        setApprovalList(response.data.data || []);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal mengambil data tenant approval.",
        "error",
      );
    } catch (error) {
      console.error("Error fetch tenant approval:", error);
      showSnackbar("Gagal mengambil data tenant approval.", "error");
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
      "sewain:tenant-approval-notification-open",
      handleNotificationOpenSignal,
    );

    return () => {
      window.removeEventListener(
        "sewain:tenant-approval-notification-open",
        handleNotificationOpenSignal,
      );
    };
  }, []);

  useEffect(() => {
    const getNotificationTarget = () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      const storageValue = window.sessionStorage.getItem(
        "sewain:tenant-approval-target",
      );

      if (storageValue) {
        try {
          const parsed = JSON.parse(storageValue);
          return {
            openMode: parsed.openMode || "approval",
            tenantApplicationId: Number(parsed.tenantApplicationId),
            deletedFromNotification: Boolean(parsed.deleted),
            requestedAt: parsed.requestedAt,
          };
        } catch {
          window.sessionStorage.removeItem("sewain:tenant-approval-target");
        }
      }

      return {
        openMode: params.get("open"),
        tenantApplicationId: Number(params.get("tenant_application_id")),
        deletedFromNotification: params.get("deleted") === "1",
        requestedAt: 0,
      };
    };

    const target = getNotificationTarget();
    const openMode = target?.openMode;
    const tenantApplicationId = target?.tenantApplicationId;
    const deletedFromNotification = target?.deletedFromNotification;
    const targetKey = `${tenantApplicationId}-${openMode}-${deletedFromNotification}-${target?.requestedAt || 0}`;

    if (
      !["approval", "progress"].includes(openMode) ||
      !tenantApplicationId ||
      !user ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openApprovalFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan data permohonan...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:tenant-approval-target");

        /**
         * Notifikasi data yang sudah dihapus tidak bisa membuka modal karena
         * record utamanya tidak tersedia lagi. Feedback dibuat eksplisit agar
         * user tahu bahwa sistem bukan gagal membuka modal.
         */
        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSelectedData(null);
          setOpenApprovalModal(false);
          setOpenTenantApprovalInformationModal(false);
          showSnackbar(
            "Data permohonan ini sudah dihapus, sehingga detail approval tidak dapat ditampilkan.",
            "error",
          );
          return;
        }

        /**
         * Klik dari notifikasi selalu mengambil data terbaru. Ini mencegah modal
         * memakai status lama dari state browser, misalnya setelah permohonan
         * ditolak lalu diperbarui kembali oleh Admin Kontrak.
         */
        const response = await axios.get(
          "/api/tenant-approval/by-tenant-application-id",
          { params: { tenant_application_id: tenantApplicationId } },
        );

        const approvalRows = response.data?.data || [];
        const selectedApproval =
          approvalRows.find((item) => Number(item.role_id) === Number(user.role_id)) ||
          approvalRows.find((item) => item.status === "proses") ||
          approvalRows[0];

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (selectedApproval) {
          setApprovalList((currentList) =>
            currentList.map((item) => {
              const freshItem = approvalRows.find(
                (approval) => Number(approval.id) === Number(item.id),
              );
              return freshItem || item;
            }),
          );
          resetNotificationFeedback();
          setSelectedData(selectedApproval);

          if (openMode === "progress") {
            setOpenApprovalModal(true);
          } else {
            setOpenTenantApprovalInformationModal(true);
          }
          return;
        }

        showSnackbar(
          "Data permohonan tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
          "error",
        );
      } catch (error) {
        console.error("Error open approval from notification:", error);
        showSnackbar("Gagal menampilkan data permohonan dari notifikasi.", "error");
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage(DEFAULT_LOADING_MESSAGE);
        hideGlobalNotificationLoading();
      }
    };

    openApprovalFromNotification();
  }, [handledNotificationTarget, notificationOpenSignal, user]);

  const handleOpenTenantDetail = (record) => {
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleOpenProgress = (record) => {
    setSelectedData(record);
    setOpenApprovalModal(true);
  };

  const handleReject = (record) => {
    setSelectedData(record);
    setOpenTenantRejectModal(true);
  };

  /**
   * Modal detail tetap reusable; halaman ini yang mengatur endpoint approval.
   * Backend memakai user dari session, jadi frontend tidak mengirim approver_id.
   */
  const handleApproveTenantApplication = async () => {
    setLoading(true);
    setLoadingMessage("Memproses approval...");
    setIsTenantApprovalSubmitting(true);

    try {
      const response = await axios.put(`/api/tenant-approval/${selectedData?.id}`, {
        tenant_application_id: selectedData?.tenant_application_id,
        status: "approved",
      });

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Approval permohonan sewa berhasil diproses.",
          "success",
        );
        await getDataApprovals({ showLoading: false });
        setOpenTenantApprovalInformationModal(false);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyetujui permohonan sewa.",
        "error",
      );
    } catch (error) {
      console.error("Error approving tenant application:", error);
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menyetujui permohonan sewa.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
      setIsTenantApprovalSubmitting(false);
    }
  };

  const handleRejectTenantApplication = async (notes) => {
    setLoading(true);
    setLoadingMessage("Memproses penolakan...");

    try {
      const response = await axios.put(
        `/api/tenant-approval/tenant-rejected/${selectedData?.id}`,
        {
          notes,
          status: "rejected",
          tenant_application_id: selectedData?.tenant_application_id,
        },
      );

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Penolakan permohonan sewa berhasil diproses.",
          "success",
        );
        await getDataApprovals({ showLoading: false });
        setOpenTenantRejectModal(false);
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menolak permohonan sewa.",
        "error",
      );
    } catch (error) {
      console.error("Error rejecting tenant approval:", error);
      showSnackbar(
        error?.response?.data?.message || "Gagal menolak permohonan sewa.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage(DEFAULT_LOADING_MESSAGE);
    }
  };

  const filteredData = useMemo(
    () => filterTenantApprovals(approvalList, searchText),
    [approvalList, searchText],
  );

  const stats = useMemo(
    () => buildTenantApprovalStats(approvalList, theme, user),
    [approvalList, theme, user],
  );

  const columns = useMemo(
    () =>
      createTenantApprovalColumns({
        data: approvalList,
        user,
        theme,
        isMobile,
        onDetail: handleOpenTenantDetail,
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
        title="Tenant Approval"
        description="Tinjau permohonan sewa sesuai tahapan role Anda, lalu proses persetujuan atau penolakan dengan catatan yang jelas."
        icon="carbon:document-set"
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
        title="Daftar Approval"
        description={`${filteredData.length} dari ${approvalList.length} approval ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari pemohon, dokumen, lokasi, ruangan"
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey="id"
          columns={columns}
          dataSource={filteredData}
          pageSize={pageSize}
          pageSizeOptions={TENANT_APPROVAL_PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: TENANT_APPROVAL_TABLE_SCROLL_WIDTH, y: 430 }}
          fixedActionColumn={{
            className: "tenant-approval-action-column",
            buttonsClassName: "tenant-approval-action-buttons",
            width: TENANT_APPROVAL_ACTION_COLUMN_WIDTH,
            paddingX: 12,
          }}
        />
      </DataTableShell>

      <TenantLeaseDetailModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        canApprove
        approving={isTenantApprovalSubmitting}
        onApprove={handleApproveTenantApplication}
      />

      <RejectReasonModal
        open={openTenantRejectModal}
        onClose={() => setOpenTenantRejectModal(false)}
        title="Tolak Permohonan Sewa"
        description="Berikan alasan singkat agar keputusan penolakan tercatat jelas."
        confirmLabel="Tolak Permohonan"
        loading={loading}
        onSubmit={handleRejectTenantApplication}
      />

      <ApprovalTrackingModal
        open={openApprovalModal}
        onClose={() => setOpenApprovalModal(false)}
        selectedData={selectedData}
        variant="tenant"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
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
};

export default TenantApproval;
