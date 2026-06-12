"use client";
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import formatRupiah from "@/app/components/formatrupiah/page";
import { useUser } from "@/app/utils/useUser";
import { useReactToPrint } from "react-to-print";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import TerminationReasonModal from "@/app/components/terminationreasonmodal/TerminationReasonModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";

const TenantTerminations = () => {
  const { user } = useUser();
  const [dataTenantTerminations, setDataTenantTerminations] = useState([]);
  const { themeMode } = useThemeMode();
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
  const [openTerminationReasonModal, setOpenTerminationReasonModal] =
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
      const response = await axios.get(
        `/api/tenant-termination-approval/by-role`,
        {
          params: { role_id: user.role_id },
        }
      );

      // console.log("tenant terminations approval", response);
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

    const openTerminationApprovalFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan data nonaktif tenant...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:tenant-termination-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSelectedData(null);
          setOpenTenantApprovalInformationModal(false);
          setOpenTerminationApprovalModal(false);
          setSnackbar({
            open: true,
            severity: "error",
            message:
              "Data nonaktif tenant ini sudah dihapus, sehingga detail tidak dapat ditampilkan.",
          });
          return;
        }

        const response = await axios.get(
          "/api/tenant-termination-approval/by-role",
          {
            params: { role_id: user.role_id },
          },
        );
        const freshTerminations = response.data?.data || [];
        setDataTenantTerminations(freshTerminations);

        const selectedTermination = freshTerminations.find(
          (item) =>
            Number(item?.tenant_early_termination_id) === terminationId,
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
        console.log("Error open termination approval from notification:", err);
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

    openTerminationApprovalFromNotification();
  }, [
    handledNotificationTarget,
    notificationOpenSignal,
    terminationsLoaded,
    user,
  ]);

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const handleViewDetailInformation = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleViewReason = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenTerminationReasonModal(true);
  };

  const handleInformation = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenInformationModal(true);
  };

  const handleReject = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setCancelTenantTerminationsModal(true);
  };

  const handleRejectTermination = async (notes) => {
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/tenant-termination-approval/tenant-rejected/${selectedData?.termination_approval_id}`,
        {
          notes,
          status: "rejected",
          tenant_early_termination_id: selectedData?.tenant_early_termination_id,
          approver_id: user?.id,
        }
      );

      if (response?.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Berhasil menolak permintaan non-aktif.",
          severity: "success",
        });
        await getDataTenantTerminations();
        setCancelTenantTerminationsModal(false);
        return;
      }

      setSnackbar({
        open: true,
        message: response?.data.message || "Gagal menolak permintaan non-aktif.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error rejecting tenant termination:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message || "Gagal menolak permintaan non-aktif.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTerminationApproval = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenTerminationApprovalModal(true);
  };

  const handleApproveTermination = async () => {
    if (!selectedData || !user?.id) return;

    setLoading(true);
    try {
      const response = await axios.put(
        `/api/tenant-termination-approval/${selectedData.termination_approval_id}`,
        {
          tenant_early_termination_id: selectedData.tenant_early_termination_id,
          status: "approved",
          approver_id: user.id,
          room_id: selectedData.room_id,
          tenant_identity_id: selectedData?.tenant_identity_id,
        }
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Berhasil menyetujui permintaan non-aktif.",
          severity: "success",
        });
        await getDataTenantTerminations();
        setOpenTenantApprovalInformationModal(false);
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Gagal menyetujui permintaan non-aktif.",
          severity: "error",
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message ||
          "Terjadi error saat menyetujui permintaan non-aktif.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Utility untuk filter dinamis
  function generateFilters(data, key) {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({ text: val, value: val }));
  }

  function createOnFilter(key) {
    return (value, record) => record[key] === value;
  }

  const tenant_name = generateFilters(dataTenantTerminations, "tenant_name");
  const floorFilter = generateFilters(dataTenantTerminations, "floor");
  const locationFilters = generateFilters(
    dataTenantTerminations,
    "location_name"
  );
  const paymentTypeFilters = generateFilters(
    dataTenantTerminations,
    "payment_type"
  );

  const approvalStatusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Ditolak", value: "rejected" },
    { text: "Disetujui", value: "approved" },
  ];

  const filteredData = dataTenantTerminations.filter((item) => {
    return (
      item.tenant_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.room_number?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns = [
     {
      title: "No",
      dataIndex: "index",
      render: (text, record, index) => index + 1,
      width: 50,
      align: "center",
    },
    {
      title: "Nama Penyewa",
      dataIndex: "tenant_name",
      filters: tenant_name,
      onFilter: createOnFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => a.tenant_name.localeCompare(b.tenant_name),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "12px",
            textTransform: "capitalize",
            cursor: "pointer",
            "&:hover": {
              color: theme.palette.primary.main,
              textDecoration: "underline",
            },
          }}
          onClick={() => handleInformation(record)}
        >
          {record.tenant_name}
        </Typography>
      ),
      width: 200,
    },
    {
      title: "Lokasi",
      dataIndex: "location_name",
      filters: locationFilters,
      onFilter: createOnFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => a.location_name.localeCompare(b.location_name),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontSize: "12px" }}>
          {record.location_name}
        </Typography>
      ),
      width: 200,
    },
    {
      title: "Ruangan",
      dataIndex: "room_number",
      sorter: (a, b) => a.room_number.localeCompare(b.room_number),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontSize: "12px" }}>{record.room_number}</Typography>
      ),
      width: 120,
    },
    {
      title: "Alasan Non-Aktif",
      dataIndex: "reason",
      render: (text, record) => (
        <Tag
          color="lime"
          key={record.termination_id}
          style={{ fontWeight: "bold", cursor: "pointer", fontSize: "12px" }}
          onClick={() => handleViewReason(record)}
        >
          Lihat Alasan Non-Aktif
        </Tag>
      ),
      width: 150,
    },
    {
      title: "Tanggal Dibuat",
      dataIndex: "termination_created_at",
      width: 150,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {moment(record.termination_created_at).format("D MMMM YYYY")}
        </Typography>
      ),
    },
    {
      title: "Status Persetujuan",
      dataIndex: "termination_approval_status",
      filters: approvalStatusFilters,
      onFilter: createOnFilter("termination_approval_status"),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.termination_approval_status === "proses"
                ? "yellow"
                : record.termination_approval_status === "approved"
                ? "green"
                : "red"
            }
            key={record.termination_id}
            style={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => handleTerminationApproval(record)}
          >
            {record.termination_approval_status === "proses"
              ? `Dalam Proses ${record.termination_current_step}/5`
              : record.termination_approval_status === "approved"
              ? "Disetujui"
              : record.termination_approval_status === "rejected"
              ? "Tidak Disetujui"
              : "Dibatalkan"}
          </Tag>
        );
      },
      width: 200,
    },
    {
      title: "Actions",
      key: "action",
      align: "center",
      width: 100,
      fixed: "right",
      render: (text, record) => (
        <Box
          sx={{
            display: "flex",
            gap: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Tooltip title="Detail Data Pemohon">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="info"
              onClick={() => handleViewDetailInformation(record)}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="mdi:smart-card-outline" fontSize={18} />
            </Button>
          </Tooltip>
          {record.termination_approval_status === "approved" ||
          record.termination_approval_status === "rejected" ? (
            ""
          ) : (
            <Tooltip title="Tolak Permohonan Non-Aktif">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color="error"
                onClick={() => handleReject(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon icon="line-md:close-circle" fontSize={18} />
              </Button>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      <BreadcrumbPage menuList={MENU_CONFIG} />

      <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: theme.palette.primary.main, // warna utama (angka aktif, outline, dsb)
            // colorText: theme.palette.text.primary, // warna teks default
            // colorBgContainer: theme.palette.background.default, // background tabel
          },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p:
              filteredData.length > 0
                ? "10px 15px 0px 15px"
                : "10px 15px 10px 15px",
            width: "100%",
            bgcolor: "background.default",
            overflowX: "auto",
            mt: 5,
          }}
        >
          <Input.Search
            placeholder="Cari..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginBottom: 20, marginTop: 10 }}
          />
          <Table
            rowKey="tenant_application_id"
            columns={columns}
            dataSource={filteredData}
            onChange={onChange}
            showSorterTooltip={{ target: "sorter-icon" }}
            scroll={{ x: "max-content", y: 420 }}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: [5, 10, 20, 50],
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} dari ${total} data`,
            }}
          />
        </Paper>
      </ConfigProvider>
      <TenantLeaseDetailModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        canApprove
        approving={loading}
        onApprove={handleApproveTermination}
        showTerminationDetail
      />
      <RejectReasonModal
        open={cancelTenantTerminationsModal}
        onClose={() => setCancelTenantTerminationsModal(false)}
        title="Tolak Permintaan Non-Aktif"
        description="Catat alasan penolakan agar riwayat keputusan terminasi jelas."
        confirmLabel="Tolak Permintaan"
        loading={loading}
        onSubmit={handleRejectTermination}
      />
      <TerminationReasonModal
        open={openTerminationReasonModal}
        onClose={() => setOpenTerminationReasonModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        setLoadingMessage={setLoadingMessage}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
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
