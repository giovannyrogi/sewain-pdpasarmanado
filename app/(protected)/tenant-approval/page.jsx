"use client";
import {
  alpha,
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import { useUser } from "@/app/utils/useUser";
import ApprovalModal from "@/app/components/approvalmodal/page";
import TenantRejectModal from "@/app/components/tenantapprovalmodal/TenantRejectModal";
import TenantApprovalModal from "@/app/components/tenantapprovalmodal/TenantApprovalModal";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";

const TenantApproval = () => {
  const { user } = useUser();
  const [approvalList, setApprovalList] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:1200px)");
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
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [
    openTenantApprovalInformationModal,
    setOpenTenantApprovalInformationModal,
  ] = useState(false);
  const [openTenantRejectModal, setOpenTenantRejectModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const getDataApprovals = async () => {
    if (!user) {
      console.log("User not found");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.get(`/api/tenant-approval/by-role`, {
        params: { role_id: user.role_id },
      });

      if (res.data.success) {
        // console.log("user", user);

        // console.log("data approval", res.data);

        setTimeout(() => {
          setApprovalList(res.data.data);
          setLoading(false);
        }, 1000);
      } else {
        console.log("Error fetching tenant approval:", res.data.message);
        setLoading(false);
      }
    } catch (err) {
      console.log("Error fetch tenant approval:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getDataApprovals();
    }
  }, [user]);

  const handleTenantApprove = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleReject = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenTenantRejectModal(true);
  };

  const handleApproval = (record) => {
    setSelectedData(record);
    setOpenApprovalModal(true);
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

  const tenantNameFilters = generateFilters(approvalList, "tenant_name");
  const locationFilters = generateFilters(approvalList, "location_name");
  const documentNumberFilters = generateFilters(
    approvalList,
    "document_number"
  );

  const approvalStatusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Tidak Disetujui", value: "rejected" },
    { text: "Disetujui", value: "approved" },
  ];

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // Utility untuk filter dinamis
  const filteredData = approvalList.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return (
      item.tenant_name?.toLowerCase().includes(search) ||
      item.location_name?.toLowerCase().includes(search) ||
      item.room_number?.toLowerCase().includes(search) ||
      item.document_number?.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      title: "Nama Penyewa",
      dataIndex: "tenant_name",
      filters: tenantNameFilters,
      onFilter: createOnFilter("tenant_name"),
      sorter: (a, b) => a.tenant_name.localeCompare(b.tenant_name),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.tenant_name.charAt(0).toUpperCase() +
            record.tenant_name.slice(1)}
        </Typography>
      ),
      width: 200,
    },
    {
      title: "Nomor Dokumen",
      dataIndex: "document_number",
      filters: documentNumberFilters,
      onFilter: createOnFilter("document_number"),
      filterSearch: true,
      render: (text, record) => {
        // Ambil hanya angka dokumen di depan sebelum tanda "/"
        const documentNumberRaw = record?.document_number || "-";
        const documentNumberOnly = documentNumberRaw.split("/")[0].trim(); // hasil: "001"
        return (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "center" }}
          >
            {documentNumberOnly}
          </Typography>
        );
      },
      width: 180,
      align: "left",
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
      render: (text, record) => (
        <Typography sx={{ fontSize: "12px" }}>{record.room_number}</Typography>
      ),
      width: 150,
    },
    {
      title: "Status Persetujuan",
      dataIndex: "approval_status",
      filters: approvalStatusFilters,
      onFilter: createOnFilter("approval_status"),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.approval_status === "proses"
                ? "yellow"
                : record.approval_status === "approved"
                ? "green"
                : "red"
            }
            key={record.tenant_application_id}
            style={{
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => handleApproval(record)}
          >
            {record.approval_status === "proses"
              ? `Dalam Proses ${record.current_step}/5`
              : record.approval_status === "approved"
              ? "Disetujui"
              : record.approval_status === "rejected"
              ? "Tidak Disetujui"
              : "Dibatalkan"}

            {record?.role_id === user?.role_id &&
            record?.current_step === user?.step_order &&
            record?.approval_status === "proses" ? (
              <Tooltip title="Menunggu Approval Anda">
                <Icon
                  icon={"icon-park-twotone:info"}
                  fontSize={18}
                  color={theme.palette.error.main}
                  style={{ marginLeft: 5 }}
                />
              </Tooltip>
            ) : record?.role_id === user?.role_id &&
              record?.current_step >= user?.step_order &&
              (record?.approval_status === "approved" ||
                record?.approval_status === "proses") ? (
              <Tooltip title="Sudah Approve">
                <Icon
                  icon={"ph:seal-check-duotone"}
                  fontSize={18}
                  color={theme.palette.success.main}
                  style={{ marginLeft: 5 }}
                />
              </Tooltip>
            ) : record?.role_id === user?.role_id &&
              record?.current_step <= user?.step_order &&
              record?.approval_status === "proses" ? (
              <Tooltip title="Menunggu Giliran">
                <Icon
                  icon="svg-spinners:ring-resize"
                  fontSize={18}
                  color={"yellow"}
                  style={{ marginLeft: 5 }}
                />
              </Tooltip>
            ) : (
              <Tooltip title="Permintaan Ditolak">
                <Icon
                  icon="line-md:close-circle-twotone"
                  fontSize={18}
                  color={theme.palette.error.main}
                  style={{ marginLeft: 5 }}
                />
              </Tooltip>
            )}
          </Tag>
        );
      },
      width: 170,
    },
    {
      title: "Tanggal Dibuat",
      dataIndex: "created_at",
      filterSearch: true,
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => {
        return (
          <Typography sx={{ fontSize: "12px" }}>
            {moment(record.created_at).format("DD-MM-YYYY HH:mm:ss")}
          </Typography>
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
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Detail Data Pemohon">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="info"
              onClick={() => handleTenantApprove(record)}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="mdi:smart-card-outline" fontSize={18} />
            </Button>
          </Tooltip>
          {record.status === "approved" || record.status === "rejected" ? (
            ""
          ) : (
            <Tooltip title="Tolak">
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

      {/* <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          transition: "all 0.3s",
          mb: 2,
          mt: 3,
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
          <Icon icon="oui:app-users-roles" fontSize="20px" />
        </Button>
      </Box> */}
      <ConfigProvider
        theme={{
          algorithm:
            themeMode === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: theme.palette.primary.main, // warna utama (angka aktif, outline, dsb)
            // colorText: theme.palette.text.primary, // warna teks default
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
            placeholder="Cari Nama User"
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginBottom: 20, marginTop: 10 }}
          />
          <Table
            rowKey="id"
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
      <TenantApprovalModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        setLoadingMessage={setLoadingMessage}
        getDataApprovals={getDataApprovals}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <TenantRejectModal
        open={openTenantRejectModal}
        onClose={() => setOpenTenantRejectModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataApprovals={getDataApprovals}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <ApprovalModal
        open={openApprovalModal}
        onClose={() => setOpenApprovalModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
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

export default TenantApproval;
