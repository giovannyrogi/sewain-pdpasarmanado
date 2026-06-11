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
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import formatRupiah from "@/app/components/formatrupiah/page";
import AddPayment from "./AddPayment";
import { useUser } from "@/app/utils/useUser";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import DeletePayment from "./DeletePayment";
import { useReactToPrint } from "react-to-print";
import BuktiPembayaran from "@/app/components/documents/BuktiPembayaran";
import EditPayment from "./EditPayment";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";
import ApprovalModal from "./ApprovalModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import KwitansiPembayaran from "@/app/components/documents/KwitansiPembayaran";
import KwitansiPph from "@/app/components/documents/KwitansiPph";

const Payments = () => {
  // Ref untuk dokumen print
  const printRef = useRef();
  const receiptPrintRef = useRef();
  const { user } = useUser();
  const [dataPayments, setDataPayments] = useState([]);
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
  const [openBuktiPembayaranModal, setOpenBuktiPembayaranModal] =
    useState(false);
  const [openVerificationModal, setOpenVerificationModal] = useState(false);
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [receiptPrintData, setReceiptPrintData] = useState(null);
  const [receiptPrintType, setReceiptPrintType] = useState(null);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
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

    window.sessionStorage.removeItem("sewain:payment-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") || params.has("payment_id") || params.has("deleted");

    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataPayments = async () => {
    setLoading(true);
    setPaymentsLoaded(false);
    try {
      const response = await axios.get("/api/payments");
      // console.log("data payments", response);
      if (response.data.success) {
        setDataPayments(response.data.data);
        setPaymentsLoaded(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } else {
        setPaymentsLoaded(true);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setPaymentsLoaded(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (user) {
      getDataPayments();
    }
  }, [user]);

  useEffect(() => {
    const handleNotificationOpenSignal = () => {
      setNotificationOpenSignal((value) => value + 1);
    };

    window.addEventListener(
      "sewain:payment-notification-open",
      handleNotificationOpenSignal,
    );

    return () => {
      window.removeEventListener(
        "sewain:payment-notification-open",
        handleNotificationOpenSignal,
      );
    };
  }, []);

  useEffect(() => {
    const getNotificationTarget = () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      const storageValue = window.sessionStorage.getItem(
        "sewain:payment-target",
      );

      if (storageValue) {
        try {
          const parsed = JSON.parse(storageValue);
          return {
            openMode: parsed.openMode || "detail",
            paymentId: Number(parsed.paymentId),
            deletedFromNotification: Boolean(parsed.deleted),
            requestedAt: parsed.requestedAt,
          };
        } catch {
          window.sessionStorage.removeItem("sewain:payment-target");
        }
      }

      return {
        openMode: params.get("open"),
        paymentId: Number(params.get("payment_id")),
        deletedFromNotification: params.get("deleted") === "1",
        requestedAt: 0,
      };
    };

    const target = getNotificationTarget();
    const openMode = target?.openMode;
    const paymentId = target?.paymentId;
    const deletedFromNotification = target?.deletedFromNotification;
    const targetKey = `${paymentId}-${openMode}-${deletedFromNotification}-${target?.requestedAt || 0}`;

    if (
      !["detail", "progress"].includes(openMode) ||
      !paymentId ||
      !user ||
      (!deletedFromNotification && !paymentsLoaded) ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openPaymentFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan detail pembayaran...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:payment-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          setSelectedData(null);
          setOpenApprovalModal(false);
          setOpenVerificationModal(false);
          setSnackbar({
            open: true,
            severity: "error",
            message:
              "Data pembayaran ini sudah dihapus, sehingga detail pembayaran tidak dapat ditampilkan.",
          });
          return;
        }

        /**
         * Klik dari notifikasi payment harus mengambil data terbaru dari server.
         * Ini mencegah modal progress masih membaca status rejected lama setelah
         * Admin Kontrak memperbarui bukti pembayaran menjadi proses lagi.
         */
        const response = await axios.get("/api/payments");
        const freshPayments = response.data?.success
          ? response.data.data || []
          : [];
        setDataPayments(freshPayments);

        const selectedPayment = freshPayments.find(
          (item) => Number(item?.payments?.payment_id) === paymentId,
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (selectedPayment) {
          resetNotificationFeedback();
          setSelectedData(selectedPayment);
          if (openMode === "progress") {
            setOpenApprovalModal(false);
            setOpenVerificationModal(true);
          } else {
            setOpenVerificationModal(false);
            setOpenApprovalModal(true);
          }
          return;
        }

        setSnackbar({
          open: true,
          severity: "error",
          message:
            "Data pembayaran tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
        });
      } catch (err) {
        console.log("Error open payment from notification:", err);
        setSnackbar({
          open: true,
          severity: "error",
          message: "Gagal menampilkan detail pembayaran dari notifikasi.",
        });
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage("Loading...");
        hideGlobalNotificationLoading();
      }
    };

    openPaymentFromNotification();
  }, [
    dataPayments,
    handledNotificationTarget,
    notificationOpenSignal,
    paymentsLoaded,
    user,
  ]);

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const handleEdit = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenEditModal(true);
  };

  const handleDelete = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenDeleteModal(true);
  };

  const handleReject = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenRejectedModal(true);
  };

  const handleRejectPayment = async (notes) => {
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/payment-approval/payment-rejected/${selectedData?.payment_approval?.id}`,
        {
          notes,
          status: "rejected",
          payment_id: selectedData?.payments?.payment_id,
          approver_id: user?.id,
          role_id: user?.role_id,
        }
      );

      if (response?.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Berhasil menolak bukti pembayaran.",
          severity: "success",
        });
        await getDataPayments();
        setOpenRejectedModal(false);
        return;
      }

      setSnackbar({
        open: true,
        message: response?.data.message || "Gagal menolak bukti pembayaran.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error rejecting payment approval:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message || "Gagal menolak bukti pembayaran.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = (record) => {
    // console.log("verification record", record);
    setSelectedData(record);
    setOpenVerificationModal(true);
  };

  const handleApprove = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenApprovalModal(true);
  };

  // useReactToPrint di level atas
  const handlePrintAction = useReactToPrint({
    contentRef: printRef, // langsung ref
    documentTitle: "Persetujuan Sewa Ruangan",
    onAfterPrint: () => setTimeout(() => setPrintData(null), 200),
  });

  const handleReceiptPrintAction = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: "Kwitansi Pembayaran",
    pageStyle: `
      @page {
        size: letter portrait;
        margin: 0;
      }

      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 216mm;
          height: 279mm;
          overflow: hidden;
        }
      }
    `,
    onAfterPrint: () => {
      setReceiptPrintData(null);
      setReceiptPrintType(null);
    },
  });

  // panggil print setelah ref sudah render
  useEffect(() => {
    if (!printData) return;

    // beri jeda supaya komponen PersetujuanSewaRuangan ter-render dulu
    const timeout = setTimeout(() => {
      if (printRef.current) {
        handlePrintAction();
      } else {
        console.error("Belum ada ref untuk print");
      }
    }, 200); // jeda 200ms

    return () => clearTimeout(timeout);
  }, [printData]);

  useEffect(() => {
    if (!receiptPrintData || !receiptPrintType) return;

    const timeout = setTimeout(() => {
      if (receiptPrintRef.current) {
        handleReceiptPrintAction();
      } else {
        console.error("Belum ada ref untuk print kwitansi");
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [receiptPrintData, receiptPrintType]);

  // handlers
  const handlePrint = (record) => {
    // cukup set selectedData — useEffect akan menangani memanggil printAction
    setPrintData(record);
  };

  const handlePrintReceipt = (record, type) => {
    console.log("print receipt", record);

    setReceiptPrintData(record);
    setReceiptPrintType(type);
  };

  // Utility untuk filter dinamis
  const getValueByPath = (obj, path) => {
    if (Array.isArray(path)) {
      return path.reduce((o, key) => o?.[key], obj);
    }
    return obj?.[path]; // kalau string, langsung ambil property
  };

  const generateFilters = (data, path, map = null) => {
    return [...new Set(data.map((item) => getValueByPath(item, path)))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({
        text: map ? map[val] : val,
        value: val,
      }));
  };

  const createOnFilter = (path) => {
    return (value, record) => {
      const recordValue = getValueByPath(record, path);
      return recordValue === value;
    };
  };

  // Mapping data untuk filter
  // Mapping untuk status
  const approvalStatusMap = {
    proses: "Dalam Proses",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  // Mapping untuk cicilan
  const cicilanMap = {
    1: "Uang Muka(DP)",
    2: "Cicilan 1",
    3: "Cicilan 2",
    4: "Cicilan 3",
  };

  // Mapping untuk tipe pembayaran
  const paymentTypeMap = {
    cicilan: "Cicilan",
    lunas: "Lunas",
  };

  // nested pakai array
  const tenantName = generateFilters(dataPayments, [
    "tenant_application",
    "tenant_name",
  ]);

  const paymentTypeFilters = generateFilters(
    dataPayments,
    ["tenant_application", "payment_type"],
    paymentTypeMap,
  );

  const cicilanFilters = generateFilters(
    dataPayments,
    ["payments", "payment_number"],
    cicilanMap,
  );

  const approvalStatusFilters = generateFilters(
    dataPayments,
    ["payments", "approval_status"],
    approvalStatusMap,
  );

  // Utility untuk filter dinamis
  const filteredData = dataPayments.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return (
      item?.tenant_application?.tenant_name?.toLowerCase().includes(search) ||
      item?.tenant_application?.payment_type?.toLowerCase().includes(search) ||
      (item?.payments?.payment_number &&
        `cicilan ${item.payments.payment_number}`
          .toLowerCase()
          .includes(search)) ||
      (item?.payments?.approval_status &&
        approvalStatusMap[item.payments.approval_status]
          ?.toLowerCase()
          .includes(search))
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
      dataIndex: ["tenant_application", "tenant_name"],
      filters: tenantName,
      onFilter: createOnFilter(["tenant_application", "tenant_name"]),
      filterSearch: true,
      sorter: (a, b) =>
        a.tenant_application.tenant_name.localeCompare(
          b.tenant_application.tenant_name,
        ),
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
        >
          {record?.tenant_application?.tenant_name}
        </Typography>
      ),
      width: 200,
    },
    {
      title: "Tipe Pembayaran",
      dataIndex: ["tenant_application", "payment_type"],
      filters: paymentTypeFilters,
      onFilter: createOnFilter(["tenant_application", "payment_type"]),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record?.tenant_application?.payment_type === "cicilan"
                ? "blue"
                : "green"
            }
            key={record.payment_id}
            style={{ fontWeight: "bold" }}
          >
            {record?.tenant_application?.payment_type === "cicilan"
              ? "Cicilan"
              : "Lunas"}
          </Tag>
        );
      },
      width: 160,
    },
    {
      title: "Tahap Cicilan",
      dataIndex: ["payments", "payment_number"],
      filters: cicilanFilters,
      onFilter: createOnFilter(["payments", "payment_number"]),
      filterSearch: true,
      render: (text, record) => {
        return record.tenant_application.payment_type === "cicilan" ? (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.payments?.payment_number === 1
                ? "volcano"
                : record.payments?.payment_number === 2
                  ? "lime"
                  : "orange"
            }
            key={record.payments?.payment_id}
            style={{ fontWeight: "bold" }}
          >
            {record.payments?.payment_number === 1
              ? "Uang Muka (DP)"
              : record.payments?.payment_number === 2
                ? "Cicilan 1"
                : record.payments?.payment_number === 3
                  ? "Cicilan 2"
                  : "Cicilan 3"}
          </Tag>
        ) : (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "center" }}
          >
            -
          </Typography>
        );
      },
      width: 160,
    },
    {
      title: "Status Verifikasi",
      dataIndex: ["payments", "approval_status"],
      filters: approvalStatusFilters,
      onFilter: createOnFilter(["payments", "approval_status"]),
      // filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.payments?.approval_status === "proses"
                ? "yellow"
                : record.payments?.approval_status === "rejected"
                  ? "red"
                  : "green"
            }
            key={record.payments?.payment_id}
            style={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => handleVerification(record)}
          >
            {record.payments?.approval_status === "proses"
              ? `Dalam Proses`
              : record.payments?.approval_status === "rejected"
                ? "Ditolak"
                : "Disetujui"}
          </Tag>
        );
      },
      width: 150,
    },
    {
      title: "Tanggal Pembayaran",
      dataIndex: ["payments", "payment_date"],
      render: (text, record) => {
        return (
          <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
            {moment(record.payments?.payment_date).format("D MMMM YYYY")}
          </Typography>
        );
      },
      width: 180,
    },
    {
      title: "Total Pembayaran",
      dataIndex: ["payments", "payment_amount"],
      filterSearch: true,
      render: (text, record) =>
        record.tenant_application?.payment_type === "cicilan" ? (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
          >
            {formatRupiah(Number(record.payments?.payment_amount))}
          </Typography>
        ) : (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
          >
            {formatRupiah(Number(record.payments?.payment_amount))}
          </Typography>
        ),
      width: 160,
    },
    {
      title: "Actions",
      key: "action",
      align: "center",
      width: 100,
      fixed: "right",
      render: (text, record) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Detail Pembayaran">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="success"
              onClick={() => handleApprove(record)}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon
                icon="material-symbols:order-approve-outline"
                fontSize={18}
                style={{ color: themeMode === "dark" ? "green" : "white" }}
              />
            </Button>
          </Tooltip>
          {record.payments?.approval_status === "approved" && (
            <Tooltip title="Print Bukti Bayar">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color="primary"
                onClick={() => handlePrint(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon icon="streamline-ultimate:print-text" fontSize={18} />
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Print Kwitansi Penerimaan">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="inherit"
              onClick={() => handlePrintReceipt(record, "contract")}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="mdi:receipt-text-send-outline" fontSize={18} />
            </Button>
          </Tooltip>
          <Tooltip title="Print Kwitansi Pembayaran PPH">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="warning"
              onClick={() => handlePrintReceipt(record, "pph")}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="mdi:receipt-text-plus-outline" fontSize={18} />
            </Button>
          </Tooltip>
          {user?.role_id !== 8 &&
            (record.payments?.approval_status === "rejected" ||
              record.payments?.approval_status === "proses") && (
              <>
                <Tooltip title="Edit Pembayaran">
                  <Button
                    size="small"
                    variant={themeMode === "dark" ? "outlined" : "contained"}
                    color="info"
                    onClick={() => handleEdit(record)}
                    sx={{ minWidth: 0, px: 1 }}
                  >
                    <Icon icon="line-md:edit" fontSize={18} />
                  </Button>
                </Tooltip>
                <Tooltip title="Tolak Pembayaran">
                  <Button
                    size="small"
                    variant={themeMode === "dark" ? "outlined" : "contained"}
                    color="error"
                    onClick={() => handleDelete(record)}
                    sx={{ minWidth: 0, px: 1 }}
                  >
                    <Icon icon="line-md:close-circle" fontSize={18} />
                  </Button>
                </Tooltip>
              </>
            )}
          {user?.role_id === 8 &&
            record.payments?.approval_status === "proses" && (
              <Tooltip title="Tolak Pembayaran">
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          transition: "all 0.3s",
          mb: 2,
          mt: 4,
        }}
      >
        <Button
          variant={themeMode === "dark" ? "outlined" : "contained"}
          onClick={() => setOpenAddModal(true)}
          sx={{
            textTransform: "none",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            fontWeight: "bold",
          }}
        >
          Tambah
          <Icon icon="streamline:payment-10-remix" fontSize="20px" />
        </Button>
      </Box>
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
            rowKey={(record) => record.payments?.payment_id}
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
      <AddPayment
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
        user={user}
      />
      <EditPayment
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        selectedCurrentData={selectedData}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
        user={user}
      />
      <DeletePayment
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        selectedData={selectedData}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
      />
      <ApprovalModal
        open={openApprovalModal}
        onClose={() => setOpenApprovalModal(false)}
        selectedData={selectedData}
        loading={loading}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
        user={user}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
      />
      <RejectReasonModal
        open={openRejectedModal}
        onClose={() => setOpenRejectedModal(false)}
        title="Tolak Bukti Pembayaran"
        description="Tuliskan alasan agar riwayat validasi pembayaran tercatat jelas."
        confirmLabel="Tolak Bukti Pembayaran"
        loading={loading}
        onSubmit={handleRejectPayment}
      />
      <ApprovalTrackingModal
        open={openVerificationModal}
        onClose={() => setOpenVerificationModal(false)}
        selectedData={selectedData}
        variant="payment"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />
      <ImagePreviewModal
        open={openBuktiPembayaranModal}
        onClose={() => setOpenBuktiPembayaranModal(false)}
        imageUrl={`/api${selectedData?.payments?.proof_file_path}`}
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
        {printData && <BuktiPembayaran ref={printRef} data={printData} />}
      </div>
      <div style={{ display: "none" }}>
        {receiptPrintData && receiptPrintType === "contract" && (
          <KwitansiPembayaran ref={receiptPrintRef} data={receiptPrintData} />
        )}
        {receiptPrintData && receiptPrintType === "pph" && (
          <KwitansiPph ref={receiptPrintRef} data={receiptPrintData} />
        )}
      </div>
    </Box>
  );
};

export default Payments;
