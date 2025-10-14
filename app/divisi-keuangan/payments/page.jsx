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
import { useUser } from "@/app/utils/useUser";
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import menuDivisiKeuangan from "@/app/components/menu/MenuItemDivisiKeuangan";
import ApprovalModal from "./ApprovalModal";
import PaymentApprovalModal from "@/app/components/payment-approval-modal/PaymentApprovalModa";
import RejectedModal from "./RejectedModal";
import BuktiPembayaran from "@/app/components/documents/BuktiPembayaran";
import { useReactToPrint } from "react-to-print";

const Payments = () => {
  // Ref untuk dokumen print
  const printRef = useRef();
  const user = useUser();
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
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [openVerificationModal, setOpenVerificationModal] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  const getDataPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/payments?role_id=${user.role_id}`);
      console.log("data payments", response);
      if (response.data.success) {
        setDataPayments(response.data.data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
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

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const handleApprove = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenApprovalModal(true);
  };

  const handleReject = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenRejectedModal(true);
  };

  const handleVerification = (record) => {
    // console.log("verification record", record);
    setSelectedData(record);
    setOpenVerificationModal(true);
  };

  // useReactToPrint di level atas
  const handlePrintAction = useReactToPrint({
    contentRef: printRef, // langsung ref
    documentTitle: "Persetujuan Sewa Ruangan",
    onAfterPrint: () => setTimeout(() => setPrintData(null), 200),
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

  // handlers
  const handlePrint = (record) => {
    // cukup set selectedData — useEffect akan menangani memanggil printAction
    setPrintData(record);
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
    paymentTypeMap
  );

  const cicilanFilters = generateFilters(
    dataPayments,
    ["payments", "payment_number"],
    cicilanMap
  );

  const approvalStatusFilters = generateFilters(
    dataPayments,
    ["payments", "approval_status"],
    approvalStatusMap
  );

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
      title: "Nama Penyewa",
      dataIndex: ["tenant_application", "tenant_name"],
      filters: tenantName,
      onFilter: createOnFilter(["tenant_application", "tenant_name"]),
      filterSearch: true,
      sorter: (a, b) =>
        a.tenant_application.tenant_name.localeCompare(
          b.tenant_application.tenant_name
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
      title: "Cicilan Ke",
      dataIndex: ["payments", "payment_number"],
      filters: cicilanFilters,
      onFilter: createOnFilter(["payments", "payment_number"]),
      // filterSearch: true,
      render: (text, record) => {
        return record.tenant_application.payment_type === "cicilan" ? (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color="lime"
            key={record.payments?.payment_id}
            style={{ fontWeight: "bold" }}
          >
            {record.payments?.payment_number === 1
              ? "Cicilan 1"
              : record.payments?.payment_number === 2
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
      render: (text, record) => (
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
        >
          {formatRupiah(record.payments?.payment_amount)}
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
          <Tooltip title="Verifikasi Pembayaran">
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
          {record.payments?.approval_status === "proses" && (
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
      <BreadcrumbPage menuList={menuDivisiKeuangan} />
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
            mt: 6,
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
            rowKey={(record) => record.payments.payment_id}
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
      <RejectedModal
        open={openRejectedModal}
        onClose={() => setOpenRejectedModal(false)}
        selectedData={selectedData}
        loading={loading}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
        user={user}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
      />
      <PaymentApprovalModal
        open={openVerificationModal}
        onClose={() => setOpenVerificationModal(false)}
        selectedData={selectedData}
        loading={loading}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />
      <ImagePreviewModal
        open={openBuktiPembayaranModal}
        onClose={() => setOpenBuktiPembayaranModal(false)}
        imageUrl={selectedData?.proof_file_path}
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
    </Box>
  );
};

export default Payments;
