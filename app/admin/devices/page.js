"use client";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import menuAdmin from "@/app/components/menu/MenuItemAdmin";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import {
  Box,
  Button,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  ConfigProvider,
  Flex,
  Input,
  Table,
  Tag,
  theme as antdTheme,
} from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";
import AddDevice from "./AddDevice";

const Devices = () => {
  const theme = useTheme();
  const { themeMode, setThemeMode } = useThemeMode();
  const isMobile = useMediaQuery("(max-width:1200px)");

  const [dataDevices, setDataDevices] = useState([]);
  const [dataUsersWithoutDeviceId, setDataUsersWithoutDeviceId] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [locationId, setLocationId] = useState("");

  const getDataDevices = async () => {
    setLoading(true);
    try {
      const getCurrentUserData = localStorage.getItem("loggedInUser");

      const { location_id } = JSON.parse(getCurrentUserData);

      setLocationId(location_id || "");

      // Kirim location_id sebagai query parameter
      const response = await axios.get(
        `/api/devices/searchdevicebylocationid?location_id=${location_id}`
      );
      console.log("Data Devices", response);
      setDataDevices(response.data.data || []);
    } catch (error) {
      console.log("error devices", error);
    } finally {
      setLoading(false);
    }
  };

  const getDataUsersWithoutDeviceId = async () => {
    setLoading(true);
    try {
      const getCurrentUserData = localStorage.getItem("loggedInUser");

      const { location_id } = JSON.parse(getCurrentUserData);
      // Kirim location_id sebagai query parameter
      const response = await axios.get(
        `/api/users/userwithoutdeviceid?location_id=${location_id}`
      );
      console.log("Users Without Device ID", response);
      setDataUsersWithoutDeviceId(response.data.data || []);
    } catch (error) {
      console.log("error users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDataDevices();
    getDataUsersWithoutDeviceId();
  }, []);

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

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // Generate unique filter options for Name and Address
  const nameDevicesFilters = [
    ...new Set(dataDevices.map((item) => item.device_name)),
  ].map((device_name) => ({ text: device_name, value: device_name }));

  const filteredData = dataDevices.filter(
    (item) =>
      item.device_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.device_code?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.assigned_username
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.device_code?.toLowerCase().includes(searchText.toLowerCase())
    // item.status?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nama Device",
      dataIndex: "device_name",
      filters: nameDevicesFilters,
      onFilter: (value, record) => record.name === value,
      sorter: (a, b) => a.device_name.localeCompare(b.device_name),
      sortDirections: ["ascend", "descend"],
      width: 150,
    },
    {
      title: "Kode Device",
      dataIndex: "device_code",
      width: 150,
    },
    {
      title: "Nama User",
      dataIndex: "assigned_username",
      width: 150,
    },
    // {
    //   title: "Nama Lokasi",
    //   dataIndex: "location_name",
    //   width: 150,
    // },
    {
      title: "Status",
      dataIndex: "status",
      render: (text, record) => (
        <Box>
          {record.status ? (
            <Tag color="green" style={{ fontWeight: "bold" }}>
              Aktif
            </Tag>
          ) : (
            <Tag color="red" style={{ fontWeight: "bold" }}>
              Tidak Aktif
            </Tag>
          )}
        </Box>
      ),
      width: 100,
    },
    {
      title: "Diupdate",
      dataIndex: "updated_at",
      sorter: (a, b) => a.updated_at.localeCompare(b.updated_at),
      sortDirections: ["ascend", "descend"],
      width: 120,
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      sortDirections: ["ascend", "descend"],
      width: 120,
    },
    {
      title: "Actions",
      key: "action",
      align: "center",
      width: isMobile ? 100 : 120,
      fixed: "right",
      render: (text, record) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => handleEdit(record)}
            sx={{ minWidth: 0, px: 1 }}
          >
            <Icon icon="line-md:edit" fontSize={18} />
          </Button>
          <Button
            size="small"
            variant="outlined"
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
      <BreadcrumbPage menuList={menuAdmin} />

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
          variant="outlined"
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
          Device
          <Icon icon="ant-design:plus-circle-twotone" fontSize="20px" />
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
      <AddDevice
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataDevices={getDataDevices}
        getDataUsersWithoutDeviceId={getDataUsersWithoutDeviceId}
        dataUsersWithoutDeviceId={dataUsersWithoutDeviceId}
        location_id={locationId}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <EditCategory
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataDevices={getDataDevices}
        location_id={locationId}
        selectedData={selectedData}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <DeleteCategory
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataDevices={getDataDevices}
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

export default Devices;
