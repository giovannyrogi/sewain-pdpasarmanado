"use client";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import AddLocation from "./AddLocation";
import Notification from "../../components/Notification";
import EditLocation from "./EditLocation";
import DeleteLocation from "./DeleteLocation";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import menuSuperadmin from "@/app/components/menu/MenuItemSuperadmin";
import menuDevisiKontrak from "@/app/components/menu/MenuItemDivisiKontrak";
import menuKepalaDivisi from "@/app/components/menu/MenuItemKepalaDivisi";

const Locations = () => {
  const [dataLocations, setDataLocations] = useState([]);
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
      // console.log("locations", response);
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

  useEffect(() => {
    getLocationsData();
  }, []);

  const filteredData = dataLocations.filter(
    (item) =>
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchText.toLowerCase())
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
  const cityFilters = generateFilters(dataLocations, "city");
  const provinceFilters = generateFilters(dataLocations, "province");
  const districtFilters = generateFilters(dataLocations, "district");
  const kelurahanFilters = generateFilters(dataLocations, "kelurahan");

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
      width: 200,
    },
    {
      title: "Kode Lokasi",
      dataIndex: "location_code",
      width: 130,
    },
    {
      title: "Provinsi",
      dataIndex: "province",
      filters: provinceFilters,
      onFilter: createOnFilter("province"),
      filterSearch: true,
      width: 150,
    },
    {
      title: "Kelurahan/Desa",
      dataIndex: "kelurahan",
      filters: kelurahanFilters,
      onFilter: createOnFilter("kelurahan"),
      filterSearch: true,
      width: 150,
    },
    {
      title: "Kabupaten/Kota",
      dataIndex: "city",
      filters: cityFilters,
      onFilter: createOnFilter("city"),
      filterSearch: true,
      width: 200,
    },
    {
      title: "Kecamatan",
      dataIndex: "district",
      filters: districtFilters,
      onFilter: createOnFilter("district"),
      filterSearch: true,
      width: 130,
    },
    {
      title: "Alamat",
      dataIndex: "street_address",
      // onFilter: (value, record) => record.address === value,
      // sorter: (a, b) => a.address.localeCompare(b.address),
      // sortDirections: ["ascend", "descend"],
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
          <Icon icon="line-md:map-marker-plus-twotone" fontSize="20px" />
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
            placeholder="Cari Nama Lokasi"
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
      <AddLocation
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <EditLocation
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
      />
      <DeleteLocation
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
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

export default Locations;
