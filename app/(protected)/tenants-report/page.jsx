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

const TenantsReport = () => {
  const user = useUser();
  const isMobile = useMediaQuery("(max-width:750px)");
  const isTablet = useMediaQuery("(max-width:1350px)");
  const [dataIncomeTenants, setDataIncomeTenants] = useState([]);
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [totals, setTotals] = useState(null);

  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
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
  const getDataIncomeTenants = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/report/income-by-tenants?start_date=${range[0].startDate}&end_date=${range[0].endDate}`
      );
      // console.log("tenants report", response);
      setDataIncomeTenants(response.data.data);
      setTotals(response.data.totals);
      setLoading(false);
    } catch (error) {
      console.log("error", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getDataIncomeTenants();
    }
  }, [user]);

  const handleSubmit = async () => {

    // console.log("startDate", startDate);
    // console.log("endDate", endDate);

    setLoading(true);
    setIsSubmitting(true);
    try {
      const response = await axios.get(
        `/api/report/income-by-tenants?start_date=${range[0].startDate}&end_date=${range[0].endDate}`
      );
      // console.log("tenants report", response);
      const data = response.data.data;

      if (data.length === 0) {
        setSnackbar({
          open: true,
          message: `Tidak ada data dari tanggal "${range[0].startDate}" sampai "${range[0].endDate}"`,
          severity: "error",
        });
        setTimeout(() => {
          setDataIncomeTenants([]);
          setIsSubmitting(false);
          setLoading(false);
        }, 1000);
        return;
      }

      if (response.data.success) {
        setDataIncomeTenants(response.data.data);
        setTotals(response.data.totals);
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

  const filterTenantName = generateFilters(dataIncomeTenants, "tenant_name");
  const filterKeterangan = generateFilters(dataIncomeTenants, "keterangan");

  const filteredData = dataIncomeTenants.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return item?.tenant_name?.toLowerCase().includes(search);
  });

  const columns = [
    {
      title: "Nama Penyewa",
      dataIndex: "tenant_name",
      filters: filterTenantName,
      onFilter: createOnFilter("tenant_name"),
      filterSearch: true,
      sorter: (a, b) => a.tenant_name.localeCompare(b.tenant_name),
      sortDirections: ["ascend", "descend"],
      width: 200,
      fixed: isMobile ? "unset" : "left",
    },
    {
      title: "Tanggal Pembayaran",
      dataIndex: "payment_date",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
          }}
        >
          {record?.payment_date}
        </Typography>
      ),
      align: "left",
      width: 180,
    },
    {
      title: "No. Ruangan",
      dataIndex: "room_number",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
          }}
        >
          {record?.room_number}
        </Typography>
      ),
      align: "left",
      width: 150,
    },
    {
      title: "Masa Berlaku",
      dataIndex: "masa_berlaku",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
          }}
        >
          {record?.masa_berlaku}
        </Typography>
      ),
      align: "left",
      width: 180,
    },
    {
      title: "Ukuran M²",
      dataIndex: "ukuran_m2",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
          }}
        >
          {record?.ukuran_m2}
        </Typography>
      ),
      align: "left",
      width: 150,
    },
    {
      title: "Harga M²",
      dataIndex: "harga_m2",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.harga_m2)}
        </Typography>
      ),
      align: "center",
      width: 150,
    },
    {
      title: "Kontrak",
      dataIndex: "kontrak",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.kontrak)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "JTU",
      dataIndex: "jtu",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.jtu)}
        </Typography>
      ),
      align: "center",
      width: 150,
    },
    {
      title: "Kontrak (Tanpa PPN)",
      dataIndex: "total_kontrak_tanpa_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_kontrak_tanpa_ppn)}
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
      dataIndex: "total_plus_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_plus_ppn)}
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
      dataIndex: "total_after_pph_and_no_ppn",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            textAlign: "right",
          }}
        >
          {formatRupiah(record?.total_after_pph_and_no_ppn)}
        </Typography>
      ),
      align: "center",
      width: 200,
    },
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      filters: filterKeterangan,
      onFilter: createOnFilter("keterangan"),
      filterSearch: true,
      sorter: (a, b) => a.keterangan.localeCompare(b.keterangan),
      sortDirections: ["ascend", "descend"],
      width: 180,
      fixed: isMobile ? "unset" : "right",
      render: (text, record) => (
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: "bolder",
            color: record?.remaining_balance === 0 ? "green" : "unset",
          }}
        >
          {record?.keterangan}
        </Typography>
      ),
      align: "center",
    },
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
                rowKey={(record) => record.payment_id}
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
                rowClassName={(record) => {
                  if (record.remaining_balance === 0) return "rowFullyPaid";
                  return "";
                }}
                summary={() => {
                  return (
                    dataIncomeTenants.length > 0 && (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            >
                              TOTAL
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={5}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={6} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_contract)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={7} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_JTU)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={8} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_without_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={9} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={10} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_with_ppn)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={11} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_pph)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={12} align="right">
                            <Typography
                              sx={{ fontWeight: "bold", fontSize: "12px" }}
                            >
                              {formatRupiah(totals?.total_net)}
                            </Typography>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={13}>
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                fontSize: "12px",
                              }}
                            ></Typography>
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

        {/* <Grid size={12}>
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
                <Icon icon="ic:baseline-attach-money" />
                <Typography
                  sx={{
                    color: "text.primary",
                    fontSize: "16px",
                    fontFamily: "poppins",
                  }}
                >
                  Summery
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
                asdsadsad
              </Grid>
            </Grid>
          </Paper>
        </Grid> */}
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

export default TenantsReport;
