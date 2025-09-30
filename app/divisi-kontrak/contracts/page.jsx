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

  // Utility untuk filter dinamis
  const filteredData = dataPayments.filter((item) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();

    return item?.tenant_name?.toLowerCase().includes(search);
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

  // Mapping untuk status
  const approvalStatusMap = {
    proses: "Dalam Proses",
    approved: "Disetujui",
    rejected: "Ditolak",
  };

  // nested pakai array
  const tenantName = generateFilters(dataPayments, [
    "tenant_application",
    "tenant_name",
  ]);

  //   const paymentTypeFilters = generateFilters(
  //     dataPayments,
  //     ["tenant_application", "payment_type"],
  //     paymentTypeMap
  //   );

  const columns = [
    {
      title: "Nama Penyewa",
      dataIndex: "tenant_name",
      key: "tenant_name",
    },
    {
      title: "Nama Lokasi",
      dataIndex: "location_name",
      key: "location_name",
    },
    {
      title: "Nomor Ruangan",
      dataIndex: "room_number",
      key: "room_number",
    },
    {
      title: "Lantai",
      dataIndex: "floor",
      key: "floor",
    },
    {
      title: "Status",
      dataIndex: "is_fully_paid",
      key: "is_fully_paid",
      render: (text, record) => (
        <Tag color={record.is_fully_paid ? "green" : "red"} key={record.id}>
          {record.is_fully_paid ? "Lunas" : "Belum Lunas"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (text, record) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
          <Tooltip title="Download Kontrak">
            <Button
              size="small"
              variant={themeMode === "dark" ? "outlined" : "contained"}
              color="success"
              onClick={() => handleEdit(record)}
              sx={{ minWidth: 0, px: 1 }}
            >
              <Icon icon="line-md:downloading-loop" fontSize={18} color={themeMode === "dark" ? "green" : "white"}/>
            </Button>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const generateDocument = async (record) => {
    // console.log("record", record.tenant_name);

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
        tenant_name: record.tenant_name || "-",
        room_number: record.room_number || "-",
        location_name: record.location_name || "-",
      };

      // Render ke docx
      doc.render(data);

      // Simpan file
      const out = doc.getZip().generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      saveAs(out, `kontrak_${record.tenant_name}.docx`);
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
            mt: 6,
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
            rowKey={"id"}
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
