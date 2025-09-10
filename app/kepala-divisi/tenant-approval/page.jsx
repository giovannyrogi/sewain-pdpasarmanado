"use client";
import {
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
import menuSuperadmin from "@/app/components/menu/MenuItemSuperadmin";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import { useUser } from "@/app/utils/useUser";
import ApprovalModal from "@/app/components/approvalmodal/page";
import TenantRejectModal from "@/app/components/tenantapprovalmodal/TenantRejectModal";
import TenantApprovalModal from "@/app/components/tenantapprovalmodal/TenantApprovalModal";
import menuKepalaDivisi from "@/app/components/menu/MenuItemKepalaDivisi";

const TenantApproval = () => {
  const user = useUser();
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
        console.log("data approval", res.data);

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

  const filteredData = approvalList.filter((item) =>
    item.role_name?.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
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

  const tenantNameFilters = generateFilters(approvalList, "tenant_name");
  const locationFilters = generateFilters(approvalList, "location_name");

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
      width: 150,
    },
    {
      title: "Lokasi",
      dataIndex: "location_name",
      filters: locationFilters,
      onFilter: createOnFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => a.location_name.localeCompare(b.location_name),
      sortDirections: ["ascend", "descend"],
      width: 130,
    },
    {
      title: "Ruangan",
      dataIndex: "room_number",
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={record.id % 2 === 0 ? "pink" : "geekblue"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.room_number}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Status Persetujuan",
      dataIndex: "approval_status",
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.approval_status === "proses" && themeMode === "dark"
                ? "yellow"
                : record.approval_status === "proses" && themeMode === "light"
                ? "orange"
                : "green"
            }
            key={record.id}
            style={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => handleApproval(record)}
          >
            {record.approval_status === "proses"
              ? `Dalam Proses ${record.current_step}/5`
              : "Disetujui"}
          </Tag>
        );
      },
      width: 150,
    },
    {
      title: "Tanggal Dibuat",
      dataIndex: "created_at",
      filterSearch: true,
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      sortDirections: ["ascend", "descend"],
      render: (text, record) =>
        moment(record.created_at).format("DD-MM-YYYY HH:mm:ss"),
      width: 150,
    },
    {
      title: "Tanggal Diperbarui",
      dataIndex: "updated_at",
      filterSearch: true,
      sorter: (a, b) => a.updated_at.localeCompare(b.updated_at),
      sortDirections: ["ascend", "descend"],
      render: (text, record) =>
        moment(record.updated_at).format("DD-MM-YYYY HH:mm:ss"),
      width: 150,
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
      <BreadcrumbPage menuList={menuKepalaDivisi} />

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
