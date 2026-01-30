"use client";
import {
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import moment from "moment";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import formatRupiah from "@/app/components/formatrupiah/page";
import AddTenantApplication from "./AddTenantApplication";
import EditTenantApplication from "./EditTenantApplication";
import DeleteTenantApplication from "./DeleteTenantApplication";
import ApprovalModal from "@/app/components/approvalmodal/page";
import { useUser } from "@/app/utils/useUser";
import PersetujuanSewaRuangan from "@/app/components/documents/PersetujuanSewaRuangan";
import { useReactToPrint } from "react-to-print";
import UpdateDocumentDate from "./UpdateDocumentDate";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";
import DetailTenantApplicationModal from "@/app/components/tenantapplicationmodal/DetailTenantApplicationModal";
import Image from "next/image";
import SuratPernyataanPenyewa from "@/app/components/documents/SuratPernyataanPenyewa";
import { useRouter } from "next/navigation";
import XLSX from "xlsx-js-style";
import PrintDocumentTenant from "@/app/components/documents/PrintDocumentTenant";

const Applications = () => {
  const router = useRouter();
  // Ref untuk dokumen print
  const printRef = useRef();
  const printRefSuratPernyataanPenyewa = useRef();
  const { user } = useUser();
  const [dataTenantApplication, setDataTenantApplication] = useState([]);
  const [dataLocations, setDataLocations] = useState([]);
  const [dataAvailableRooms, setDataAvailableRooms] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openNonAktif, setOpenNonAktif] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [
    openTenantApprovalInformationModal,
    setOpenTenantApprovalInformationModal,
  ] = useState(false);

  const [openUpdateDateModal, setOpenUpdateDateModal] = useState(false);
  const [printType, setPrintType] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getDataTenantApplication = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/tenant-application");
      // console.log("tenant application", response);
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
      // console.log("locations", response);
      setDataLocations(response.data.data);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    if (user) {
      getDataTenantApplication();
      getLocationsData();
    }
  }, [user]);

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // useReactToPrint di level atas
  const handlePrintAction = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Dokumen Sewa Ruangan",
    onAfterPrint: () => setTimeout(() => setPrintData(null), 200),
  });

  // handlers print
  const handlePrintDoc = (record) => {
    setPrintData(record);

    setTimeout(() => {
      handlePrintAction();
    }, 300);
  };

  const handleEdit = (record) => {
    // console.log("edit record", record);
    setSelectedData(record);
    setOpenEditModal(true);
  };

  const handlePreviewData = (record) => {
    setLoading(true);
    // setLoadingMessage("Loading...");
    router.push(`/tenant-application/${record?.tenant_application_id}`);
  };

  const handleDelete = (record) => {
    // console.log("delete record", record);
    setSelectedData(record);
    setOpenDeleteModal(true);
  };

  const handleApproval = (record) => {
    setSelectedData(record);
    setOpenApprovalModal(true);
  };

  const handleTenantApprove = (record) => {
    // console.log("handleTenantApprove record", record);
    setSelectedData(record);
    setOpenTenantApprovalInformationModal(true);
  };

  const handleUpdateDate = (record) => {
    // console.log("handleTenantApprove record", record);
    setSelectedData(record);
    setOpenUpdateDateModal(true);
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
    "location_name",
  );
  const paymentTypeFilters = generateFilters(
    dataTenantApplication,
    "payment_type",
  );

  const documentNumberFilters = generateFilters(
    dataTenantApplication,
    "document_number",
  );

  const approvalStatusFilters = [
    { text: "Dalam Proses", value: "proses" },
    { text: "Ditolak", value: "rejected" },
    { text: "Disetujui", value: "approved" },
  ];

  const filteredData = dataTenantApplication.filter((item) => {
    return (
      item.tenant_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.payment_type?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.room_number?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.down_payment?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.total_payment?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.remaining_payment
        ?.toLowerCase()
        .includes(searchText.toLowerCase()) ||
      item.document_number?.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const columns = [
    {
      title: "No",
      dataIndex: "index",
      render: (text, record, index) => index + 1,
      width: 50,
      align: "center",
    },
    {
      title: "Nama Penyewa",
      dataIndex: "tenant_name",
      filters: tenant_name,
      onFilter: createOnFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => a.tenant_name.localeCompare(b.tenant_name),
      sortDirections: ["ascend", "descend"],
      width: 200,
    },
    {
      title: "Nomor Dokumen",
      dataIndex: "document_numnber",
      filters: documentNumberFilters,
      onFilter: createOnFilter("document_numnber"),
      filterSearch: true,
      render: (text, record) => {
        // Ambil hanya angka dokumen di depan sebelum tanda "/"
        const documentNumberRaw = record?.document_number || "-";
        const documentNumberOnly = documentNumberRaw.split("/")[0].trim(); // hasil: "001"
        return (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "center" }}
          >
            {documentNumberOnly}
          </Typography>
        );
      },
      width: 180,
      align: "left",
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
          <Typography sx={{ fontSize: "12px" }}>
            No. {record.room_number}
          </Typography>
        );
      },
      width: 150,
    },
    {
      title: "Lantai",
      dataIndex: "floor",
      filters: floorFilter,
      onFilter: createOnFilter("floor"),
      filterSearch: true,
      sorter: (a, b) => a.floor.localeCompare(b.floor),
      sortDirections: ["ascend", "descend"],
      // render: (text, record) => {
      //   return (
      //     <Tag
      //       // warna random berdasarkan angka ganjil genap
      //       color={themeMode === "dark" ? "orange" : "red"}
      //       key={record.tenant_application_id}
      //       style={{ fontWeight: "bold" }}
      //     >
      //       {record.floor}
      //     </Tag>
      //   );
      // },
      width: 110,
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
            key={record.tenant_application_id}
            style={{ fontWeight: "bold" }}
          >
            {record.payment_type === "cicilan" ? "Cicilan" : "Lunas"}
          </Tag>
        );
      },
      width: 160,
    },
    {
      title: "Status Persetujuan",
      dataIndex: "approval_status",
      filters: approvalStatusFilters,
      onFilter: createOnFilter("approval_status"),
      filterSearch: true,
      render: (text, record) => {
        return (
          <Tag
            // warna random berdasarkan angka ganjil genap
            color={
              record.approval_status === "proses"
                ? "yellow"
                : record.approval_status === "approved"
                  ? "green"
                  : "red"
            }
            key={record.tenant_application_id}
            style={{
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onClick={() => handleApproval(record)}
          >
            {record.approval_status === "proses"
              ? `Dalam Proses ${record.current_step}/5`
              : record.approval_status === "approved"
                ? "Disetujui"
                : record.approval_status === "rejected"
                  ? "Tidak Disetujui"
                  : "Dibatalkan"}
          </Tag>
        );
      },
      width: 170,
    },
    {
      title: "Uang Muka(DP)",
      dataIndex: "down_payment",
      filterSearch: true,
      render: (text, record) => (
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
        >
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
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
        >
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
        <Typography
          sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "end" }}
        >
          {formatRupiah(Number(record.total_payment))}
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
      render: (text, record) =>
        record.approval_status === "approved" ? (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Tooltip title="Detail Data Pemohon">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color={themeMode === "dark" ? "inherit" : "success"}
                onClick={() => handleTenantApprove(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon
                  icon="mdi:smart-card-outline"
                  color={themeMode === "dark" ? "inherit" : "white"}
                  fontSize={18}
                />
              </Button>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
            <Tooltip title="Edit Data">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color="info"
                onClick={() => handleEdit(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon icon="line-md:edit" fontSize={18} />
              </Button>
            </Tooltip>

            <Tooltip title="Detail Data Pemohon">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color={themeMode === "dark" ? "inherit" : "success"}
                onClick={() => handleTenantApprove(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon
                  icon="mdi:smart-card-outline"
                  color={themeMode === "dark" ? "inherit" : "white"}
                  fontSize={18}
                />
              </Button>
            </Tooltip>
            {!record?.document_number ? (
              <Tooltip title="Update Masa Berlaku Dokumen">
                <Button
                  size="small"
                  variant={themeMode === "dark" ? "outlined" : "contained"}
                  color="success"
                  onClick={() => handleUpdateDate(record)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  <Icon
                    icon="line-md:calendar"
                    fontSize={18}
                    style={{
                      color: themeMode === "dark" ? "green" : "white",
                    }}
                  />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Print Dokumen">
                <Button
                  size="small"
                  variant={themeMode === "dark" ? "outlined" : "contained"}
                  color="primary"
                  onClick={() => handlePrintDoc(record)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  <Icon icon="streamline-ultimate:print-text" fontSize={18} />
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Hapus Data">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                color="error"
                onClick={() => handleDelete(record)}
                sx={{ minWidth: 0, px: 1 }}
              >
                <Icon icon="line-md:close-circle" fontSize={18} />
              </Button>
            </Tooltip>
          </Box>
        ),
    },
  ];

  const handleExportExcel = () => {
    // cek kalau data kosong
    if (filteredData.length === 0) {
      setSnackbar({
        open: true,
        message: "Tidak ada data untuk di export",
        severity: "error",
      });
      return;
    }

    // === Hitung Grand Total ===
    const grandTotal = filteredData.reduce(
      (acc, item) => acc + Number(item.total_payment),
      0,
    );

    // === Data utama ===
    const exportData = filteredData.map((item) => ({
      "Nama Penyewa": item?.location_name ? item?.location_name : "-",
      "Nomor Dokumen": item?.document_number ? item?.document_number : "-",
      "Nomor Ruangan": item?.room_number ? item?.room_number : "-",
      Lantai: item?.floor ? item?.floor : "-",
      "Masa Berlaku":
        item?.start_date && item?.end_date
          ? `${moment(item?.start_date).format("Do MMM YYYY")} s/d ${moment(item?.end_date).format("Do MMM YYYY")}`
          : "-",
      "Status Persetujuan":
        item?.approval_status === "proses"
          ? "Dalam Proses"
          : item?.approval_status === "approved"
            ? "Disetujui"
            : item?.approval_status === "rejected"
              ? "Ditolak"
              : "-",
      "Jenis Pembayaran":
        item?.payment_type === "cicilan"
          ? "Cicilan"
          : item?.payment_type === "lunas"
            ? "Lunas"
            : "-",
      "Uang Muka": item?.down_payment ? formatRupiah(item?.down_payment) : "-",
      "Sisa Pembayaran": item?.remaining_payment
        ? formatRupiah(item?.remaining_payment)
        : "-",
      "Total Pembayaran": item?.total_payment
        ? formatRupiah(item?.total_payment)
        : "-",
    }));

    // === Tambah baris total ===
    exportData.push({
      "Nama Penyewa": "Grant Total",
      "Nomor Dokumen": "",
      "Nomor Ruangan": "",
      Lantai: "",
      "Masa Berlaku": "",
      "Status Persetujuan": "",
      "Jenis Pembayaran": "",
      "Uang Muka": "",
      "Sisa Pembayaran": "",
      "Total Pembayaran": grandTotal ? formatRupiah(grandTotal) : "-",
    });

    // === Buat worksheet ===
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" }); // Mulai dari baris 3 agar ada ruang judul

    // === Tambahkan judul di baris pertama ===
    const title = [[`Data Pemohon Sewa Kontrak Ruangan`]];
    XLSX.utils.sheet_add_aoa(ws, title, { origin: "A1" });

    // === Lebar kolom ===
    ws["!cols"] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 25 },
    ];

    // === Tinggi baris ===
    const totalRows = exportData.length + 3; // data + judul + header
    ws["!rows"] = Array.from({ length: totalRows }, (_, i) => ({
      hpt: i === 0 ? 30 : i === 2 ? 22 : 18, // Judul lebih tinggi, header sedikit lebih besar
    }));

    // === Styling judul (A1) ===
    const titleCell = ws["A1"];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "2F75B5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // Gabungkan judul ke seluruh kolom
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];

    // === Styling header (baris ke-3) ===
    const headerRowIndex = 2; // baris ketiga (0-based)
    const headerCols = Object.keys(exportData[0]).length;
    for (let c = 0; c < headerCols; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRowIndex, c });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // === Styling total row (baris terakhir) ===
    const totalRowIndex = exportData.length + 2; // karena mulai dari A3
    for (let c = 0; c < headerCols; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "E2EFDA" } },
        alignment: {
          horizontal: c === 0 ? "left" : "right",
          vertical: "center",
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // Nomor Dokumen, Nomor Ruangan, Lantai, Masa Berlaku, Status, Jenis Pembayaran
    const CENTER_COLUMNS = [1, 2, 3, 4, 5, 6];

    // Uang Muka, Sisa Pembayaran, Total Pembayaran
    const RIGHT_COLUMNS = [7, 8, 9];

    // === Styling seluruh isi data (border tiap cell) ===
    for (let r = 3; r <= totalRowIndex - 1; r++) {
      for (let c = 0; c < headerCols; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddress]) continue;

        let horizontal = "left";

        if (CENTER_COLUMNS.includes(c)) horizontal = "center";
        if (RIGHT_COLUMNS.includes(c)) horizontal = "right";

        ws[cellAddress].s = {
          alignment: {
            horizontal,
            vertical: "center",
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        };
      }
    }

    // === Buat workbook dan simpan ===
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Lokasi");

    XLSX.writeFile(wb, `Data_Pemohon_${moment().format("YYYY-MM-DD")}.xlsx`);

    handleMenuClose();
  };

  const handleExportPDF = () => {
    setSnackbar({ open: true, message: "Comming Soon", severity: "info" });
  };

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
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Input.Search
              placeholder="Cari data..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250, marginBottom: 20, marginTop: 10 }}
            />

            {/* Tombol menu export */}
            <Box align="center">
              <Button
                size="small"
                variant={themeMode === "dark" ? "outlined" : "contained"}
                onClick={handleMenuClick}
                sx={{
                  textTransform: "capitalize",
                }}
              >
                Export
              </Button>

              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left", // muncul dari kiri bawah tombol
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left", // posisi popup ke kiri bawah
                }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    ml: -3, // sedikit geser agar tidak mepet tombol
                    borderRadius: 2,
                    boxShadow: 6,
                    overflow: "visible",
                    zIndex: 2000,
                  },
                }}
              >
                <MenuItem onClick={handleExportExcel}>
                  <ListItemIcon>
                    <Icon icon="vscode-icons:file-type-excel" />
                  </ListItemIcon>
                  <ListItemText>Export ke Excel</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleExportPDF}>
                  <ListItemIcon>
                    <Icon icon="vscode-icons:file-type-pdf2" />
                  </ListItemIcon>
                  <ListItemText>Export ke PDF</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Table
            rowKey="tenant_application_id"
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
            // rowClassName={(record) => {
            //   if (record.is_tenant_application_terminated) return styles.rowTerminated;
            //   if (record.is_fully_paid) return styles.rowFullyPaid;
            //   return "";
            // }}
            rowClassName={(record) => {
              if (record.is_fully_paid) return "rowFullyPaid";
              return "";
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
        user={user}
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
        user={user}
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
      <UpdateDocumentDate
        open={openUpdateDateModal}
        onClose={() => setOpenUpdateDateModal(false)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        getDataTenantApplication={getDataTenantApplication}
        getLocationsData={getLocationsData}
        onNotify={(notif) => setSnackbar(notif)}
        selectedData={selectedData}
        user={user}
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
      <DetailTenantApplicationModal
        open={openTenantApprovalInformationModal}
        onClose={() => setOpenTenantApprovalInformationModal(false)}
        selectedData={selectedData}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loading={loading}
        setLoadingMessage={setLoadingMessage}
        // getDataApprovals={getDataApprovals}
        user={user}
        onNotify={(notif) => setSnackbar(notif)}
      />
      <LoadingBackdrop message={loadingMessage} open={loading} />
      {/* Snackbar notification */}
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
      {/* Dokumen tersembunyi (untuk print) */}
      <div style={{ display: "none" }}>
        {printData && <PrintDocumentTenant ref={printRef} data={printData} />}
      </div>

      {/* <div style={{ display: "none" }}>
        {printData && printType === "persetujuan_sewa_ruangan" && (
          <PersetujuanSewaRuangan ref={printRef} data={printData} />
        )}

        {printData && printType === "surat_pernyataan_penyewa" && (
          <SuratPernyataanPenyewa
            ref={printRefSuratPernyataanPenyewa}
            data={printData}
          />
        )}
      </div> */}
    </Box>
  );
};

export default Applications;
