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
import AddRoom from "./AddRoom";
import EditRoom from "./EditRoom";
import DeleteRoom from "./DeleteRoom";
import formatRupiah from "@/app/components/formatrupiah/page";
import NotesModal from "./NotesModal";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";
import { formatNumber } from "@/app/utils/formatNumber";

const Rooms = () => {
  const [dataRooms, setDataRooms] = useState([]);
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
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [openViewNotesModal, setOpenViewNotesModal] = useState(false);

  const getRoomsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/rooms");
      // console.log("rooms", response);
      setDataRooms(response.data.data);
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
      // console.log("locations", response);
      setTimeout(() => {
        setDataLocations(response.data.data);
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
    getRoomsData();
    getLocationsData();
  }, []);

  const filteredData = dataRooms.filter((item) => {
    // const isAvailableText =
    //   item.is_available === false
    //     ? "tersedia"
    //     : item.is_available === true
    //     ? "tidak tersedia"
    //     : "";

    return (
      item.room_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.floor?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.room_length
        ?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.room_width
        ?.toString()
        .toLowerCase()
        .includes(searchText.toLowerCase())
      // isAvailableText.includes(searchText.toLowerCase())
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

  // Utility untuk filter dinamis
  function generateFilters(data, key) {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({ text: val, value: val }));
  }

  function createOnFilter(key) {
    return (value, record) => record[key] === value;
  }

  const nameFilters = generateFilters(dataRooms, "location_name");
  const roomFloorFilter = generateFilters(dataRooms, "room_floor");
  const statusFilters = [
    { text: "Tersedia", value: "available" },
    { text: "Tidak Tersedia", value: "occupied" },
    { text: "Dalam Perbaikan", value: "maintenance" },
    { text: "Tidak Layak", value: "unavailable" },
  ];

  const handleViewNotes = (record) => {
    setSelectedData(record);
    setOpenViewNotesModal(true);
  };

  const columns = [
    {
      title: "No",
      dataIndex: "index",
      render: (text, record, index) => index + 1,
      width: 50,
      align: "center",
    },
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
      title: "Nomor Ruangan",
      dataIndex: "room_number",
      sorter: (a, b) => a.room_number.localeCompare(b.room_number),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => {
        return (
          // <Tag
          //   // warna random berdasarkan angka ganjil genap
          //   color={record.id % 2 === 0 ? "pink" : "geekblue"}
          //   key={record.id}
          //   style={{ fontWeight: "bold" }}
          // >
          //   {record.room_number}
          // </Tag>
          <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
            {record.room_number}
          </Typography>
        );
      },
      width: 170,
    },
    {
      title: "Lantai",
      dataIndex: "room_floor",
      filters: roomFloorFilter,
      onFilter: createOnFilter("room_floor"),
      filterSearch: true,
      sorter: (a, b) => a.room_floor.localeCompare(b.room_floor),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={themeMode === "dark" ? "orange" : "red"}
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.room_floor}
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
          {formatNumber(record.room_length)} m
        </Typography>
      ),
      width: 120,
    },
    {
      title: "Lebar (m)",
      dataIndex: "room_width",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatNumber(record.room_width)} m
        </Typography>
      ),
      width: 120,
    },
    {
      title: "Luas (m²)",
      dataIndex: "room_area",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {formatNumber(record.room_area)} m²
        </Typography>
      ),
      width: 120,
    },
    {
      title: "Jenis Harga",
      dataIndex: "price_type",
      render: (text, record) => (
        <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
          {record.price_type === "harga_per_meter"
            ? "Harga Per m²"
            : "Harga Tetap"}
        </Typography>
      ),
      width: 120,
    },
    {
      title: "Harga Sewa Ruangan",
      dataIndex: "price_per_m2_width",
      width: 180,
      render: (text, record) => (
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
        >
          {formatRupiah(record.price_per_m2)}
        </Typography>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: statusFilters,
      onFilter: (value, record) => record.status === value,
      render: (text, record) => {
        return (
          <Tag
            color={
              record.status === "available"
                ? "green"
                : record.status === "occupied"
                  ? "yellow"
                  : record.status === "maintenance"
                    ? "orange"
                    : "red"
            }
            key={record.id}
            style={{ fontWeight: "bold" }}
          >
            {record.status === "available"
              ? "Tersedia"
              : record.status === "occupied"
                ? "Sudah Terisi"
                : record.status === "maintenance"
                  ? "Dalam Perbaikan"
                  : "Tidak Layak"}
          </Tag>
        );
      },
      width: 100,
    },
    {
      title: "Catatan",
      dataIndex: "notes",
      width: 150,
      render: (text, record) => (
        <Tag
          color="lime"
          key={record.id}
          style={{ fontWeight: "bold" }}
          onClick={() => handleViewNotes(record)}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: "12px",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Lihat Catatan
          </Typography>
        </Tag>
      ),
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
      <BreadcrumbPage menuList={MENU_CONFIG} />

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
          <Icon icon="cil:room" fontSize="20px" />
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
      <AddRoom
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getRoomsData={getRoomsData}
        getLocationsData={getLocationsData}
        dataLocations={dataLocations}
        onNotify={(notif) => setSnackbar(notif)}
        setLoadingMessage={(message) => setLoadingMessage(message)}
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
        setLoadingMessage={(message) => setLoadingMessage(message)}
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
      />
      <NotesModal
        open={openViewNotesModal}
        onClose={() => setOpenViewNotesModal(false)}
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

export default Rooms;
