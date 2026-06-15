"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Grid, Stack, useMediaQuery, useTheme } from "@mui/material";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useReactToPrint } from "react-to-print";
import LoadingBackdrop from "../../components/loading/Backdrop";
import Notification from "../../components/Notification";
import PaymentFormModal from "./PaymentFormModal";
import RejectReasonModal from "@/app/components/modals/RejectReasonModal";
import ApprovalTrackingModal from "@/app/components/modals/ApprovalTrackingModal";
import TenantLeaseDetailModal from "@/app/components/modals/TenantLeaseDetailModal";
import BuktiPembayaran from "@/app/components/documents/BuktiPembayaran";
import KwitansiBundle from "@/app/components/documents/KwitansiBundle";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import { useUser } from "@/app/utils/useUser";
import {
  PAYMENT_ACTION_COLUMN_WIDTH,
  PAYMENT_PAGE_SIZE_OPTIONS,
  PAYMENT_TABLE_SCROLL_WIDTH,
  buildPaymentStats,
  createPaymentColumns,
  filterPayments,
} from "./PaymentsTableColumns";
import {
  buildPaymentContext,
  normalizePaymentForLeaseDetail,
} from "./paymentDetailMapper";

const Payments = () => {
  const isMobile = useMediaQuery("( max-width: 600px )");
  const proofPrintRef = useRef();
  const receiptPrintRef = useRef();
  const { user } = useUser();
  const theme = useTheme();
  const [dataPayments, setDataPayments] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [openProgressModal, setOpenProgressModal] = useState(false);
  const [openRejectedModal, setOpenRejectedModal] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [proofPrintData, setProofPrintData] = useState(null);
  const [receiptPrintData, setReceiptPrintData] = useState(null);
  const [approvingPayment, setApprovingPayment] = useState(false);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [handledNotificationTarget, setHandledNotificationTarget] =
    useState(null);
  const [notificationOpenSignal, setNotificationOpenSignal] = useState(0);

  const hideGlobalNotificationLoading = () => {
    window.dispatchEvent(new Event("sewain:global-loading-hide"));
  };

  const resetNotificationFeedback = () => {
    setSnackbar((current) => ({ ...current, open: false, message: "" }));
  };

  const clearNotificationRouteState = () => {
    if (typeof window === "undefined") return;

    window.sessionStorage.removeItem("sewain:payment-target");

    const params = new URLSearchParams(window.location.search);
    const hasNotificationParams =
      params.has("open") || params.has("payment_id") || params.has("deleted");

    if (hasNotificationParams) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const getDataPayments = async () => {
    setLoading(true);
    setPaymentsLoaded(false);

    try {
      const response = await axios.get("/api/payments");
      setDataPayments(response.data?.success ? response.data.data || [] : []);
    } catch (error) {
      console.error("Error fetch payments:", error);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Gagal mengambil data pembayaran.",
      });
    } finally {
      setPaymentsLoaded(true);
      setTimeout(() => setLoading(false), 600);
    }
  };

  useEffect(() => {
    if (user) {
      getDataPayments();
    }
  }, [user]);

  useEffect(() => {
    const handleNotificationOpenSignal = () => {
      setNotificationOpenSignal((value) => value + 1);
    };

    window.addEventListener(
      "sewain:payment-notification-open",
      handleNotificationOpenSignal,
    );

    return () => {
      window.removeEventListener(
        "sewain:payment-notification-open",
        handleNotificationOpenSignal,
      );
    };
  }, []);

  useEffect(() => {
    const getNotificationTarget = () => {
      if (typeof window === "undefined") return null;

      const params = new URLSearchParams(window.location.search);
      const storageValue = window.sessionStorage.getItem("sewain:payment-target");

      if (storageValue) {
        try {
          const parsed = JSON.parse(storageValue);
          return {
            openMode: parsed.openMode || "detail",
            paymentId: Number(parsed.paymentId),
            deletedFromNotification: Boolean(parsed.deleted),
            requestedAt: parsed.requestedAt,
          };
        } catch {
          window.sessionStorage.removeItem("sewain:payment-target");
        }
      }

      return {
        openMode: params.get("open"),
        paymentId: Number(params.get("payment_id")),
        deletedFromNotification: params.get("deleted") === "1",
        requestedAt: 0,
      };
    };

    const target = getNotificationTarget();
    const openMode = target?.openMode;
    const paymentId = target?.paymentId;
    const deletedFromNotification = target?.deletedFromNotification;
    const targetKey = `${paymentId}-${openMode}-${deletedFromNotification}-${target?.requestedAt || 0}`;

    /**
     * Dashboard queue memakai open=approval karena konteksnya memang validasi.
     * Di halaman payments, approval dilakukan dari modal detail pemohon yang
     * sama dengan open=detail, sementara open=progress khusus riwayat verifikasi.
     */
    if (
      !["detail", "approval", "progress"].includes(openMode) ||
      !paymentId ||
      !user ||
      (!deletedFromNotification && !paymentsLoaded) ||
      handledNotificationTarget === targetKey
    ) {
      return;
    }

    const openPaymentFromNotification = async () => {
      setHandledNotificationTarget(targetKey);
      resetNotificationFeedback();
      setLoadingMessage("Menampilkan detail pembayaran...");
      setLoading(true);

      try {
        window.sessionStorage.removeItem("sewain:payment-target");

        if (deletedFromNotification) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          setSelectedData(null);
          setOpenDetailModal(false);
          setOpenProgressModal(false);
          setSnackbar({
            open: true,
            severity: "error",
            message:
              "Data pembayaran ini sudah dihapus, sehingga detail pembayaran tidak dapat ditampilkan.",
          });
          return;
        }

        /**
         * Data dari notifikasi selalu diambil ulang agar status terbaru
         * terbaca setelah bukti pembayaran diubah atau ditolak.
         */
        const response = await axios.get("/api/payments");
        const freshPayments = response.data?.success
          ? response.data.data || []
          : [];
        setDataPayments(freshPayments);

        const selectedPayment = freshPayments.find(
          (item) => Number(item?.payments?.payment_id) === paymentId,
        );

        await new Promise((resolve) => setTimeout(resolve, 900));

        if (selectedPayment) {
          resetNotificationFeedback();
          setSelectedData(selectedPayment);
          if (openMode === "progress") {
            setOpenDetailModal(false);
            setOpenProgressModal(true);
          } else {
            setOpenProgressModal(false);
            setOpenDetailModal(true);
          }
          return;
        }

        setSnackbar({
          open: true,
          severity: "error",
          message:
            "Data pembayaran tidak ditemukan. Kemungkinan data sudah dihapus atau akses tidak tersedia.",
        });
      } catch (error) {
        console.error("Error open payment from notification:", error);
        setSnackbar({
          open: true,
          severity: "error",
          message: "Gagal menampilkan detail pembayaran dari notifikasi.",
        });
      } finally {
        clearNotificationRouteState();
        setLoading(false);
        setLoadingMessage("Loading...");
        hideGlobalNotificationLoading();
      }
    };

    openPaymentFromNotification();
  }, [
    handledNotificationTarget,
    notificationOpenSignal,
    paymentsLoaded,
    user,
  ]);

  const filteredData = useMemo(
    () => filterPayments(dataPayments, searchText),
    [dataPayments, searchText],
  );

  const paymentStats = useMemo(
    () => buildPaymentStats(dataPayments, theme),
    [dataPayments, theme],
  );

  const handleEdit = (record) => {
    setSelectedData(record);
    setOpenEditModal(true);
  };

  const handleDelete = (record) => {
    setSelectedData(record);
    setOpenDeleteModal(true);
  };

  const handleReject = (record) => {
    setSelectedData(record);
    setOpenRejectedModal(true);
  };

  const handleDetail = (record) => {
    setSelectedData(record);
    setOpenDetailModal(true);
  };

  const handleProgress = (record) => {
    setSelectedData(record);
    setOpenProgressModal(true);
  };

  const handlePrintProof = (record) => {
    setProofPrintData(record);
  };

  const handlePrintReceiptBundle = (record) => {
    setReceiptPrintData(record);
  };

  const handleRejectPayment = async (notes) => {
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/payment-approval/payment-rejected/${selectedData?.payment_approval?.id}`,
        {
          notes,
          status: "rejected",
          payment_id: selectedData?.payments?.payment_id,
        },
      );

      if (response?.data?.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Berhasil menolak bukti pembayaran.",
          severity: "success",
        });
        await getDataPayments();
        setOpenRejectedModal(false);
        return;
      }

      setSnackbar({
        open: true,
        message: response?.data?.message || "Gagal menolak bukti pembayaran.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error rejecting payment approval:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message || "Gagal menolak bukti pembayaran.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedData?.payment_approval?.id || !selectedData?.payments?.payment_id) {
      return;
    }

    setApprovingPayment(true);
    setLoadingMessage("Menyetujui bukti pembayaran...");
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/payment-approval/${selectedData.payment_approval.id}`,
        {
          payment_id: selectedData.payments.payment_id,
          status: "approved",
          tenant_application_id:
            selectedData?.tenant_application?.tenant_application_id,
          payment_type: selectedData?.tenant_application?.payment_type,
        },
      );

      if (response.data?.success) {
        setSnackbar({
          open: true,
          message:
            response.data.message || "Bukti pembayaran berhasil disetujui.",
          severity: "success",
        });
        await getDataPayments();
        setOpenDetailModal(false);
        return;
      }

      setSnackbar({
        open: true,
        message: response.data?.message || "Gagal menyetujui bukti pembayaran.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error approve payment:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message ||
          "Terjadi kesalahan saat menyetujui bukti pembayaran.",
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setApprovingPayment(false);
        setLoading(false);
        setLoadingMessage("Loading...");
      }, 500);
    }
  };

  const handleDeletePayment = async () => {
    if (!selectedData?.payments?.payment_id) return;

    setLoadingMessage("Menghapus bukti pembayaran...");
    setLoading(true);

    try {
      const response = await axios.delete(
        `/api/payments/${selectedData.payments.payment_id}`,
      );

      if (response?.data?.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Bukti pembayaran berhasil dihapus.",
          severity: "success",
        });
        await getDataPayments();
        setOpenDeleteModal(false);
        setSelectedData(null);
        return;
      }

      setSnackbar({
        open: true,
        message: response?.data?.message || "Gagal menghapus bukti pembayaran.",
        severity: "error",
      });
    } catch (error) {
      console.error("Error delete payment:", error);
      setSnackbar({
        open: true,
        message:
          error?.response?.data?.message || "Gagal menghapus bukti pembayaran.",
        severity: "error",
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setLoadingMessage("Loading...");
      }, 500);
    }
  };

  const handlePrintProofAction = useReactToPrint({
    contentRef: proofPrintRef,
    documentTitle: "Bukti Pembayaran",
    onAfterPrint: () => setTimeout(() => setProofPrintData(null), 200),
  });

  const handleReceiptPrintAction = useReactToPrint({
    contentRef: receiptPrintRef,
    documentTitle: "Kwitansi Pembayaran",
    pageStyle: `
      @page {
        size: letter portrait;
        margin: 0;
      }

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
    onAfterPrint: () => setTimeout(() => setReceiptPrintData(null), 200),
  });

  useEffect(() => {
    if (!proofPrintData) return;

    const timeout = setTimeout(() => {
      if (proofPrintRef.current) handlePrintProofAction();
    }, 200);

    return () => clearTimeout(timeout);
  }, [proofPrintData, handlePrintProofAction]);

  useEffect(() => {
    if (!receiptPrintData) return;

    const timeout = setTimeout(() => {
      if (receiptPrintRef.current) handleReceiptPrintAction();
    }, 200);

    return () => clearTimeout(timeout);
  }, [receiptPrintData, handleReceiptPrintAction]);

  const columns = useMemo(
    () =>
      createPaymentColumns({
        data: dataPayments,
        user,
        theme,
        isMobile,
        onDetail: handleDetail,
        onProgress: handleProgress,
        onPrintProof: handlePrintProof,
        onPrintReceiptBundle: handlePrintReceiptBundle,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onReject: handleReject,
      }),
    [dataPayments, user, theme],
  );

  return (
    <Box sx={{ width: "100%", height: "100%", minHeight: "100%", p: { xs: 1.25, sm: 2 } }}>
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          breadcrumbs={[
            {
              label: "Transactions",
              value: "transactions",
              icon: "solar:money-bag-bold-duotone",
              path: "#",
            },
            {
              label: "Payments",
              value: "payments",
              icon: "streamline:payment-10-remix",
              path: "/payments",
            },
          ]}
          title="Payments"
          description="Kelola bukti pembayaran tenant, validasi keuangan, status verifikasi, dan cetak dokumen pembayaran dalam satu halaman."
          icon="streamline:payment-10-remix"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            Number(user?.role_id) !== 8 && (
              <Button
                fullWidth
                variant="contained"
                startIcon={<Icon icon="streamline:payment-10-remix" />}
                onClick={() => setOpenAddModal(true)}
                sx={{
                  minHeight: 46,
                  px: { xs: 2, sm: 2.5 },
                  borderRadius: 2,
                  fontFamily: "Poppins",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 6px 14px rgba(255, 152, 0, 0.18)"
                      : "0 6px 14px rgba(230, 9, 9, 0.16)",
                }}
              >
                Tambah Pembayaran
              </Button>
            )
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {paymentStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Pembayaran"
          description={`${filteredData.length} dari ${dataPayments.length} pembayaran ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari penyewa, NIK, ruangan, status..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey={(record) => record.payments?.payment_id}
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAYMENT_PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: PAYMENT_TABLE_SCROLL_WIDTH, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "payments-action-column",
              buttonsClassName: "payments-action-buttons",
              width: PAYMENT_ACTION_COLUMN_WIDTH,
              paddingX: 14,
            }}
          />
        </DataTableShell>
      </Stack>

      <PaymentFormModal
        open={openAddModal}
        mode="create"
        onClose={() => setOpenAddModal(false)}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        user={user}
      />
      <PaymentFormModal
        open={openEditModal}
        mode="edit"
        onClose={() => setOpenEditModal(false)}
        selectedCurrentData={selectedData}
        getDataPayments={getDataPayments}
        onNotify={(notify) => setSnackbar(notify)}
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        user={user}
      />
      <CrudConfirmModal
        open={openDeleteModal}
        title="Hapus Bukti Pembayaran"
        description="Konfirmasi penghapusan bukti pembayaran dari sistem."
        confirmDescription={
          <>
            Bukti pembayaran{" "}
            <Box component="strong" sx={{ color: "text.primary", fontWeight: 700 }}>
              {selectedData?.tenant_application?.tenant_name || "-"}
            </Box>{" "}
            pada tahap{" "}
            <Box component="strong" sx={{ color: "text.primary", fontWeight: 700 }}>
              {selectedData?.payments?.payment_number === 1
                ? "Uang Muka (DP)"
                : `Cicilan ${Number(selectedData?.payments?.payment_number || 1) - 1}`}
            </Box>{" "}
            akan dihapus dari sistem.
          </>
        }
        confirmLabel="Hapus Data"
        loadingLabel="Menghapus bukti pembayaran..."
        severity="error"
        loading={loading}
        onClose={() => !loading && setOpenDeleteModal(false)}
        onConfirm={handleDeletePayment}
      />
      <TenantLeaseDetailModal
        open={openDetailModal}
        onClose={() => setOpenDetailModal(false)}
        selectedData={normalizePaymentForLeaseDetail(selectedData)}
        canApprove={
          Number(user?.role_id) === 8 &&
          selectedData?.payments?.approval_status === "proses" &&
          !["approved", "rejected"].includes(
            selectedData?.payment_approval?.status,
          )
        }
        approving={approvingPayment}
        onApprove={handleApprovePayment}
        paymentContext={buildPaymentContext(selectedData)}
      />
      <RejectReasonModal
        open={openRejectedModal}
        onClose={() => setOpenRejectedModal(false)}
        title="Tolak Bukti Pembayaran"
        description="Tuliskan alasan agar riwayat validasi pembayaran tercatat jelas."
        confirmLabel="Tolak Pembayaran"
        loading={loading}
        onSubmit={handleRejectPayment}
      />
      <ApprovalTrackingModal
        open={openProgressModal}
        onClose={() => setOpenProgressModal(false)}
        selectedData={selectedData}
        variant="payment"
        loadingTrue={() => setLoading(true)}
        loadingFalse={() => setLoading(false)}
        setLoadingMessage={setLoadingMessage}
      />
      <LoadingBackdrop message={loadingMessage} open={loading} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />

      <div style={{ display: "none" }}>
        {proofPrintData && <BuktiPembayaran ref={proofPrintRef} data={proofPrintData} />}
      </div>
      <div style={{ display: "none" }}>
        {receiptPrintData && <KwitansiBundle ref={receiptPrintRef} data={receiptPrintData} />}
      </div>
    </Box>
  );
};

export default Payments;
