"use client";
import { Box, Button, Paper, useTheme } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import AddUser from "./AddUser";
import EditUser from "./EditUser";
import DeleteUser from "./DeleteUser";
import axios from "axios";
import menuAdmin from "@/app/components/menu/MenuItemAdmin";
import BreadcrumbPage from "@/app/components/breadcrumb/page";

const Users = () => {
  const [dataUsers, setDataUsers] = useState([]);
  const [locationId, setLocationId] = useState("");
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddUserModal, setOpenAddUserModal] = useState(false);
  const [openEditUserModal, setOpenEditUserModal] = useState(false);
  const [openDeleteUserModal, setOpenDeleteUserModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const getUsersData = async () => {
    setLoading(true);
    try {
      const getCurrentUserData = localStorage.getItem("loggedInUser");

      const { location_id } = JSON.parse(getCurrentUserData);

      // Kirim location_id sebagai query parameter
      const response = await axios.get(
        `/api/users/searchuserbylocationid?location_id=${location_id}`
      );
      console.log("Users data", response);
      setDataUsers(response.data.data || []);
    } catch (error) {
      console.log("error", error);
    } finally {
      setLoading(false);
      
    }
  };

  const getLocationsData = async () => {
    const getCurrentUserData = localStorage.getItem("loggedInUser");
    const { location_id } = JSON.parse(getCurrentUserData);

    setLocationId(location_id || "");
  };

  useEffect(() => {
    getUsersData();
    getLocationsData();
  }, []);

  // Generate unique filter options for Name and Address
  const nameFilters = [...new Set(dataUsers.map((item) => item.name))].map(
    (name) => ({ text: name, value: name })
  );

  const locationFilters = [
    ...new Set(dataUsers.map((item) => item.location_name)),
  ].map((location_name) => ({ text: location_name, value: location_name }));

  const roleFilters = [...new Set(dataUsers.map((item) => item.role))].map(
    (role) => ({ text: role, value: role })
  );

  const filteredData = dataUsers.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.role?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleEdit = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenEditUserModal(true);
  };

  const handleDelete = (record) => {
    console.log("delete record", record);
    setSelectedData(record);
    setOpenDeleteUserModal(true);
  };

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const columns = [
    {
      title: "Nama User",
      dataIndex: "name",
      filters: nameFilters,
      onFilter: (value, record) => record.name === value,
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["ascend", "descend"],
      width: 150,
    },
    {
      title: "Username",
      dataIndex: "username",
      width: 100,
    },
    {
      title: "Password",
      dataIndex: "password",
      render: (text) => (
        // Tampilkan bintang sebanyak panjang password, atau minimal 6 bintang
        <span>{"*".repeat(text?.length > 0 ? text.length : 6)}</span>
      ),
      width: 100,
    },
    {
      title: "Role",
      dataIndex: "role",
      filters: roleFilters,
      width: 80,
      // onFilter: (value, record) => record.role === value,
      // sorter: (a, b) => a.role.localeCompare(b.role),
      // sortDirections: ["ascend", "descend"],
      width: 80,
    },
    {
      title: "Telepon",
      dataIndex: "phone",
      width: 100,
    },
    {
      title: "Email",
      dataIndex: "email",
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
          onClick={() => setOpenAddUserModal(true)}
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
          User
          <Icon icon="line-md:account-add" fontSize="20px" />
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
      <AddUser
        open={openAddUserModal}
        onClose={() => setOpenAddUserModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        location_id={locationId}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <EditUser
        open={openEditUserModal}
        onClose={() => setOpenEditUserModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        location_id={locationId}
        selectedData={selectedData}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <DeleteUser
        open={openDeleteUserModal}
        onClose={() => setOpenDeleteUserModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
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

export default Users;
