"use client";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import formatRupiah from "@/app/components/formatrupiah/page";
import menuDevisiKontrak from "@/app/components/menu/MenuItemDivisiKontrak";
import AddIdentity from "./AddIdentity";
import EditIdentity from "./EditIdentity";
import DeleteIdentity from "./DeleteIdentity";
import InformationPreviewModal from "@/app/components/informationpreviewmodal/page";
import menuKepalaDivisi from "@/app/components/menu/MenuItemKepalaDivisi";

const IdentityList = () => {
  const [dataIdentities, setDataIdentities] = useState([]);
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
  const [openViewInformationModal, setOpenViewInformationModal] =
    useState(false);

  const getDataIdentities = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/identity-list");
      // console.log("data identitas", response);
      setDataIdentities(response.data.data);
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
    getDataIdentities();
  }, []);

  const filteredData = dataIdentities.filter((item) => {
    // const isAvailableText =
    //   item.is_available === false
    //     ? "tersedia"
    //     : item.is_available === true
    //     ? "tidak tersedia"
    //     : "";
    return (
      item.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.nik?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.occupation?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.nationality?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.birth_place?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.status?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

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

  const handleViewInformation = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenViewInformationModal(true);
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

  const nameFilters = generateFilters(dataIdentities, "full_name");
  const statusFilters = [
    { text: "Aktif", value: "active" },
    { text: "Tidak Aktif", value: "inactive" },
    { text: "Blacklist", value: "blacklisted" },
  ];

  const columns = [
    {
      title: "Nama Lengkap",
      dataIndex: "full_name",
      filters: nameFilters,
      onFilter: createOnFilter("full_name"),
      filterSearch: true,
      sorter: (a, b) => a.full_name.localeCompare(b.full_name),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.full_name}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "NIK",
      dataIndex: "nik",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.nik}
        </Typography>
      ),
      width: 100,
    },
    {
      title: "Tempat, Tanggal Lahir",
      dataIndex: "nik",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.birth_place},{" "}
          {moment(record.birth_date).format("D MMMM YYYY")}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Pekerjaan",
      dataIndex: "occupation",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.occupation}
        </Typography>
      ),
      width: 100,
    },
    // {
    //   title: "Kewarganegaraan",
    //   dataIndex: "nationality",
    //   render: (text, record) => (
    //     <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
    //       {record.nationality}
    //     </Typography>
    //   ),
    //   width: 120,
    // },
    {
      title: "Status",
      dataIndex: "status",
      filters: statusFilters,
      onFilter: (value, record) => record.status === value,
      render: (text, record) => {
        return (
          <Tag
            color={
              record.status === "active"
                ? "green"
                : record.status === "inactive"
                ? "red"
                : "yellow"
            }
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.status === "active"
              ? "Aktif"
              : record.status === "inactive"
              ? "Tidak Aktif"
              : "Blacklist"}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Actions",
      key: "action",
      align: "center",
      width: 100,
      fixed: "right",
      render: (text, record) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button
            size="small"
            variant={themeMode === "dark" ? "outlined" : "contained"}
            color="info"
            onClick={() => handleEdit(record)}
            sx={{ minWidth: 0, px: 1 }}
          >
            <Icon icon="line-md:edit" fontSize={18} />
          </Button>
          <Button
            size="small"
            variant={themeMode === "dark" ? "outlined" : "contained"}
            color="success"
            onClick={() => handleViewInformation(record)}
            sx={{ minWidth: 0, px: 1 }}
          >
            <Icon icon="line-md:chat-round-alert" fontSize={18} />
          </Button>
          <Button
            size="small"
            variant={themeMode === "dark" ? "outlined" : "contained"}
            color="error"
            onClick={() => handleDelete(record)}
            sx={{ minWidth: 0, px: 1 }}
          >
            <Icon icon="line-md:close-circle" fontSize={18} />
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      <BreadcrumbPage menuList={menuKepalaDivisi} />

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
          <Icon icon="qlementine-icons:id-card-16" fontSize="20px" />
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
      <AddIdentity
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onNotify={(onNotify) => setSnackbar(onNotify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataIdentities={getDataIdentities}
      />
      <EditIdentity
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onNotify={(onNotify) => setSnackbar(onNotify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataIdentities={getDataIdentities}
        selectedData={selectedData}
      />
      <DeleteIdentity
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onNotify={(onNotify) => setSnackbar(onNotify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        selectedData={selectedData}
        getDataIdentities={getDataIdentities}
      />
      <InformationPreviewModal
        open={openViewInformationModal}
        onClose={() => setOpenViewInformationModal(false)}
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
    </Box>
  );
};

export default IdentityList;
