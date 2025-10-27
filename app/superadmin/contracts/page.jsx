"use client";
import {
  Box,
  Button,
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
import menuDevisiKontrak from "@/app/components/menu/MenuItemDivisiKontrak";
import { useUser } from "@/app/utils/useUser";
import { useReactToPrint } from "react-to-print";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import UpdateDocumentContract from "./UpdateDocumentContract";
import AddContract from "./AddContract";
import formatRupiah from "@/app/components/formatrupiah/page";

const Contract = () => {
  // Ref untuk dokumen print
  const printRef = useRef();
  const user = useUser();
  const [dataPayments, setDataPayments] = useState([]);
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
  const [openBuktiPembayaranModal, setOpenBuktiPembayaranModal] =
    useState(false);
  const [openVerificationModal, setOpenVerificationModal] = useState(false);
  const [openApprovalModal, setOpenApprovalModal] = useState(false);
  const [printData, setPrintData] = useState(null);

  const [openUpdateModal, setOpenUpdateModal] = useState(false);

  const getDataContract = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/contracts");
      console.log("data contract", response);
      if (response.data.success) {
        setDataPayments(response.data.data);
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  useEffect(() => {
    if (user) {
      getDataContract();
    }
  }, [user]);

  const onChange = (pagination, filters, sorter, extra) => {
    if (pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
    }
  };

  // useReactToPrint di level atas
  const handlePrintAction = useReactToPrint({
    contentRef: printRef, // langsung ref
    documentTitle: "Persetujuan Sewa Ruangan",
    onAfterPrint: () => setTimeout(() => setPrintData(null), 200),
  });

  // panggil print setelah ref sudah render
  useEffect(() => {
    if (!printData) return;

    // beri jeda supaya komponen PersetujuanSewaRuangan ter-render dulu
    const timeout = setTimeout(() => {
      if (printRef.current) {
        handlePrintAction();
      } else {
        console.error("Belum ada ref untuk print");
      }
    }, 200); // jeda 200ms

    return () => clearTimeout(timeout);
  }, [printData]);

  // handlers
  const handlePrint = (record) => {
    // cukup set selectedData — useEffect akan menangani memanggil printAction
    setPrintData(record);
  };

  const handleUpdateDocument = (record) => {
    setSelectedData(record);
    setOpenUpdateModal(true);
  };

  // Utility untuk filter dinamis
  const filteredData = dataPayments.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return (
      item?.tenant_identities?.full_name?.toLowerCase().includes(search) ||
      item?.contracts?.contract_number?.toLowerCase().includes(search) ||
      item?.locations?.location_name?.toLowerCase().includes(search) ||
      item?.rooms?.room_number?.toLowerCase().includes(search) ||
      item?.rooms?.floor?.toLowerCase().includes(search)
    );
  });

  // Utility untuk filter dinamis
  const getValueByPath = (obj, path) => {
    if (Array.isArray(path)) {
      return path.reduce((o, key) => o?.[key], obj);
    }
    return obj?.[path]; // kalau string, langsung ambil property
  };

  const generateFilters = (data, path, map = null) => {
    return [...new Set(data.map((item) => getValueByPath(item, path)))]
      .filter((val) => val !== undefined && val !== null)
      .map((val) => ({
        text: map ? map[val] : val,
        value: val,
      }));
  };

  const createOnFilter = (path) => {
    return (value, record) => {
      const recordValue = getValueByPath(record, path);
      return recordValue === value;
    };
  };

  const tenantName = generateFilters(dataPayments, [
    "tenant_identities",
    "full_name",
  ]);

  const contractNumberFilters = generateFilters(dataPayments, [
    "contracts",
    "contract_number",
  ]);

  const columns = [
    {
      title: "Nama Penyewa",
      dataIndex: ["tenant_identities", "full_name"],
      filters: tenantName,
      onFilter: createOnFilter(["tenant_identities", "full_name"]),
      filterSearch: true,
      sorter: (a, b) =>
        a.tenant_identities.full_name.localeCompare(
          b.tenant_identities.full_name
        ),
      sortDirections: ["ascend", "descend"],
      render: (text, record) => (
        <Typography
          sx={{
            fontWeight: "bold",
            fontSize: "12px",
            textTransform: "capitalize",
          }}
        >
          {record?.tenant_identities?.full_name}
        </Typography>
      ),
      width: 200,
    },
    {
      title: "Nomor Kontrak",
      dataIndex: ["contracts", "contract_number"],
      filters: contractNumberFilters,
      onFilter: createOnFilter(["contracts", "contract_number"]),
      filterSearch: true,
      render: (text, record) => {
        // Ambil hanya angka kontrak di depan sebelum tanda "/"
        const contractNumberRaw = record.contracts?.contract_number || "-";
        const contractNumberOnly = contractNumberRaw.split("/")[0].trim(); // hasil: "001"
        return (
          <Typography
            sx={{ fontWeight: "bold", fontSize: "12px", textAlign: "center" }}
          >
            {contractNumberOnly}
          </Typography>
        );
      },
      width: 150,
      align: "left",
    },
    {
      title: "Nama Lokasi",
      dataIndex: ["locations", "location_name"],
      width: 200,
    },
    {
      title: "Nomor Ruangan",
      dataIndex: ["rooms", "room_number"],
      render: (text, record) => (
        <Typography sx={{ fontSize: "12px" }}>
          No. {record?.rooms?.room_number}
        </Typography>
      ),
      width: 150,
    },
    {
      title: "Lantai",
      dataIndex: ["rooms", "floor"],
      width: 150,
    },
    // {
    //   title: "Status",
    //   dataIndex: "is_fully_paid",
    //   key: "is_fully_paid",
    //   render: (text, record) => (
    //     <Tag color={record.is_fully_paid ? "green" : "red"} key={record.id}>
    //       {record.is_fully_paid ? "Lunas" : "Belum Lunas"}
    //     </Tag>
    //   ),
    // },
    {
      title: "Actions",
      dataIndex: "actions",
      width: 150,
      align: "center",
      fixed: "right",
      render: (text, record) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Download Kontrak">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="primary"
              onClick={() => generateDocument(record)}
              sx={{
                minWidth: 0,
                px: 1,
                textTransform: "capitalize",
              }}
            >
              <Typography
                sx={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  mr: "3px",
                }}
              >
                Unduh
              </Typography>
              <Icon icon="line-md:downloading-loop" fontSize={18} />
            </Button>
          </Tooltip>
          {/* <Tooltip title="Edit Document Number">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="info"
              onClick={() => handleUpdateDocument(record)}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="fluent:slide-text-edit-28-regular" fontSize={18} />
            </Button>
          </Tooltip> */}
        </Box>
      ),
    },
  ];

  const numberToWords = (num) => {
    const satuan = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];

    if (num < 12) {
      return satuan[num];
    } else if (num < 20) {
      return numberToWords(num - 10) + " Belas";
    } else if (num < 100) {
      return (
        numberToWords(Math.floor(num / 10)) +
        " Puluh " +
        numberToWords(num % 10)
      ).trim();
    } else if (num < 200) {
      return "Seratus " + numberToWords(num - 100);
    } else if (num < 1000) {
      return (
        numberToWords(Math.floor(num / 100)) +
        " Ratus " +
        numberToWords(num % 100)
      ).trim();
    } else if (num < 2000) {
      return "Seribu " + numberToWords(num - 1000);
    } else if (num < 1000000) {
      return (
        numberToWords(Math.floor(num / 1000)) +
        " Ribu " +
        numberToWords(num % 1000)
      ).trim();
    } else if (num < 1000000000) {
      return (
        numberToWords(Math.floor(num / 1000000)) +
        " Juta " +
        numberToWords(num % 1000000)
      ).trim();
    } else if (num < 1000000000000) {
      return (
        numberToWords(Math.floor(num / 1000000000)) +
        " Miliar " +
        numberToWords(num % 1000000000)
      ).trim();
    } else {
      return "Angka terlalu besar";
    }
  };

  const generateDocument = async (record) => {
    // console.log("record", record);

    setLoading(true);
    setLoadingMessage("Generating document...");

    const birthDate = record.tenant_identities?.birth_date
      ? moment(record.tenant_identities.birth_date)
      : "-";

    // Ambil tanggal kontrak dari record
    const contractDate = record.contracts?.contract_date
      ? moment(record.contracts.contract_date)
      : "-";

    const dayName = contractDate.format("dddd"); // Nama hari: Senin, Selasa, dll
    const dayNumber = parseInt(contractDate.format("D")); // Nomor tanggal: 2
    const dayInWords = numberToWords(dayNumber); // Tanggal terbilang: Dua
    const monthName = contractDate.format("MMMM"); // Nama bulan: Oktober
    const yearNumber = parseInt(contractDate.format("YYYY")); // Tahun angka: 2025
    const yearInWords = numberToWords(yearNumber); // Tahun terbilang: Dua ribu dua puluh lima

    const birthDateDayName = birthDate.format("dddd"); // Nama hari: Senin, Selasa, dll
    const birthDateDayNumber = parseInt(birthDate.format("D")); // Nomor tanggal: 2
    const birthDateDayInWords = numberToWords(birthDateDayNumber); // Tanggal terbilang: Dua
    const birthDateMonthName = birthDate.format("MMMM"); // Nama bulan: Oktober
    const birthDateYearNumber = parseInt(birthDate.format("YYYY")); // Tahun angka: 2025
    const birthDateYearInWords = numberToWords(birthDateYearNumber); // Tahun terbilang: Dua ribu dua puluh lima

    // masa Berlaku
    const startDate = moment(record?.tenant_application?.start_date);
    const endDate = moment(record?.tenant_application?.end_date);

    // start date
    const startDateDayNumber = parseInt(startDate.format("D"));
    const startDateInWords = numberToWords(startDateDayNumber);
    const startDateMonthName = startDate.format("MMMM");
    const startDateYearNumber = parseInt(startDate.format("YYYY"));
    const startDateYearInWords = numberToWords(startDateYearNumber);

    // end date
    const endDateDayNumber = parseInt(endDate.format("D"));
    const endDateInWords = numberToWords(endDateDayNumber);
    const endDateMonthName = endDate.format("MMMM");
    const endDateYearNumber = parseInt(endDate.format("YYYY"));
    const endDateYearInWords = numberToWords(endDateYearNumber);

    // hitung masa berlaku dari start_date ke end_date ada berapa lama, jika 1 tahun maka tampilkan 1
    const masaBerlaku = endDate.diff(startDate, "years");
    const masaBerlakuInWords = numberToWords(masaBerlaku);

    const currentYear = moment().format("YYYY");
    const month = moment().format("M");

    // total pembayaran
    const totalPayment =
      Number(record?.tenant_application?.total_payment || 0) - 50000;
    const totalPaymentInWords = numberToWords(Number(totalPayment));
    const totalPPN = Number(totalPayment) * 0.11;
    const totalPPNInWords = numberToWords(Number(totalPPN));

    // convert month to romawi
    const romawi = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const monthInRomawi = romawi[month - 1];

    try {
      // Ambil template docx dari folder public/documents
      const response = await fetch("/documents/contract-template.docx");
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const zip = new PizZip(arrayBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Mapping data dari record
      const data = {
        day_name: dayName || "-",
        day_number: dayNumber || "-",
        day_in_words: dayInWords || "-",
        month_name: monthName || "-",
        year_number: yearNumber || "-",
        year_in_words: yearInWords || "-",
        tenant_name: record.tenant_identities?.full_name || "-",
        room_number: record.rooms?.room_number || "-",
        location_name: record.locations?.location_name || "-",
        currentYear: currentYear || "-",
        monthInRomawi: monthInRomawi || "-",
        contract_number: record.contracts?.contract_number || "-",
        location_code: record.locations?.location_code || "-",
        floor: record.rooms?.floor || "-",
        birth_place: record.tenant_identities?.birth_place || "-",
        birth_date: `${birthDateDayNumber} (${birthDateDayInWords}) ${birthDateMonthName} ${birthDateYearNumber} (${birthDateYearInWords})`,
        nik: record.tenant_identities?.nik || "-",
        occupation: record.tenant_identities?.occupation || "-",
        religion: record.tenant_identities?.religion || "-",
        nationality:
          record.tenant_identities?.nationality === "WNI"
            ? "Warga Negara Indonesia"
            : "Warga Negara Asing",
        street_address: record.tenant_identities?.street_address || "-",
        rt: record.tenant_identities?.rt || "-",
        rw: record.tenant_identities?.rw || "-",
        kelurahan: record.tenant_identities?.kelurahan || "-",
        district: record.tenant_identities?.district || "-",
        city: record.tenant_identities?.city || "-",
        province: record.tenant_identities?.province || "-",
        room_width: record.rooms?.room_width || "-",
        room_length: record.rooms?.room_length || "-",
        room_area: record.rooms?.room_area || "-",
        province: record.locations?.province || "-",
        kelurahan: record.locations?.kelurahan || "-",
        district: record.locations?.district || "-",
        location_city: record.locations?.city || "-",
        startDateDayNumber: startDateDayNumber || "-",
        startDateInWords: startDateInWords || "-",
        startDateMonthName: startDateMonthName || "-",
        startDateYearNumber: startDateYearNumber || "-",
        startDateYearInWords: startDateYearInWords || "-",
        endDateDayNumber: endDateDayNumber || "-",
        endDateInWords: endDateInWords || "-",
        endDateMonthName: endDateMonthName || "-",
        endDateYearNumber: endDateYearNumber || "-",
        endDateYearInWords: endDateYearInWords || "-",
        masaBerlaku: masaBerlaku || "-",
        masaBerlakuInWords: masaBerlakuInWords || "-",
        totalPayment: formatRupiah(totalPayment) || "-",
        totalPaymentInWords: totalPaymentInWords || "-",
        totalPPN: formatRupiah(totalPPN) || "-",
        totalPPNInWords: totalPPNInWords || "-",
      };

      // Render ke docx
      doc.render(data);

      // Simpan file
      const out = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      setTimeout(() => {
        saveAs(
          out,
          `Contract_${record?.tenant_identities?.full_name}_${record?.locations?.location_name}_${record?.rooms?.room_number}.docx`
        );
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error generate document:", err);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      <BreadcrumbPage menuList={menuDevisiKontrak} />

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
            <Icon
              icon="fluent:document-one-page-add-24-regular"
              fontSize="20px"
            />
          </Button>
        </Box>

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
            rowKey={(record) => record.contracts.id}
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

      <AddContract
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        getDataContract={getDataContract}
        loading={loading}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        loadingMessage={loadingMessage}
        setLoadingMessage={setLoadingMessage}
        onNotify={(notify) => setSnackbar(notify)}
      />

      <UpdateDocumentContract
        open={openUpdateModal}
        onClose={() => setOpenUpdateModal(false)}
        getDataContract={getDataContract}
        loading={loading}
        setLoading={setLoading}
        loadingMessage={loadingMessage}
        onNotify={(notify) => setSnackbar(notify)}
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
      {/* <div style={{ display: "none" }}>
        {printData && <BuktiPembayaran ref={printRef} data={printData} />}
      </div> */}
    </Box>
  );
};

export default Contract;
