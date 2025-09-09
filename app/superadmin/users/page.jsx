"use client";
import { Box, Button, Paper, Typography, useTheme } from "@mui/material";
import React, { use, useEffect, useState } from "react";
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
import menuSuperadmin from "@/app/components/menu/MenuItemSuperadmin";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import { useUser } from "@/app/utils/useUser";

const Users = () => {
  const [dataUsers, setDataUsers] = useState([]);
  const [dataRoles, setDataRoles] = useState([]);
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
  const [currentRole, setCurrentRole] = useState("");
  const user = useUser();

  const getUsersData = async () => {
    setLoading(true);
    try {
      // Kirim role_name sebagai query parameter
      const response = await axios.get(`/api/users?role_id=${user.role_id}`);
      console.log("Users data", response);
      setDataUsers(response.data.data);
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

  const getDataRoles = async () => {
    setLoading(true);

    try {
      const response = await axios.get("/api/roles");
      console.log("data role", response.data);
      setDataRoles(response.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user) {
      getUsersData();
      getDataRoles();
    }
  }, [user]);

  const filteredData = dataUsers.filter(
    (item) =>
      item.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phone?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.role_name?.toLowerCase().includes(searchText.toLowerCase())
  );

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

  // Utility untuk filter dinamis
  function generateFilters(data, key) {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({ text: val, value: val }));
  }

  function createOnFilter(key) {
    return (value, record) => record[key] === value;
  }

  const nameFilters = generateFilters(dataUsers, "full_name");
  const roleFilters = generateFilters(dataUsers, "role_name");

  const columns = [
    {
      title: "Nama User",
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
      title: "Username",
      dataIndex: "username",
      width: 100,
    },
    {
      title: "Password",
      dataIndex: "password",
      render: (text) => (
        <span>{"*".repeat(text?.length > 0 ? text.length : 6)}</span>
      ),
      width: 100,
    },
    {
      title: "Role",
      dataIndex: "role_name",
      filters: roleFilters,
      onFilter: createOnFilter("role_name"),
      filterSearch: true,
      width: 150,
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
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        getDataRoles={getDataRoles}
        onNotify={(notif) => setSnackbar(notif)}
        currentRole={currentRole}
        dataRoles={dataRoles}
      />
      <EditUser
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        getDataRoles={getDataRoles}
        selectedData={selectedData}
        onNotify={(notif) => setSnackbar(notif)}
        currentRole={currentRole}
        dataRoles={dataRoles}
      />
      <DeleteUser
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getUsersData={getUsersData}
        getDataRoles={getDataRoles}
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
