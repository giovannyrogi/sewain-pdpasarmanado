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
import menuSuperadmin from "@/app/components/menu/MenuItemSuperadmin";
import formatRupiah from "@/app/components/formatrupiah/page";
import AddTenantApplication from "./AddTenantApplication";
import InformationPreviewModal from "@/app/components/informationpreviewmodal/page";
import EditTenantApplication from "./EditTenantApplication";
import DeleteTenantApplication from "./DeleteTenantApplication";
import ApprovalModal from "@/app/components/approvalmodal/page";
import { useUser } from "@/app/utils/useUser";
import PersetujuanSewaRuangan from "@/app/components/documents/PersetujuanSewaRuangan";
import { useReactToPrint } from "react-to-print";
import TenantApprovalModal from "@/app/components/tenantapprovalmodal/TenantApprovalModal";
import DetailTenantApplicationModal from "@/app/components/tenantapplicationmodal/DetailTenantApplicationModal";
import menuDevisiKontrak from "@/app/components/menu/MenuItemDivisiKontrak";
import UpdateDocumentDate from "./UpdateDocumentDate";
import menuKepalaSeksi from "@/app/components/menu/MenuItemKepalaSeksi";
import menuKepalaSubdivisi from "@/app/components/menu/MenuItemKepalaSubdivisi";

const Applications = () => {
  // Ref untuk dokumen print
  const printRef = useRef();
  const user = useUser();
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

  const [printData, setPrintData] = useState(null);

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
    "location_name"
  );
  const paymentTypeFilters = generateFilters(
    dataTenantApplication,
    "payment_type"
  );

  const documentNumberFilters = generateFilters(
    dataTenantApplication,
    "document_number"
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
                    style={{ color: themeMode === "dark" ? "green" : "white" }}
                  />
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Print Dokumen">
                <Button
                  size="small"
                  variant={themeMode === "dark" ? "outlined" : "contained"}
                  color="primary"
                  onClick={() => handlePrint(record)}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  <Icon icon="streamline-ultimate:print-text" fontSize={18} />
                </Button>
              </Tooltip>
            )}
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

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: 2 }}>
      {/* Component Breadcrumbs disini */}
      <BreadcrumbPage menuList={menuKepalaSubdivisi} />

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
          <Input.Search
            placeholder="Cari..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, marginBottom: 20, marginTop: 10 }}
          />
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
        {printData && (
          <PersetujuanSewaRuangan ref={printRef} data={printData} />
        )}
      </div>
    </Box>
  );
};

export default Applications;
