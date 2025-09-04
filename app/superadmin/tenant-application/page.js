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

const Applications = () => {
  const [dataApplications, setDataApplications] = useState([]);
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

  const getDataApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/applications");
      console.log("Applications", response);
      setDataApplications(response.data.data);
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
    getDataApplications();
  }, []);

  const filteredData = dataApplications.filter((item) => {
    // const isAvailableText =
    //   item.is_available === true
    //     ? "tersedia"
    //     : item.is_available === false
    //     ? "tidak tersedia"
    //     : "";

    // return (
    //   item.room_number?.toLowerCase().includes(searchText.toLowerCase()) ||
    //   item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
    //   item.floor?.toLowerCase().includes(searchText.toLowerCase()) ||
    //   item.room_length
    //     ?.toString()
    //     .toLowerCase()
    //     .includes(searchText.toLowerCase()) ||
    //   item.room_width
    //     ?.toString()
    //     .toLowerCase()
    //     .includes(searchText.toLowerCase())
    //   // isAvailableText.includes(searchText.toLowerCase())
    // );
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

  // Utility untuk filter dinamis
  function generateFilters(data, key) {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({ text: val, value: val }));
  }

  function createOnFilter(key) {
    return (value, record) => record[key] === value;
  }

  const nameFilters = generateFilters(dataApplications, "location_name");
  const floorFilter = generateFilters(dataApplications, "floor");
  const statusFilters = [
    { text: "Tersedia", value: true },
    { text: "Tidak Tersedia", value: false },
  ];

  const columns = [
    {
      title: "Nama Lokasi",
      dataIndex: "location_name",
      filters: nameFilters,
      onFilter: createOnFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => a.location_name.localeCompare(b.location_name),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.location_name}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Nomor",
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
      width: 100,
    },
    {
      title: "Lantai",
      dataIndex: "floor",
      filters: floorFilter,
      onFilter: createOnFilter("floor"),
      filterSearch: true,
      sorter: (a, b) => a.floor.localeCompare(b.floor),
      sortDirections: ["ascend", "descend"],
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
      title: "Status",
      dataIndex: "is_available",
      // sorter: (a, b) => Number(a.is_available) - Number(b.is_available),
      // sortDirections: ["ascend", "descend"],
      filters: statusFilters,
      onFilter: (value, record) => record.is_available === value,
      render: (text, record) => {
        if (typeof record?.is_available !== "boolean") return null;
        return (
          <Tag
            color={record.is_available ? "green" : "red"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.is_available ? "Tersedia" : "Tidak Tersedia"}
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
      {/* <AddRoom
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getRoomsData={getRoomsData}
        getLocationsData={getLocationsData}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <EditRoom
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getRoomsData={getRoomsData}
        getLocationsData={getLocationsData}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
      />
      <DeleteRoom
      open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getRoomsData={getRoomsData}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
      /> */}
      <LoadingBackdrop message="Loading..." open={loading} />
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
