"use client";
import {
  Box,
  Button,
  Grid,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import { useUser } from "@/app/utils/useUser";
import TenantIdentityPreviewModal from "@/app/components/modals/TenantIdentityPreviewModal";
import TenantTerminationsModal from "./TenantTerminationsModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import { createTenantTerminationColumns } from "./TenantTerminationsTableColumns";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const TABLE_SCROLL_WIDTH = 1440;
const ACTION_COLUMN_WIDTH = 150;

const normalizeText = (value) => String(value || "").toLowerCase();

const TenantTerminations = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const { user } = useUser();
  const [dataTenantTerminations, setDataTenantTerminations] = useState([]);
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [terminationsLoaded, setTerminationsLoaded] = useState(false);
  const [handledNotificationTarget, setHandledNotificationTarget] =
    useState(null);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);
  const [openInformationModal, setOpenInformationModal] = useState(false);
  const [openTenantTerminationsModal, setOpenTenantTerminationsModal] =
    useState(false);
  const [
    openTenantApprovalInformationModal,
    setOpenTenantApprovalInformationModal,
  ] = useState(false);
  const [openTerminationApprovalModal, setOpenTerminationApprovalModal] =
    useState(false);
  const [cancelTenantTerminationsModal, setCancelTenantTerminationsModal] =
    useState(false);

  const hideGlobalNotificationLoading = () => {
    window.dispatchEvent(new Event("sewain:global-loading-hide"));
  };

  const resetNotificationFeedback = () => {
    setSnackbar((current) => ({
      ...current,
      open: false,
      message: "",
    }));
  };

  const clearNotificationRouteState = () => {
    if (typeof window === "undefined") return;

    window.sessionStorage.removeItem("sewain:tenant-termination-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") ||
      params.has("tenant_early_termination_id") ||
      params.has("deleted");

    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataTenantTerminations = async () => {
    setLoading(true);
    setTerminationsLoaded(false);
    try {
      const response = await axios.get("/api/tenant-terminations");
      // console.log("tenant terminations", response);
      setDataTenantTerminations(response.data.data);
      setTerminationsLoaded(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.log("error", error);
      setTerminationsLoaded(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (user) {
      getDataTenantTerminations();
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
    const targetKey = `${terminationId}-${openMode}-${deletedFromNotification}-${target?.requestedAt || 0}`;

    if (
      !["detail", "progress"].includes(openMode) ||
      !terminationId ||
      !user ||
      (!deletedFromNotification && !terminationsLoaded) ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openTerminationFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan data nonaktif tenant...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:tenant-termination-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSelectedData(null);
          setOpenTerminationApprovalModal(false);
          setOpenTenantApprovalInformationModal(false);
          setSnackbar({
            open: true,
            severity: "error",
            message:
              "Data nonaktif tenant ini sudah dihapus, sehingga detail tidak dapat ditampilkan.",
          });
          return;
        }

        const response = await axios.get("/api/tenant-terminations");
        const freshTerminations = response.data?.data || [];
        setDataTenantTerminations(freshTerminations);

        const selectedTermination = freshTerminations.find(
          (item) => Number(item?.tenant_early_termination_id) === terminationId,
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (selectedTermination) {
          resetNotificationFeedback();
          setSelectedData(selectedTermination);
          if (openMode === "progress") {
            setOpenTerminationApprovalModal(true);
          } else {
            setOpenTenantApprovalInformationModal(true);
          }
          return;
        }

        setSnackbar({
          open: true,
          severity: "error",
          message:
            "Data nonaktif tenant tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
        });
      } catch (err) {
        console.log("Error open termination from notification:", err);
        setSnackbar({
          open: true,
          severity: "error",
          message: "Gagal menampilkan data nonaktif tenant dari notifikasi.",
        });
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage("Loading...");
        hideGlobalNotificationLoading();
      }
    };

    openTerminationFromNotification();
  }, [
    handledNotificationTarget,
    notificationOpenSignal,
    terminationsLoaded,
    user,
  ]);

  const filteredData = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return dataTenantTerminations;

    return dataTenantTerminations.filter((item) =>
      [
        item.tenant_name,
        item.tenant_nik,
        item.location_name,
        item.room_number,
        item.floor,
        item.payment_type,
        item.termination_approval_status,
        item.termination_processed_by_full_name,
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [dataTenantTerminations, searchText]);

  const handleCancel = (record) => {
    setSelectedData(record);
    setCancelTenantTerminationsModal(true);
  };

  const handleViewDetailInformation = (record) => {
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleInformation = (record) => {
    setSelectedData(record);
    setOpenInformationModal(true);
  };

  const handleTerminationApproval = (record) => {
    setSelectedData(record);
    setOpenTerminationApprovalModal(true);
  };

  const columns = useMemo(
    () =>
      createTenantTerminationColumns({
        data: dataTenantTerminations,
        theme,
        onViewIdentity: handleInformation,
        onViewDetail: handleViewDetailInformation,
        onViewProgress: handleTerminationApproval,
        onCancel: handleCancel,
        isMobile: isMobile,
      }),
    [dataTenantTerminations, theme],
  );

  const terminationStats = useMemo(() => {
    const total = dataTenantTerminations.length;
    const inProgress = dataTenantTerminations.filter(
      (item) => item.termination_approval_status === "proses",
    ).length;
    const approved = dataTenantTerminations.filter(
      (item) => item.termination_approval_status === "approved",
    ).length;
    const rejectedOrCancelled = dataTenantTerminations.filter((item) =>
      ["rejected", "cancelled"].includes(item.termination_approval_status),
    ).length;

    return [
      {
        label: "Total Pengajuan",
        value: total,
        icon: "solar:document-text-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Dalam Proses",
        value: inProgress,
        icon: "solar:hourglass-line-duotone",
        color: "#facc15",
      },
      {
        label: "Disetujui",
        value: approved,
        icon: "solar:verified-check-bold-duotone",
        color: "#4caf50",
      },
      {
        label: "Ditolak/Batal",
        value: rejectedOrCancelled,
        icon: "solar:close-circle-bold-duotone",
        color: theme.palette.error.main,
      },
    ];
  }, [dataTenantTerminations, theme]);

  const handleCancelTermination = async () => {
    if (!selectedData?.tenant_early_termination_id) return;

    setLoadingMessage("Membatalkan proses nonaktif tenant...");
    setLoading(true);

    try {
      const response = await axios.delete(
        `/api/tenant-terminations/${selectedData.tenant_early_termination_id}`,
      );

      if (response?.data?.success) {
        setSnackbar({
          open: true,
          message:
            response.data.message ||
            "Proses nonaktif tenant berhasil dibatalkan.",
          severity: "success",
        });
        await getDataTenantTerminations();
        setCancelTenantTerminationsModal(false);
        setSelectedData(null);
      } else {
        setSnackbar({
          open: true,
          message:
            response?.data?.message || "Gagal membatalkan nonaktif tenant.",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting tenant termination:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          "Terjadi kesalahan saat membatalkan nonaktif tenant.",
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage("Loading...");
      }, 500);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: "100%",
        p: { xs: 1.25, sm: 2 },
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          breadcrumbs={[
            {
              label: "Transactions",
              value: "transactions",
              icon: "solar:money-bag-bold-duotone",
              path: "#",
            },
            {
              label: "Tenant Terminations",
              value: "tenant-terminations",
              icon: "solar:lock-keyhole-minimalistic-bold-duotone",
              path: "/tenant-terminations",
            },
          ]}
          title="Tenant Terminations"
          description="Kelola pengajuan nonaktif tenant untuk kontrak aktif, pantau status approval berjenjang, dan buka detail pemohon tanpa memenuhi tabel dengan alasan panjang."
          icon="solar:lock-keyhole-minimalistic-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={
                <Icon icon="solar:lock-keyhole-minimalistic-bold-duotone" />
              }
              onClick={() => setOpenTenantTerminationsModal(true)}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 900,
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 6px 14px rgba(255, 152, 0, 0.18)"
                    : "0 6px 14px rgba(230, 9, 9, 0.16)",
                "&:hover": {
                  transform: "translateY(-1px)",
                },
              }}
            >
              Non-Aktifkan Tenant
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {terminationStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Nonaktif Tenant"
          description={`${filteredData.length} dari ${dataTenantTerminations.length} pengajuan ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari penyewa, NIK, lokasi, ruangan, status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey="tenant_early_termination_id"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_WIDTH, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "tenant-terminations-action-column",
              buttonsClassName: "tenant-terminations-action-buttons",
              width: ACTION_COLUMN_WIDTH,
              paddingX: 14,
            }}
          />
        </DataTableShell>
      </Stack>

      <TenantTerminationsModal
        open={openTenantTerminationsModal}
        onClose={() => setOpenTenantTerminationsModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        onNotify={(notif) => setSnackbar(notif)}
        getDataTenantTerminations={getDataTenantTerminations}
        user={user}
      />
      <CrudConfirmModal
        open={cancelTenantTerminationsModal}
        title="Batalkan Nonaktif Tenant"
        description={
          <>
            Proses nonaktif untuk{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedData?.tenant_name || "-"}
            </Box>{" "}
            pada{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              Ruangan {selectedData?.room_number || "-"}
            </Box>
            , lokasi{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedData?.location_name || "-"}
            </Box>{" "}
            akan dihapus dari daftar pengajuan.
          </>
        }
        confirmLabel="Batalkan Nonaktif"
        loadingLabel="Membatalkan..."
        severity="error"
        loading={loading}
        onClose={() => !loading && setCancelTenantTerminationsModal(false)}
        onConfirm={handleCancelTermination}
      />
      <TenantIdentityPreviewModal
        open={openInformationModal}
        onClose={() => setOpenInformationModal(false)}
        selectedData={selectedData}
        title="Preview Informasi Pemohon"
      />
      <TenantLeaseDetailModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        showTerminationDetail
      />
      <ApprovalTrackingModal
        open={openTerminationApprovalModal}
        onClose={() => setOpenTerminationApprovalModal(false)}
        selectedData={selectedData}
        variant="termination"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />
      <LoadingBackdrop message={loadingMessage} open={loading} />
      {/* Snackbar notification */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default TenantTerminations;
