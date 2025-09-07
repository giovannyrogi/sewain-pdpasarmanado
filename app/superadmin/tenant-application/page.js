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
import menuSuperadmin from "@/app/components/menu/MenuItemSuperadmin";
import formatRupiah from "@/app/components/formatrupiah/page";
import AddTenantApplication from "./AddTenantApplication";
import InformationPreviewModal from "@/app/components/informationpreviewmodal/page";
import EditTenantApplication from "./EditTenantApplication";
import DeleteTenantApplication from "./DeleteTenantApplication";

const Applications = () => {
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
  const [openInformationModal, setOpenInformationModal] = useState(false);

  const getDataTenantApplication = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/tenant-application");
      console.log("tenant application", response);
      setDataTenantApplication(response.data.data);
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

  const getLocationsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/locations");
      console.log("locations", response);
      setDataLocations(response.data.data);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    getDataTenantApplication();
    getLocationsData();
  }, []);

  const filteredData = dataTenantApplication.filter((item) => {
    // const isAvailableText =
    //   item.is_available === true
    //     ? "tersedia"
    //     : item.is_available === false
    //     ? "tidak tersedia"
    //     : "";

    return (
      item.tenant_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.payment_type?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.room_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.down_payment?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.total_payment?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.remaining_payment?.toLowerCase().includes(searchText.toLowerCase())
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

  const handleInformation = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenInformationModal(true);
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

  const tenant_name = generateFilters(dataTenantApplication, "tenant_name");
  const floorFilter = generateFilters(dataTenantApplication, "floor");
  const locationFilters = generateFilters(
    dataTenantApplication,
    "location_name"
  );
  const paymentTypeFilters = generateFilters(
    dataTenantApplication,
    "payment_type"
  );

  const columns = [
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
      width: 200,
    },
    {
      title: "Ruangan",
      dataIndex: "room_number",
      sorter: (a, b) => a.room_number.localeCompare(b.room_number),
      sortDirections: ["ascend", "descend"],
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
      width: 120,
    },
    {
      title: "Lantai",
      dataIndex: "floor",
      filters: floorFilter,
      onFilter: createOnFilter("floor"),
      filterSearch: true,
      sorter: (a, b) => a.floor.localeCompare(b.floor),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={themeMode === "dark" ? "orange" : "red"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            L{record.floor}
          </Tag>
        );
      },
      width: 110,
    },
    {
      title: "Panjang (m)",
      dataIndex: "room_length",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.room_length} M
        </Typography>
      ),
      width: 110,
    },
    {
      title: "Lebar (m)",
      dataIndex: "room_width",
      width: 110,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.room_width} M
        </Typography>
      ),
    },
    {
      title: "Tanggal Mulai",
      dataIndex: "start_date",
      width: 150,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {moment(record.start_date).format("D MMMM YYYY")}
        </Typography>
      ),
    },
    {
      title: "Tanggal Selesai",
      dataIndex: "end_date",
      width: 150,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {moment(record.end_date).format("D MMMM YYYY")}
        </Typography>
      ),
    },
    {
      title: "Tipe Pembayaran",
      dataIndex: "payment_type",
      filters: paymentTypeFilters,
      onFilter: createOnFilter("payment_type"),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={record.payment_type === "cicilan" ? "blue" : "green"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
          </Tag>
        );
      },
      width: 160,
    },
    {
      title: "Uang Muka(DP)",
      dataIndex: "down_payment",
      filterSearch: true,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatRupiah(record.down_payment)}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Sisa Pembayaran",
      dataIndex: "remaining_payment",
      filterSearch: true,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatRupiah(record.remaining_payment)}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Total Pembayaran",
      dataIndex: "total_payment",
      filterSearch: true,
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatRupiah(record.total_payment)}
        </Typography>
      ),
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
      <BreadcrumbPage menuList={menuSuperadmin} />

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
          <Icon icon="fluent:document-queue-add-20-regular" fontSize="20px" />
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
      <AddTenantApplication
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
      />
      <EditTenantApplication
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
      />
      <DeleteTenantApplication
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataTenantApplication={getDataTenantApplication}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        setLoadingMessage={setLoadingMessage}
        selectedData={selectedData}
      />
      <InformationPreviewModal
        open={openInformationModal}
        onClose={() => setOpenInformationModal(false)}
        selectedData={selectedData}
        theme={theme}
        themeMode={themeMode}
        title="Preview Informasi Pemohon"
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

export default Applications;
