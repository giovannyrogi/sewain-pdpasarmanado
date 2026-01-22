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
import TerminationApprovalModal from "@/app/components/approvalmodal/TerminationApprovalModal";
import TenantTerminationApprovalModal from "@/app/components/tenant-termination-approval-modal/TenantTerminationApprovalModal";
import TenantRejectTerminationModal from "@/app/components/tenant-termination-approval-modal/TenantRejectTerminationModal";
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

  const getDataTenantTerminations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/tenant-termination-approval/by-role`,
        {
          params: { role_id: user.role_id },
        }
      );

      // console.log("tenant terminations approval", response);
      setDataTenantTerminations(response.data.data);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.log("error", error);
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

  const handleTerminationApproval = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenTerminationApprovalModal(true);
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
      <TenantTerminationApprovalModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        setLoadingMessage={setLoadingMessage}
        getDataTenantTerminations={getDataTenantTerminations}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <TenantRejectTerminationModal
        open={cancelTenantTerminationsModal}
        onClose={() => setCancelTenantTerminationsModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
        getDataApprovals={getDataTenantTerminations}
        user={user}
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
      <TerminationApprovalModal
        open={openTerminationApprovalModal}
        onClose={() => setOpenTerminationApprovalModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        setLoadingMessage={setLoadingMessage}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
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
