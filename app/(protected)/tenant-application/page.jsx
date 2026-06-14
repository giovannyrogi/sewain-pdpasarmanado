"use client";
import {
  Box,
  Button,
  Grid,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableExportButton from "@/app/components/data-table/TableExportButton";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import TenantApplicationFormModal from "./TenantApplicationFormModal";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import { useUser } from "@/app/utils/useUser";
import { useReactToPrint } from "react-to-print";
import UpdateDocumentDate from "./UpdateDocumentDate";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PrintDocumentTenant from "@/app/components/documents/PrintDocumentTenant";
import {
  buildTenantApplicationStats,
  filterTenantApplications,
  getTenantApplicationColumns,
} from "./TenantApplicationTableColumns";
import { exportTenantApplicationsToExcel } from "./tenantApplicationExport";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const ACTION_COLUMN_WIDTH = 190;
const TABLE_SCROLL_WIDTH = 1700;

const Applications = () => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const router = useRouter();
  // Ref untuk dokumen print
  const printRef = useRef();
  const { user } = useUser();
  const [dataTenantApplication, setDataTenantApplication] = useState([]);
  const [dataLocations, setDataLocations] = useState([]);
  const [dataAvailableRooms, setDataAvailableRooms] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [
    openTenantApprovalInformationModal,
    setOpenTenantApprovalInformationModal,
  ] = useState(false);

  const [openUpdateDateModal, setOpenUpdateDateModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [tenantApplicationsLoaded, setTenantApplicationsLoaded] =
    useState(false);
  const [handledNotificationTarget, setHandledNotificationTarget] =
    useState(null);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);

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

    window.sessionStorage.removeItem("sewain:tenant-application-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") || params.has("tenant_application_id");

    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataTenantApplication = async () => {
    setLoading(true);
    setTenantApplicationsLoaded(false);
    try {
      const response = await axios.get("/api/tenant-application");
      console.log("tenant application", response);
      setDataTenantApplication(response.data.data);
      setTenantApplicationsLoaded(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.log("error", error);
      setTenantApplicationsLoaded(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const getLocationsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/locations");
      // console.log("locations", response);
      setDataLocations(response.data.data);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    if (user) {
      getDataTenantApplication();
      getLocationsData();
    }
  }, [user]);

  useEffect(() => {
    const handleNotificationOpenSignal = () => {
      setNotificationOpenSignal((value) => value + 1);
    };

    window.addEventListener(
      "sewain:tenant-application-notification-open",
      handleNotificationOpenSignal,
    );

    return () => {
      window.removeEventListener(
        "sewain:tenant-application-notification-open",
        handleNotificationOpenSignal,
      );
    };
  }, []);

  useEffect(() => {
    const getNotificationTarget = () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      const storageValue = window.sessionStorage.getItem(
        "sewain:tenant-application-target",
      );

      if (storageValue) {
        try {
          const parsed = JSON.parse(storageValue);
          return {
            openMode: parsed.openMode || "detail",
            tenantApplicationId: Number(parsed.tenantApplicationId),
            deletedFromNotification: Boolean(parsed.deleted),
            requestedAt: parsed.requestedAt,
          };
        } catch {
          window.sessionStorage.removeItem("sewain:tenant-application-target");
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
      !["detail", "approval"].includes(openMode) ||
      !tenantApplicationId ||
      !user ||
      !tenantApplicationsLoaded ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openTenantApplicationFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan detail permohonan...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:tenant-application-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSelectedData(null);
          setOpenApprovalModal(false);
          setOpenTenantApprovalInformationModal(false);
          setSnackbar({
            open: true,
            severity: "error",
            message:
              "Data permohonan ini sudah dihapus, sehingga detail approval tidak dapat ditampilkan.",
          });
          return;
        }

        /**
         * Ambil ulang daftar permohonan saat notifikasi diklik. Ini penting
         * untuk notifikasi "data diperbarui", karena browser bisa saja masih
         * menyimpan status lama dari sebelum user refresh halaman.
         */
        const response = await axios.get("/api/tenant-application");
        const freshApplications = response.data?.data || [];
        setDataTenantApplication(freshApplications);

        const selectedApplication = freshApplications.find(
          (item) => Number(item?.tenant_application_id) === tenantApplicationId,
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (selectedApplication) {
          setSelectedData(selectedApplication);
          if (openMode === "approval") {
            setOpenApprovalModal(true);
          } else {
            setOpenTenantApprovalInformationModal(true);
          }
          return;
        }

        setSnackbar({
          open: true,
          severity: "error",
          message:
            "Data permohonan tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
        });
      } catch (err) {
        console.log("Error open tenant application from notification:", err);
        setSnackbar({
          open: true,
          severity: "error",
          message: "Gagal menampilkan detail permohonan dari notifikasi.",
        });
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage("Loading...");
        hideGlobalNotificationLoading();
      }
    };

    openTenantApplicationFromNotification();
  }, [
    dataTenantApplication,
    handledNotificationTarget,
    notificationOpenSignal,
    tenantApplicationsLoaded,
    user,
  ]);

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // useReactToPrint di level atas
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Dokumen Sewa Ruangan",
    onAfterPrint: () => setTimeout(() => setPrintData(null), 800),
  });

  // handlers print
  const handlePrintDoc = (record) => {
    setPrintData(record);

    // Tunggu React menyelesaikan render dokumen tersembunyi sebelum
    // react-to-print menyalinnya ke iframe print, terutama saat development.
    requestAnimationFrame(() => {
      setTimeout(() => {
        handlePrintAction();
      }, 500);
    });
  };

  const handleEdit = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenEditModal(true);
  };

  const handlePreviewData = (record) => {
    setLoading(true);
    // setLoadingMessage("Loading...");
    router.push(`/tenant-application/${record?.tenant_application_id}`);
  };

  const handleDelete = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenDeleteModal(true);
  };

  const handleDeleteTenantApplication = async () => {
    if (!selectedData?.tenant_application_id) return;

    setLoadingMessage("Menghapus permohonan...");
    setLoading(true);

    try {
      const response = await axios.delete(
        `/api/tenant-application/${selectedData.tenant_application_id}`,
      );

      if (response?.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Permohonan berhasil dihapus.",
          severity: "success",
        });
        await getDataTenantApplication();
        await getLocationsData();
        setOpenDeleteModal(false);
        setSelectedData(null);
        return;
      }

      setSnackbar({
        open: true,
        message: response?.data.message || "Gagal menghapus permohonan.",
        severity: "error",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message ||
          "Terjadi error saat menghapus permohonan.",
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage("Loading...");
      }, 1000);
    }
  };

  const handleApproval = (record) => {
    setSelectedData(record);
    setOpenApprovalModal(true);
  };

  const handleTenantApprove = (record) => {
    // console.log("handleTenantApprove record", record);
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleUpdateDate = (record) => {
    // console.log("handleTenantApprove record", record);
    setSelectedData(record);
    setOpenUpdateDateModal(true);
  };

  const filteredData = useMemo(
    () => filterTenantApplications(dataTenantApplication, searchText),
    [dataTenantApplication, searchText],
  );

  const tenantApplicationStats = useMemo(
    () => buildTenantApplicationStats(dataTenantApplication, theme),
    [dataTenantApplication, theme],
  );

  const columns = useMemo(
    () =>
      getTenantApplicationColumns({
        data: dataTenantApplication,
        isMobile: isMobile,
        theme,
        themeMode,
        actionColumnWidth: ACTION_COLUMN_WIDTH,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onApproval: handleApproval,
        onDetail: handleTenantApprove,
        onPrint: handlePrintDoc,
      }),
    [dataTenantApplication, theme, themeMode],
  );

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      setSnackbar({
        open: true,
        message: "Tidak ada data untuk di export",
        severity: "error",
      });
      return;
    }

    exportTenantApplicationsToExcel(filteredData);
  };

  const handleExportPDF = () => {
    setSnackbar({ open: true, message: "Comming Soon", severity: "info" });
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
          eyebrow="Transactions"
          breadcrumbs={[
            {
              label: "Transactions",
              value: "transactions",
              icon: "solar:money-bag-bold-duotone",
              path: "#",
            },
            {
              label: "Tenant Application",
              value: "tenant-application",
              icon: "solar:document-add-bold-duotone",
              path: "/tenant-application",
            },
          ]}
          title="Tenant Application"
          description="Kelola permohonan sewa ruangan, status approval, dokumen penyewa, pembayaran awal, dan dokumen cetak dalam satu halaman."
          icon="solar:document-add-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="fluent:document-queue-add-20-regular" />}
              onClick={() => setOpenAddModal(true)}
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
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 8px 18px rgba(255, 152, 0, 0.22)"
                      : "0 8px 18px rgba(230, 9, 9, 0.20)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Tambah Permohonan
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {tenantApplicationStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Permohonan Sewa"
          description={`${filteredData.length} dari ${dataTenantApplication.length} permohonan ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari penyewa, dokumen, lokasi, ruangan, pembayaran..."
          onSearchChange={setSearchText}
          headerAction={
            <TableExportButton
              disabled={!filteredData.length}
              ariaLabel="Export permohonan sewa"
              items={[
                {
                  label: "Export ke Excel",
                  icon: "vscode-icons:file-type-excel",
                  onClick: handleExportExcel,
                },
                {
                  label: "Export ke PDF",
                  icon: "vscode-icons:file-type-pdf2",
                  onClick: handleExportPDF,
                },
              ]}
            />
          }
        >
          <ReusableAntTable
            rowKey="tenant_application_id"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_WIDTH, y: 420 }}
            onChange={onChange}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "tenant-application-action-column",
              buttonsClassName: "tenant-application-action-buttons",
              width: ACTION_COLUMN_WIDTH,
              paddingX: 14,
            }}
            rowClassName={(record) => {
              if (record.is_fully_paid) return "rowFullyPaid";
              return "";
            }}
          />
        </DataTableShell>
      </Stack>
      <TenantApplicationFormModal
        mode="create"
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataTenantApplication={getDataTenantApplication}
        getLocationsData={getLocationsData}
        dataTenantApplication={dataTenantApplication}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
        setLoadingMessage={setLoadingMessage}
        user={user}
      />
      <TenantApplicationFormModal
        mode="edit"
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataTenantApplication={getDataTenantApplication}
        getLocationsData={getLocationsData}
        dataTenantApplication={dataTenantApplication}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
        setLoadingMessage={setLoadingMessage}
        selectedData={selectedData}
        user={user}
      />
      <CrudConfirmModal
        open={openDeleteModal}
        title="Hapus Permohonan"
        description={
          <>
            Permohonan atas nama{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedData?.tenant_name || "-"}
            </Box>
            , lokasi{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedData?.location_name || "-"}
            </Box>
            , ruangan{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              No. {selectedData?.room_number || "-"}
            </Box>{" "}
            akan dihapus dari sistem.
          </>
        }
        confirmLabel="Hapus Permohonan"
        loadingLabel="Menghapus permohonan..."
        loading={loading}
        onClose={() => !loading && setOpenDeleteModal(false)}
        onConfirm={handleDeleteTenantApplication}
      />
      <UpdateDocumentDate
        open={openUpdateDateModal}
        onClose={() => setOpenUpdateDateModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataTenantApplication={getDataTenantApplication}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
        user={user}
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
      <TenantLeaseDetailModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
      />
      <LoadingBackdrop message={loadingMessage} open={loading} />
      {/* Snackbar notification */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
      {/* Dokumen tersembunyi (untuk print) */}
      <div style={{ display: "none" }}>
        {printData && <PrintDocumentTenant ref={printRef} data={printData} />}
      </div>

      {/* <div style={{ display: "none" }}>
        {printData && printType === "persetujuan_sewa_ruangan" && (
          <PersetujuanSewaRuangan ref={printRef} data={printData} />
        )}

        {printData && printType === "surat_pernyataan_penyewa" && (
          <SuratPernyataanPenyewa
            ref={printRefSuratPernyataanPenyewa}
            data={printData}
          />
        )}
      </div> */}
    </Box>
  );
};

export default Applications;
