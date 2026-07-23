"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import LandPermitReceipt from "@/app/components/documents/LandPermitReceipt";
import { useUser } from "@/app/utils/useUser";
import LandPermitPaymentFormModal from "./LandPermitPaymentFormModal";
import LandPermitPaymentDetailModal from "./LandPermitPaymentDetailModal";
import {
  LAND_PAYMENT_ACTION_COLUMN_WIDTH,
  LAND_PAYMENT_PAGE_SIZE_OPTIONS,
  LAND_PAYMENT_TABLE_SCROLL_WIDTH,
  buildLandPermitPaymentStats,
  createLandPermitPaymentColumns,
  filterLandPermitPayments,
} from "./LandPermitPaymentsTableColumns";

const initialSnackbar = {
  open: false,
  message: "",
  severity: "success",
};

export default function LandPermitPaymentsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { user } = useUser();
  const printRef = useRef(null);
  const [payments, setPayments] = useState([]);
  const [eligibleApplications, setEligibleApplications] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [detailOpen, setDetailOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [approving, setApproving] = useState(false);
  const [snackbar, setSnackbar] = useState(initialSnackbar);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);

  const notify = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchPayments = useCallback(
    async (message = "Memuat pembayaran izin lahan...") => {
      setLoadingMessage(message);
      setLoading(true);
      try {
        const response = await axios.get("/api/land-permit-payments");
        if (!response.data?.success) {
          notify(
            response.data?.message || "Gagal mengambil pembayaran izin lahan.",
            "error",
          );
          return false;
        }
        
        console.log("Fetched payments:", response);

        setPayments(response.data.data || []);
        setEligibleApplications(response.data.eligible_applications || []);
        setPaymentsLoaded(true);
        return true;
      } catch (error) {
        notify(
          error?.response?.data?.message ||
            "Terjadi kesalahan saat mengambil pembayaran izin lahan.",
          "error",
        );
        return false;
      } finally {
        setLoading(false);
        setLoadingMessage("Loading...");
      }
    },
    [],
  );

  useEffect(() => {
    if (user) fetchPayments();
  }, [fetchPayments, user]);

  useEffect(() => {
    const handleNotificationOpen = () => {
      setNotificationOpenSignal((current) => current + 1);
    };
    window.addEventListener(
      "sewain:land-permit-payment-notification-open",
      handleNotificationOpen,
    );
    return () => {
      window.removeEventListener(
        "sewain:land-permit-payment-notification-open",
        handleNotificationOpen,
      );
    };
  }, []);

  useEffect(() => {
    if (!user || !paymentsLoaded || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const storedTarget = window.sessionStorage.getItem(
      "sewain:land-permit-payment-target",
    );
    let parsedTarget = null;
    if (storedTarget) {
      try {
        parsedTarget = JSON.parse(storedTarget);
      } catch {
        window.sessionStorage.removeItem("sewain:land-permit-payment-target");
      }
    }

    const paymentId = Number(
      parsedTarget?.paymentId || params.get("payment_id"),
    );
    const openMode = parsedTarget?.openMode || params.get("open");
    if (!paymentId || !["detail", "progress"].includes(openMode)) return;

    const target = payments.find(
      (item) => Number(item.land_permit_payment_id) === paymentId,
    );
    if (target) {
      setSelectedData(target);
      if (openMode === "progress") setProgressOpen(true);
      else setDetailOpen(true);
    } else {
      notify(
        parsedTarget?.deleted
          ? "Pembayaran izin lahan sudah dihapus dan tidak dapat ditampilkan."
          : "Pembayaran izin lahan tidak ditemukan atau akses tidak tersedia.",
        "error",
      );
    }
    window.sessionStorage.removeItem("sewain:land-permit-payment-target");
    window.history.replaceState(null, "", window.location.pathname);
    window.dispatchEvent(new Event("sewain:global-loading-hide"));
  }, [notificationOpenSignal, payments, paymentsLoaded, user]);

  const filteredPayments = useMemo(
    () => filterLandPermitPayments(payments, searchText),
    [payments, searchText],
  );
  const stats = useMemo(
    () => buildLandPermitPaymentStats(payments, theme),
    [payments, theme],
  );

  const openCreate = async () => {
    const loaded = await fetchPayments(
      "Memuat data form pembayaran izin lahan...",
    );
    if (!loaded) return;
    setSelectedData(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = async (record) => {
    const loaded = await fetchPayments("Memuat data pembayaran izin lahan...");
    if (!loaded) return;
    setSelectedData(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleSubmit = async (formData) => {
    setLoadingMessage(
      formMode === "edit"
        ? "Memperbarui pembayaran izin lahan..."
        : "Menyimpan pembayaran izin lahan...",
    );
    setLoading(true);
    try {
      const response =
        formMode === "edit"
          ? await axios.put(
              `/api/land-permit-payments/${selectedData.land_permit_payment_id}`,
              formData,
            )
          : await axios.post("/api/land-permit-payments", formData);

      if (response.data?.success) {
        notify(
          response.data.message || "Pembayaran izin lahan berhasil disimpan.",
        );
        setFormOpen(false);
        setSelectedData(null);
        await fetchPayments("Memuat ulang pembayaran izin lahan...");
        return;
      }
      notify(response.data?.message || "Gagal menyimpan pembayaran.", "error");
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan pembayaran izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handleApprove = async () => {
    if (
      !selectedData?.payment_approval_id ||
      !selectedData?.land_permit_payment_id
    ) {
      return;
    }

    setApproving(true);
    setLoadingMessage("Menyetujui pembayaran izin lahan...");
    setLoading(true);
    try {
      const response = await axios.put(
        `/api/land-permit-payment-approval/${selectedData.payment_approval_id}`,
        {
          payment_id: selectedData.land_permit_payment_id,
          status: "approved",
        },
      );
      if (response.data?.success) {
        notify(response.data.message || "Pembayaran berhasil disetujui.");
        setDetailOpen(false);
        setSelectedData(null);
        await fetchPayments("Memuat ulang pembayaran izin lahan...");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Gagal menyetujui pembayaran izin lahan.",
        "error",
      );
    } finally {
      setApproving(false);
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handleReject = async (notes) => {
    if (
      !selectedData?.payment_approval_id ||
      !selectedData?.land_permit_payment_id
    ) {
      return;
    }

    setLoadingMessage("Menolak pembayaran izin lahan...");
    setLoading(true);
    try {
      const response = await axios.put(
        `/api/land-permit-payment-approval/${selectedData.payment_approval_id}`,
        {
          payment_id: selectedData.land_permit_payment_id,
          status: "rejected",
          notes,
        },
      );
      if (response.data?.success) {
        notify(response.data.message || "Pembayaran berhasil ditolak.");
        setRejectOpen(false);
        setSelectedData(null);
        await fetchPayments("Memuat ulang pembayaran izin lahan...");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Gagal menolak pembayaran izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handleDelete = async () => {
    if (!selectedData?.land_permit_payment_id) return;

    setLoadingMessage("Menghapus pembayaran izin lahan...");
    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/land-permit-payments/${selectedData.land_permit_payment_id}`,
      );
      if (response.data?.success) {
        notify(response.data.message || "Pembayaran berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedData(null);
        await fetchPayments("Memuat ulang pembayaran izin lahan...");
      }
    } catch (error) {
      notify(
        error?.response?.data?.message ||
          "Gagal menghapus pembayaran izin lahan.",
        "error",
      );
    } finally {
      setLoading(false);
      setLoadingMessage("Loading...");
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Kwitansi Penerimaan Izin Lahan",
    pageStyle: `
      @page { size: letter portrait; margin: 0; }
      @media print {
        html, body {
          margin: 0;
          padding: 0;
          width: 216mm;
          min-height: 279mm;
          overflow: visible;
        }
      }
    `,
    onAfterPrint: () => setTimeout(() => setPrintData(null), 200),
  });

  useEffect(() => {
    if (!printData) return;
    const timeout = setTimeout(() => {
      if (printRef.current) handlePrint();
    }, 200);
    return () => clearTimeout(timeout);
  }, [handlePrint, printData]);

  const columns = useMemo(
    () =>
      createLandPermitPaymentColumns({
        theme,
        user,
        isMobile,
        onDetail: (record) => {
          setSelectedData(record);
          setDetailOpen(true);
        },
        onProgress: (record) => {
          setSelectedData(record);
          setProgressOpen(true);
        },
        onEdit: openEdit,
        onPrint: setPrintData,
        onDelete: (record) => {
          setSelectedData(record);
          setDeleteOpen(true);
        },
        onReject: (record) => {
          setSelectedData(record);
          setRejectOpen(true);
        },
      }),
    [isMobile, theme, user],
  );

  const canWrite = [1, 9].includes(Number(user?.role_id));
  const canApprove =
    [1, 8].includes(Number(user?.role_id)) &&
    selectedData?.payment_approval_status === "proses" &&
    selectedData?.payment_approval_record_status === "pending";

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        p: { xs: 1.25, sm: 2 },
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          breadcrumbs={[
            {
              label: "Transaksi",
              value: "transactions",
              icon: "solar:money-bag-bold-duotone",
              path: "#",
            },
            {
              label: "Pembayaran Izin Lahan",
              value: "land-permit-payments",
              icon: "solar:wallet-money-bold-duotone",
              path: "/land-permit-payments",
            },
          ]}
          title="Pembayaran Izin Lahan"
          description="Kelola bukti pembayaran lunas izin lahan, verifikasi keuangan, dan cetak kwitansi penerimaan."
          icon="solar:wallet-money-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            canWrite && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<Icon icon="solar:add-circle-bold-duotone" />}
                onClick={openCreate}
                sx={{
                  minHeight: 46,
                  px: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",
                }}
              >
                Tambah Pembayaran
              </Button>
            )
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {stats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Pembayaran Izin Lahan"
          description={`${filteredPayments.length} dari ${payments.length} pembayaran ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari pemohon, NIK, lokasi, sektor, lahan, atau status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey={(record) => record.land_permit_payment_id}
            columns={columns}
            dataSource={filteredPayments}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={LAND_PAYMENT_PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: LAND_PAYMENT_TABLE_SCROLL_WIDTH, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "land-payments-action-column",
              buttonsClassName: "land-payments-action-buttons",
              buttonsOffsetX: 6,
              width: LAND_PAYMENT_ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <LandPermitPaymentFormModal
        open={formOpen}
        mode={formMode}
        selectedPayment={selectedData}
        applications={eligibleApplications}
        loading={loading}
        onClose={() => !loading && setFormOpen(false)}
        onSubmit={handleSubmit}
        onNotify={setSnackbar}
      />
      <LandPermitPaymentDetailModal
        open={detailOpen}
        onClose={() => !approving && setDetailOpen(false)}
        data={selectedData}
        canApprove={canApprove}
        approving={approving}
        onApprove={handleApprove}
      />
      <ApprovalTrackingModal
        open={progressOpen}
        onClose={() => setProgressOpen(false)}
        selectedData={selectedData}
        variant="landPermitPayment"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />
      <RejectReasonModal
        open={rejectOpen}
        onClose={() => !loading && setRejectOpen(false)}
        title="Tolak Bukti Pembayaran"
        description="Tuliskan alasan penolakan agar admin izin lahan dapat memperbaiki bukti pembayaran."
        confirmLabel="Tolak Pembayaran"
        loading={loading}
        onSubmit={handleReject}
      />
      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Bukti Pembayaran"
        titleDescription="Konfirmasi penghapusan bukti pembayaran dari sistem."
        description={`Bukti pembayaran atas nama ${selectedData?.tenant_name || "-"} akan dihapus. Status pembayaran permohonan akan kembali menjadi belum dibayar.`}
        confirmLabel="Hapus Data"
        loadingLabel="Menghapus pembayaran izin lahan..."
        severity="error"
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <LoadingBackdrop open={loading} message={loadingMessage} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />

      <div style={{ display: "none" }}>
        {printData && <LandPermitReceipt ref={printRef} data={printData} />}
      </div>
    </Box>
  );
}
