"use client";
import {
  Box,
  Button,
  Paper,
  Tooltip,
  Typography,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { Table, ConfigProvider, theme as antdTheme, Input, Tag } from "antd";
import { useThemeMode } from "../../components/themeprovider/ThemeContext";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import axios from "axios";
import BreadcrumbPage from "@/app/components/breadcrumb/page";
import formatRupiah from "@/app/components/formatrupiah/page";
import { useUser } from "@/app/utils/useUser";
import { DateRangePicker } from "react-date-range";
import XLSX from "xlsx-js-style";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import "moment/locale/id";
import MENU_CONFIG from "@/app/components/menu/MenuConfig";
moment.locale("id");

const LocationsReport = () => {
  const { user } = useUser();
  const isMobile = useMediaQuery("(max-width:750px)");
  const isTablet = useMediaQuery("(max-width:1350px)");
  const [dataLocations, setDataLocations] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openNonAktif, setOpenNonAktif] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [totals, setTotals] = useState(null);
  const [summeryData, setSummeryData] = useState(null);

  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: moment().format("YYYY-MM-DD"),
      endDate: moment().format("YYYY-MM-DD"),
      key: "selection",
    },
  ]);
  const [selectedFilter, setSelectedFilter] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRangeChange = (item) => {
    setRange([
      {
        startDate: moment(item?.selection?.startDate).format("YYYY-MM-DD"),
        endDate: moment(item?.selection?.endDate).format("YYYY-MM-DD"),
        key: "selection",
      },
    ]);
  };

  const getDataIncomeLocations = async () => {
    try {
      const response = await axios.get(
        `/api/report/income-by-locations?start_date=${range[0].startDate}&end_date=${range[0].endDate}`
      );
      // console.log("locations", response);
      setDataLocations(response.data.data);
      setTotals(response.data.totals);
    } catch (error) {
      console.log("error", error);
    }
  };

  const getSummeryData = async () => {
    try {
      const response = await axios.get(
        `/api/report/accounting-summary?start_date=${range[0].startDate}&end_date=${range[0].endDate}`
      );
      // console.log("summary reports", response);
      setSummeryData(response.data.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const getAllData = async () => {
    setLoading(true);
    try {
      await getDataIncomeLocations();
      await getSummeryData();
      setLoading(false);
    } catch (error) {
      console.log("error", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllData();
    }
  }, [user]);

  const handleSubmit = async () => {
    setLoading(true);
    setIsSubmitting(true);

    try {
      const response = await axios.get(
        `/api/report/income-by-locations?start_date=${range[0].startDate}&end_date=${range[0].endDate}`
      );
      // console.log("locations report", response);
      const data = response.data.data;

      if (data.length === 0) {
        setSnackbar({
          open: true,
          message: `Tidak ada data dari tanggal "${range[0].startDate}" sampai "${range[0].endDate}"`,
          severity: "error",
        });
        setTimeout(() => {
          setDataLocations([]);
          setIsSubmitting(false);
          setLoading(false);
        }, 1000);
        return;
      }

      if (response.data.success) {
        setDataLocations(response.data.data);
        setTotals(response.data.totals);
        await getSummeryData();
        setTimeout(() => {
          setIsSubmitting(false);
          setLoading(false);
        }, 1000);
      } else {
        // console.log("response", response);
        setSnackbar({
          open: true,
          message: data.message || "Gagal mengambil data",
          severity: "error",
        });
        setTimeout(() => {
          setIsSubmitting(false);
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setSnackbar({
        open: true,
        message: error.response.data.message || "Sistem error, cek logs",
        severity: "error",
      });
      setTimeout(() => {
        setIsSubmitting(false);
        setLoading(false);
      }, 1000);
    }
  };

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  const handlePrint = (record) => {
    setPrintData(record);
  };

  function generateFilters(data, key) {
    return [...new Set(data.map((item) => item[key]))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({ text: val, value: val }));
  }

  function createOnFilter(key) {
    return (value, record) => record[key] === value;
  }

  const filterLocationName = generateFilters(dataLocations, "location_name");

  const filteredData = dataLocations.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return item?.location_name?.toLowerCase().includes(search);
  });

  const columns = [
    {
      title: "Nama Lokasi",
      dataIndex: "location_name",
      filters: filterLocationName,
      onFilter: createOnFilter("location_name"),
      filterSearch: true,
      sorter: (a, b) => a.location_name.localeCompare(b.location_name),
      sortDirections: ["ascend", "descend"],
      width: 200,
      fixed: "left",
    },
    {
      title: "Kontrak",
      dataIndex: "income_contracts",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.income_contracts)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "JTU",
      dataIndex: "JTU",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.JTU)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "Kontrak (Tanpa PPN)",
      dataIndex: "income_contract_without_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.income_contract_without_ppn)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "PPN 11%",
      dataIndex: "total_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_ppn)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "Total + PPN 11%",
      dataIndex: "income_contract_with_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.income_contract_with_ppn)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "Potongan PPH 10%",
      dataIndex: "total_pph",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_pph)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "Total (tanpa PPN & PPH)",
      dataIndex: "total_without_ppn_pph",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_without_ppn_pph)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    // {
    //   title: "Actions",
    //   key: "action",
    //   align: "center",
    //   width: 100,
    //   fixed: "right",
    //   render: (text, record) => (
    //     <Tooltip title="Update Masa Berlaku Dokumen">
    //       <Button
    //         size="small"
    //         variant={themeMode === "dark" ? "outlined" : "contained"}
    //         color="success"
    //         sx={{ minWidth: 0, px: 1 }}
    //       >
    //         <Icon
    //           icon="line-md:calendar"
    //           fontSize={18}
    //           style={{ color: themeMode === "dark" ? "green" : "white" }}
    //         />
    //       </Button>
    //     </Tooltip>
    //   ),
    // },
  ];

  const handleExportExcel = () => {
    // === Data utama ===
    const exportData = filteredData.map((item) => ({
      "Nama Lokasi": item.location_name,
      Kontrak: item.income_contracts,
      JTU: item.JTU,
      "Kontrak (Tanpa PPN)": item.income_contract_without_ppn,
      "PPN 11%": item.total_ppn,
      "Total + PPN 11%": item.income_contract_with_ppn,
      "Potongan PPH 10%": item.total_pph,
      "Total (tanpa PPN & PPH)": item.total_without_ppn_pph,
    }));

    // === Tambah baris total ===
    exportData.push({
      "Nama Lokasi": "TOTAL",
      Kontrak: totals?.total_contract || 0,
      JTU: totals?.total_JTU || 0,
      "Kontrak (Tanpa PPN)": totals?.total_without_ppn || 0,
      "PPN 11%": totals?.total_ppn || 0,
      "Total + PPN 11%": totals?.total_with_ppn || 0,
      "Potongan PPH 10%": totals?.total_pph || 0,
      "Total (tanpa PPN & PPH)": totals?.total_net || 0,
    });

    // === Buat worksheet ===
    const ws = XLSX.utils.json_to_sheet(exportData, { origin: "A3" }); // Mulai dari baris 3 agar ada ruang judul

    // === Tambahkan judul di baris pertama ===
    const title = [
      [
        `Laporan Pendapatan Lokasi (${moment(range[0].startDate).format(
          "DD-MM-YYYY"
        )} s/d ${moment(range[0].endDate).format("DD-MM-YYYY")})`,
      ],
    ];
    XLSX.utils.sheet_add_aoa(ws, title, { origin: "A1" });

    // === Lebar kolom ===
    ws["!cols"] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
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
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

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
        alignment: { horizontal: "right", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // === Styling seluruh isi data (border tiap cell) ===
    for (let r = 3; r <= totalRowIndex - 1; r++) {
      for (let c = 0; c < headerCols; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          alignment: { horizontal: "right", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } },
          },
        };
        if (c === 0) {
          ws[cellAddress].s.alignment.horizontal = "left"; // kolom nama kiri
        }
      }
    }

    // === Buat workbook dan simpan ===
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Lokasi");

    XLSX.writeFile(
      wb,
      `Laporan_Pendapatan_Lokasi_${moment(range[0].startDate).format(
        "DD-MM-YYYY"
      )}_sd_${moment(range[0].endDate).format("DD-MM-YYYY")}.xlsx`
    );

    handleMenuClose();
  };

  // === EXPORT TO PDF ===
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text("Laporan Pendapatan per Lokasi", 14, 10);

    const tableData = filteredData.map((item) => [
      item.location_name,
      formatRupiah(item.income_contracts),
      formatRupiah(item.JTU),
      formatRupiah(item.income_contract_without_ppn),
      formatRupiah(item.total_ppn),
      formatRupiah(item.income_contract_with_ppn),
      formatRupiah(item.total_pph),
      formatRupiah(item.total_without_ppn_pph),
    ]);

    // === Tambah baris total ===
    tableData.push([
      "TOTAL",
      formatRupiah(totals?.total_contract),
      formatRupiah(totals?.total_JTU),
      formatRupiah(totals?.total_without_ppn),
      formatRupiah(totals?.total_ppn),
      formatRupiah(totals?.total_with_ppn),
      formatRupiah(totals?.total_pph),
      formatRupiah(totals?.total_net),
    ]);

    autoTable(doc, {
      head: [
        [
          "Nama Lokasi",
          "Kontrak",
          "JTU",
          "Kontrak (Tanpa PPN)",
          "PPN 11%",
          "Total + PPN 11%",
          "Potongan PPH 10%",
          "Total (tanpa PPN & PPH)",
        ],
      ],
      body: tableData,
      startY: 15,
      theme: "grid",
      styles: { fontSize: 8 },
    });

    doc.save(
      `Laporan_Pendapatan_Lokasi_${moment(range[0].startDate).format(
        "DD-MM-YYYY"
      )}_sd_${moment(range[0].endDate).format("DD-MM-YYYY")}.pdf`
    );

    handleMenuClose();
  };

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      <BreadcrumbPage menuList={MENU_CONFIG} />

      <Grid container spacing={1}>
        <Grid size={12}>
          <Paper
            elevation={6}
            sx={{
              p: 2,
              bgcolor: "background.default",
              mb: 6,
              mt: 6,
            }}
          >
            <Grid container spacing={1}>
              <Grid
                size={12}
                display={"flex"}
                flexDirection={"row"}
                justifyContent={"flex-start"}
                alignItems={"center"}
                gap={1}
              >
                <Icon icon="mi:filter" />
                <Typography
                  sx={{
                    color: "text.primary",
                    fontSize: "16px",
                    fontFamily: "poppins",
                  }}
                >
                  Filter Laporan
                </Typography>
              </Grid>

              <Divider
                sx={{
                  mb: 1,
                  mt: -0.5,
                  borderColor: theme.palette.primary.main,
                  width: "100%",
                }}
              />

              <Grid
                container
                spacing={1}
                sx={{
                  padding: "0px 10px 5px 10px",
                }}
              >
                <Grid container size={12}>
                  <Grid size={12}>
                    <Typography
                      sx={{
                        color: "text.primary",
                        fontSize: "13px",
                        fontFamily: "poppins",
                      }}
                    >
                      Custom Range Tanggal
                    </Typography>
                  </Grid>

                  <Grid size={12}>
                    <Button
                      variant={
                        selectedFilter === "custom" ? "contained" : "outlined"
                      }
                      color="primary"
                      size="medium"
                      startIcon={<Icon icon="line-md:calendar" />}
                      onClick={() => {
                        setRange([
                          {
                            startDate: moment().format("YYYY-MM-DD"),
                            endDate: moment().format("YYYY-MM-DD"),
                            key: "selection",
                          },
                        ]);
                        setSelectedFilter("custom");
                        setOpenDatePicker(true);
                      }}
                      sx={{
                        borderRadius: 2,
                        textTransform: "capitalize",
                      }}
                    >
                      {moment(range[0].startDate).format("DD MMM YYYY")} -{" "}
                      {moment(range[0].endDate).format("DD MMM YYYY")}
                    </Button>
                  </Grid>
                </Grid>

                {/* Quick Filters */}
                <Grid
                  container
                  size={12}
                  mt={2}
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: isMobile ? "center" : "flex-start",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 2 : 1,
                  }}
                >
                  <Grid size={12} mb={isMobile ? -1 : 0}>
                    <Typography
                      sx={{
                        color: "text.primary",
                        fontSize: "13px",
                        fontFamily: "poppins",
                      }}
                    >
                      Filter Cepat
                    </Typography>
                  </Grid>

                  {/* Filter bulan ini */}
                  <Button
                    variant={
                      selectedFilter === "this_month" ? "contained" : "outlined"
                    }
                    color="primary"
                    size="small"
                    // startIcon={<Icon icon="line-md:calendar" />}
                    onClick={() => {
                      setSelectedFilter("this_month");
                      setRange([
                        {
                          // start date = awal bulan ini dan end date tanggal hari ini
                          startDate: moment()
                            .startOf("month")
                            .format("YYYY-MM-DD"),
                          endDate: moment().format("YYYY-MM-DD"),
                          key: "selection",
                        },
                      ]);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "capitalize",
                      fontWeight: selectedFilter === "this_month" ? "bold" : "",
                    }}
                  >
                    Bulan Ini
                  </Button>

                  {/* Filter 2 bulan terakhir     */}
                  <Button
                    variant={
                      selectedFilter === "two_month" ? "contained" : "outlined"
                    }
                    color="primary"
                    size="small"
                    // startIcon={<Icon icon="line-md:calendar" />}
                    onClick={() => {
                      setSelectedFilter("two_month");
                      setRange([
                        {
                          // start date = awal bulan lalu dan end date hari ini
                          startDate: moment()
                            .subtract(1, "month")
                            .startOf("month")
                            .format("YYYY-MM-DD"),
                          endDate: moment().format("YYYY-MM-DD"),
                          key: "selection",
                        },
                      ]);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "capitalize",
                      fontWeight: selectedFilter === "two_month" ? "bold" : "",
                    }}
                  >
                    2 Bulan Terakhir
                  </Button>

                  {/* 1 Minggu Terakhir */}
                  <Button
                    variant={
                      selectedFilter === "one_week" ? "contained" : "outlined"
                    }
                    color="primary"
                    size="small"
                    // startIcon={<Icon icon="line-md:calendar" />}
                    onClick={() => {
                      setSelectedFilter("one_week");
                      setRange([
                        {
                          // start date = awal minggu ini dan end date hari ini
                          startDate: moment()
                            .startOf("week")
                            .format("YYYY-MM-DD"),
                          endDate: moment().format("YYYY-MM-DD"),
                          key: "selection",
                        },
                      ]);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "capitalize",
                      fontWeight: selectedFilter === "one_week" ? "bold" : "",
                    }}
                  >
                    1 Minggu Terakhir
                  </Button>

                  {/* 2 Minggu Terakhir */}
                  <Button
                    variant={
                      selectedFilter === "two_week" ? "contained" : "outlined"
                    }
                    color="primary"
                    size="small"
                    // startIcon={<Icon icon="line-md:calendar" />}
                    onClick={() => {
                      setSelectedFilter("two_week");
                      setRange([
                        {
                          // start date = awal minggu lalu dan end date hari ini
                          startDate: moment()
                            .subtract(1, "week")
                            .startOf("week")
                            .format("YYYY-MM-DD"),
                          endDate: moment().format("YYYY-MM-DD"),
                          key: "selection",
                        },
                      ]);
                    }}
                    sx={{
                      borderRadius: 2,
                      textTransform: "capitalize",
                      fontWeight: selectedFilter === "two_week" ? "bold" : "",
                    }}
                  >
                    2 Minggu Terakhir
                  </Button>
                </Grid>

                <Grid size={12}>
                  <Button
                    variant={"contained"}
                    color="primary"
                    size="small"
                    endIcon={
                      isSubmitting ? (
                        <CircularProgress size={15} color="inherit" />
                      ) : (
                        <Icon icon="line-md:search" />
                      )
                    }
                    onClick={() => handleSubmit()}
                    sx={{
                      fontWeight: "bold",
                      // color: "white",
                      textTransform: "capitalize",
                      mt: 1,
                    }}
                    disabled={isSubmitting || !selectedFilter ? true : false}
                  >
                    {isSubmitting ? "Loading..." : "Cari Data"}
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid size={12}>
          <ConfigProvider
            theme={{
              algorithm:
                themeMode === "dark"
                  ? antdTheme.darkAlgorithm
                  : antdTheme.defaultAlgorithm,
              token: {
                colorPrimary: theme.palette.primary.main,
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
                rowKey={(record) => record.location_id}
                columns={columns}
                dataSource={filteredData}
                onChange={onChange}
                showSorterTooltip={{ target: "sorter-icon" }}
                scroll={{ x: "max-content" }}
                pagination={{
                  pageSize: pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: [5, 10, 20, 50],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} dari ${total} data`,
                }}
                summary={() => {
                  return (
                    dataLocations.length > 0 && (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                                width: 200,
                              }}
                            >
                              TOTAL
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_contract)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_JTU)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_without_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_with_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_pph)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_net)}
                            </Typography>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    )
                  );
                }}
              />
            </Paper>
          </ConfigProvider>
        </Grid>

        {/* Summery */}
        {dataLocations.length > 0 && (
          <Grid size={12}>
            <Paper
              elevation={6}
              sx={{
                p: 2,
                bgcolor: "background.default",
                mb: 6,
                mt: 4,
              }}
            >
              <Grid container spacing={1}>
                <Grid
                  size={12}
                  display="flex"
                  flexDirection="row"
                  justifyContent="flex-start"
                  alignItems="center"
                  gap={1}
                >
                  <Icon icon="ic:baseline-attach-money" />
                  <Typography
                    sx={{
                      color: "text.primary",
                      fontSize: "16px",
                      fontFamily: "poppins",
                      fontWeight: 600,
                    }}
                  >
                    Summary
                  </Typography>
                </Grid>

                <Divider
                  sx={{
                    mb: 1,
                    mt: -0.5,
                    borderColor: theme.palette.primary.main,
                    width: "100%",
                  }}
                />

                <Grid
                  container
                  spacing={1}
                  size={12}
                  sx={{
                    padding: "0px 10px 5px 10px",
                  }}
                >
                  {summeryData && (
                    <>
                      {[
                        {
                          label: "Piutang Kontraktual",
                          value: summeryData.piutang_kontraktual,
                        },
                        {
                          label: "Pendapatan Diterima Dimuka",
                          value: summeryData.pendapatan_diterima_dimuka,
                        },
                        {
                          label: "Pengakuan Kontrak Diterima Dimuka",
                          value: summeryData.pengakuan_kontrak_diterima_dimuka,
                        },
                        {
                          label: "JTU",
                          value: summeryData.total_jtu,
                        },
                        {
                          label: "PPN",
                          value: summeryData.total_ppn,
                        },
                        {
                          label: "Total",
                          value: summeryData.total_keseluruhan,
                        },
                      ].map((item, index) => (
                        <Grid
                          key={index}
                          container
                          size={12}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 0.5,
                            bgcolor:
                              theme.palette.mode === "dark"
                                ? index % 2 === 0
                                  ? "rgba(255,255,255,0.05)"
                                  : "rgba(255,255,255,0.1)"
                                : index % 2 === 0
                                ? "rgba(0, 0, 0, 0.07)"
                                : "rgba(18, 17, 17, 0.15)",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "poppins",
                              fontSize: "14px",
                              color: theme.palette.text.primary,
                              fontWeight: "bold",
                            }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "poppins",
                              fontSize: "14px",
                              fontWeight: "bold",
                              color:
                                item.value >= 0
                                  ? theme.palette.success.main
                                  : theme.palette.error.main,
                            }}
                          >
                            {formatRupiah(item.value)}
                          </Typography>
                        </Grid>
                      ))}
                    </>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Popup Date Range */}
      <Dialog
        open={openDatePicker}
        // onClose={() => setOpenDatePicker(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{ style: { backdropFilter: "blur(5px)" } }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: theme.palette.background.paper,
            width: "100%",
            maxWidth: {
              xs: "95vw", // hampir penuh untuk HP
              sm: "400px", // tablet
              md: "420px", // desktop kecil
            },
          },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            "& .rdrDateRangeWrapper": {
              width: "100%",
            },
            "& .rdrMonths": {
              flexDirection: "column",
              width: "100%",
            },
            "& .rdrMonth": {
              width: "100%",
              padding: 0,
            },
            "& .rdrDefinedRangesWrapper": {
              display: "none",
            },
            "& .rdrCalendarWrapper": {
              backgroundColor:
                themeMode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
              color: theme.palette.text.primary,
              width: "100%",
            },
            "& .rdrMonthAndYearPickers select": {
              backgroundColor:
                themeMode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
              color: theme.palette.text.primary,
            },
            "& .rdrDayNumber span": {
              color: theme.palette.text.primary,
              fontWeight: "bold",
            },
            // Hari ini (garis bawah warna primary)
            "& .rdrDayToday .rdrDayNumber span:after": {
              backgroundColor: theme.palette.primary.main,
            },

            // Hover tanggal
            "& .rdrDay:not(.rdrDayPassive):hover .rdrDayNumber span": {
              // color: theme.palette.primary.main,
            },

            // Tambahan fix untuk dark/light mode disabled dates ===
            "& .rdrDayDisabled, & .rdrDayPassive": {
              backgroundColor: "transparent !important",
              opacity: 0.3,
              cursor: "not-allowed",
            },

            "& .rdrDayDisabled .rdrDayNumber span, & .rdrDayPassive .rdrDayNumber span":
              {
                color:
                  themeMode === "dark"
                    ? "rgba(255,255,255,0.3)"
                    : "rgba(0,0,0,0.3)",
              },

            // Range aktif
            "& .rdrInRange, & .rdrStartEdge, & .rdrEndEdge": {
              backgroundColor: theme.palette.primary.main,
            },

            // Bulan & Tahun picker
            "& .rdrMonthPicker, & .rdrYearPicker": {
              color: theme.palette.text.primary,
            },

            "& .rdrMonthAndYearPickers select": {
              backgroundColor:
                themeMode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
              color: theme.palette.text.primary,
              appearance: "none",
              WebkitAppearance: "none",
              MozAppearance: "none",
              backgroundImage:
                themeMode === "dark"
                  ? `url("data:image/svg+xml;utf8,<svg fill='white' xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'><path d='M7 10l5 5 5-5z'/></svg>")`
                  : `url("data:image/svg+xml;utf8,<svg fill='black' xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'><path d='M7 10l5 5 5-5z'/></svg>")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
              backgroundSize: "12px",
              paddingRight: "24px",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "6px",
              transition: "all 0.2s ease",
              cursor: "pointer",

              // hover → ubah border dan background
              "&:hover": {
                borderColor: theme.palette.primary.main,
                backgroundColor:
                  themeMode === "dark" ? "#2A2A2A" : theme.palette.action.hover,
              },

              // focus (saat dropdown dibuka)
              "&:focus": {
                outline: "none",
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
                backgroundColor:
                  themeMode === "dark"
                    ? "#2A2A2A"
                    : theme.palette.action.selected,
              },

              // ubah warna highlight teks (bukan bawaan biru)
              "&::selection": {
                backgroundColor: theme.palette.primary.main,
                color: "#fff",
              },
            },
          }}
        >
          <DateRangePicker
            onChange={handleRangeChange}
            moveRangeOnFirstSelection={false}
            months={2}
            direction="vertical"
            showDateDisplay={false}
            ranges={range}
            rangeColors={[theme.palette.primary.main]}
            className="rdrCalendarWrapper"
            locale={id}
            shownDate={moment().subtract(1, "month").toDate()}
            maxDate={new Date()}
          />
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: "center",
            p: 2,
            pt: 4,
            backgroundColor:
              themeMode === "dark"
                ? "#1C1C1C"
                : theme.palette.background.default,
          }}
        >
          <Button
            onClick={() => setOpenDatePicker(false)}
            variant="contained"
            size="small"
            color="primary"
            fullWidth
            sx={{
              fontWeight: "bold",
              // color: "white",
              textTransform: "capitalize",
            }}
          >
            Pilih Tangal
          </Button>
        </DialogActions>
      </Dialog>

      <LoadingBackdrop message={loadingMessage} open={loading} />

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </Box>
  );
};

export default LocationsReport;
