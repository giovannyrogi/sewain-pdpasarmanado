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
import menuDevisiKontrak from "@/app/components/menu/MenuItemDivisiKontrak";
import AddFloorPrice from "./AddFloorPrice";
import EditFloorPrice from "./EditFloorPrice";
import DeleteFloor from "./DeleteFloor";

const FloorPrices = () => {
  const [dataLocations, setDataLocations] = useState([]);
  const [dataFloor, setDataFloor] = useState([]);
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

  const getLocationsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/locations");
      console.log("locations", response);
      setDataLocations(response.data.data);
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

  const getFloorData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/location-floor-price");
      console.log("data floor", response);
      setDataFloor(response.data.data);
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
    getLocationsData();
    getFloorData();
  }, []);

  const filteredData = dataFloor.filter(
    (item) =>
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.floor?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.base_price?.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const nameFilters = generateFilters(dataLocations, "location_name");
  const floorFilters = generateFilters(dataLocations, "floor");

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
      title: "Lantai",
      dataIndex: "floor",
      filters: floorFilters,
      onFilter: createOnFilter("floor"),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={themeMode === "dark" ? "orange" : "red"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.floor}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Harga",
      dataIndex: "base_price",
      // onFilter: (value, record) => record.address === value,
      // sorter: (a, b) => a.address.localeCompare(b.address),
      // sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatRupiah(record.base_price)}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Diubah Tanggal",
      dataIndex: "updated_at",
      render: (text, record) =>
        moment(record.updated_at).format("DD-MM-YYYY HH:mm:ss"),
      width: 100,
    },
    {
      title: "Dibuat Tanggal",
      dataIndex: "created_at",
      render: (text, record) =>
        moment(record.created_at).format("DD-MM-YYYY HH:mm:ss"),
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
      <BreadcrumbPage menuList={menuDevisiKontrak} />

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
          <Icon icon="ion:pricetags-outline" fontSize="20px" />
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
            placeholder="Cari Data..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginBottom: 20, marginTop: 10 }}
          />
          <Table
            rowKey="id"
            key={"id"}
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
      <AddFloorPrice
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getFloorData={getFloorData}
        getLocationsData={getLocationsData}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <EditFloorPrice
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getFloorData={getFloorData}
        getLocationsData={getLocationsData}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
      />
      <DeleteFloor
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getFloorData={getFloorData}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
      />
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

export default FloorPrices;
