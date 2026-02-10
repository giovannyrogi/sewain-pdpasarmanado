import {
  alpha,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import { Add } from "@mui/icons-material";
import { Icon } from "@iconify/react";
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import formatRupiah from "@/app/components/formatrupiah/page";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import DetailRoomsModal from "@/app/components/detailroomsmodal/page";
import ViewCalcPPNModal from "@/app/components/view-calc-ppn-modal/ViewCalcPPNModal";
import InformationPreviewModal from "@/app/components/informationpreviewmodal/page";

const AddTenantApplication = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataTenantApplication,
  getLocationsData,
  dataLocations,
  onNotify,
  setLoadingMessage,
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const style = {
    width: isMobile ? "90vw" : 600,
    maxWidth: "98vw",
    bgcolor: "background.paper",
    color: "text.primary",
    borderRadius: "10px",
    boxShadow: 24,
    p: "18px 20px 18px 20px",
    maxHeight: "90vh",
    overflowY: "auto",
    transition: "box-shadow 0.3s",
    //hide scrollbar
    "&::-webkit-scrollbar": {
      display: "none",
    },
  };

  const { themeMode } = useThemeMode();
  const theme = useTheme();

  const [ktpFilePath, setKtpFilePath] = useState("");
  const [locationId, setLocationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentType, setPaymentType] = useState("lunas");
  const [totalPayment, setTotalPayment] = useState("");
  const [totalSewaKontrakRuangan, setTotalSewaKontrakRuangan] = useState("");
  const [totalPPN, setTotalPPN] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [remainingPayment, setRemainingPayment] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("proses");
  const [openPreview, setOpenPreview] = useState(false);
  const [dataAvailableRooms, setDataAvailableRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openViewDetailRoomModal, setOpenViewDetailRoomModal] = useState(false);
  const [openViewDetailCalculatePPNModal, setOpenViewDetailCalculatePPNModal] =
    useState(false);
  const [selectedDataRooms, setSelectedDataRooms] = useState({});
  const [estimatedInstallment1, setEstimatedInstallment1] = useState("");
  const [estimatedInstallment2, setEstimatedInstallment2] = useState("");
  const [estimatedInstallment3, setEstimatedInstallment3] = useState("");
  const [estimatedInstallmentDate1, setEstimatedInstallmentDate1] =
    useState(null);
  const [estimatedInstallmentDate2, setEstimatedInstallmentDate2] =
    useState(null);
  const [estimatedInstallmentDate3, setEstimatedInstallmentDate3] =
    useState(null);
  const [tenantType, setTenantType] = useState("permohonan_baru");
  const [listDataTenantExtends, setListDataTenantExtends] = useState([]);
  const [selectedDataTenantExtends, setSelectedDataTenantExtends] =
    useState(null);

  const [biayaAdministrasi, setBiayaAdministrasi] = useState(50000);
  const [totalPPNDownPayment, setTotalPPNDownPayment] = useState(0);
  const [totalSewaKontrakDownPayment, setTotalSewaKontrakDownPayment] =
    useState(0);
  const [totalPaymentDownPayment, setTotalPaymentDownPayment] = useState(0);
  const [totalInstallment, setTotalInstallment] = useState(0);

  const [listDataIdentity, setListDataIdentity] = useState([]);
  const [identityID, setIdentityID] = useState(null);
  const [selectedDataIdentity, setSelectedDataIdentity] = useState("");
  const [openViewInformationModal, setOpenViewInformationModal] =
    useState(false);
  const [chooseTenor, setChooseTenor] = useState(1);
  const [documentNumber, setDocumentNumber] = useState("");
  const [durasiKontrak, setDurasiKontrak] = useState(0);
  const [highestDocumentNumber, setHighestDocumentNumber] = useState(null);
  const toRoman = (num) => {
    const roman = [
      "",
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
    return roman[num] || "";
  };

  const getPrefix = () => {
    const now = new Date();
    const monthRoman = toRoman(now.getMonth() + 1);
    const year = now.getFullYear();
    return (
      <InputAdornment
        position="end"
        sx={{
          whiteSpace: "nowrap",
          color: theme.palette.primary.main,
        }}
      >
        <Typography
          sx={{
            whiteSpace: "nowrap",
            fontWeight: "bold",
            fontSize: "14px",
            letterSpacing: "1px",
          }}
        >{`/PM/SKR/${monthRoman}/${year}`}</Typography>
      </InputAdornment>
    );
  };

  const installments = [
    {
      label: "Cicilan 1",
      amount: estimatedInstallment1,
      setAmount: setEstimatedInstallment1,
      date: estimatedInstallmentDate1,
      setDate: setEstimatedInstallmentDate1,
    },
    {
      label: "Cicilan 2",
      amount: estimatedInstallment2,
      setAmount: setEstimatedInstallment2,
      date: estimatedInstallmentDate2,
      setDate: setEstimatedInstallmentDate2,
    },
    {
      label: "Cicilan 3",
      amount: estimatedInstallment3,
      setAmount: setEstimatedInstallment3,
      date: estimatedInstallmentDate3,
      setDate: setEstimatedInstallmentDate3,
    },
  ];

  const getHighestDocumentNumber = async () => {
    loadingTrue();
    try {
      const response = await axios.get(
        `/api/tenant-application/update-document`,
      );
      // console.log("response update document", response);
      if (response.data.success) {
        setHighestDocumentNumber(response.data.data);
        setTimeout(() => {
          loadingFalse();
        }, 1000);
      } else {
        console.log("error", response);
        setTimeout(() => {
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

  const getRoomsData = async (locationId) => {
    if (!locationId) {
      setDataAvailableRooms([]);
      return;
    }

    setLoadingMessage("Mengambil data ruangan...");

    loadingTrue();

    try {
      const response = await axios.get(
        `/api/rooms/available-rooms?location_id=${locationId}`,
      );

      // console.log("response rooms", response.data);

      if (response.data.data.length === 0) {
        onNotify &&
          onNotify({
            open: true,
            message: `Tidak ada ruangan yang tersedia untuk lokasi ini.`,
            severity: "error",
          });
      }

      setDataAvailableRooms(response.data.data);
      setTimeout(() => {
        loadingFalse();
        setLoadingMessage("");
      }, 500);
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
        setLoadingMessage("");
      }, 500);
    }
  };

  const getListTenantExtends = async () => {
    loadingTrue();
    setLoadingMessage("Mengambil data sebelumnya...");
    try {
      const response = await axios.get(
        "/api/tenant-application/tenant-extends",
      );
      console.log("response tenant-extends", response);

      // setEndDate(response?.data?.data?.[0]?.end_date);

      if (response.data.success) {
        setListDataTenantExtends(response.data.data);
        setTimeout(() => {
          loadingFalse();
          setLoadingMessage("");
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
        setLoadingMessage("");
      }, 1000);
    }
  };

  const getCurrentExtendTenant = async (id) => {
    loadingTrue();
    setLoadingMessage("Mengambil data sebelumnya...");
    try {
      const response = await axios.get(
        `/api/tenant-application/tenant-extends/${id}`,
      );
      // console.log("response previous data", response);
      setLocationId(response.data?.data?.locations?.id);

      await getRoomsData(response.data?.data?.locations?.id);

      setSelectedDataRooms(response.data?.data?.rooms);
      setPaymentType(response.data?.data?.tenant_application?.payment_type);
      setRoomId(response.data?.data?.rooms?.id);

      if (response.data.success) {
        setTimeout(() => {
          loadingFalse();
          setLoadingMessage("");
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
        setLoadingMessage("");
      }, 1000);
    }
  };

  const getListIdentities = async () => {
    loadingTrue();
    setLoadingMessage("Mengambil data penyewa baru...");
    try {
      const response = await axios.get("/api/tenant-application/new-tenant");
      // console.log("response identity-list", response);
      if (response.data.success) {
        setListDataIdentity(response.data.data);
        setTimeout(() => {
          loadingFalse();
          setLoadingMessage("");
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
        setLoadingMessage("");
      }, 1000);
    }
  };

  useEffect(() => {
    if (open) {
      getListIdentities();
      getHighestDocumentNumber();
    }
  }, [open]);

  useEffect(() => {
    if (startDate && endDate) {
      const duration = endDate.diff(startDate, "days");
      setDurasiKontrak(duration + 1);
    }
  }, [startDate, endDate]);

  // Sinkronisasi DP & Sisa saat totalPayment atau paymentType berubah
  useEffect(() => {
    if (paymentType === "cicilan") {
      const total = Number(totalPayment) || 0;
      const defaultDP = Math.round(total * 0.4);
      setDownPayment(defaultDP);
      setRemainingPayment(total - defaultDP);
    } else {
      setDownPayment("");
      setRemainingPayment("");
    }
  }, [totalPayment, paymentType]);

  // Hitung total payment otomatis saat pilih ruangan
  useEffect(() => {
    if (selectedDataRooms?.price_type === "harga_per_meter") {
      const total =
        parseFloat(selectedDataRooms.room_area) * // luas dari room_length * room_width
        parseInt(selectedDataRooms.price_per_m2); // harga dari price_per_m2

      const totalPPN = total * 0.11; // tambahkan PPN 11%
      const grandTotal = total + totalPPN + biayaAdministrasi;

      setTotalSewaKontrakRuangan(total);
      setTotalPPN(totalPPN);
      setTotalPayment(grandTotal); // simpan ke state totalPayment
    } else {
      const total = parseInt(selectedDataRooms.price_per_m2);
      const totalPPN = total * 0.11; // tambahkan PPN 11%
      const grandTotal = total + totalPPN + biayaAdministrasi;

      setTotalSewaKontrakRuangan(total);
      setTotalPPN(totalPPN);
      setTotalPayment(grandTotal); // simpan ke state totalPayment
      console.log('total', total);
      console.log('totalPPN', totalPPN);
      console.log('grandTotal', grandTotal);
    }

    
  }, [selectedDataRooms]);

  // Sinkronisasi Sisa saat DP diubah manual
  useEffect(() => {
    if (paymentType === "cicilan") {
      const total = Number(totalPayment) || 0;
      const dp = Number(downPayment) || 0;
      const SewaKontrakRuangan = dp / 1.11;
      const totalPPN = SewaKontrakRuangan * 0.11;
      const grandTotal = Number(SewaKontrakRuangan + totalPPN).toFixed(2);

      setTotalPaymentDownPayment(grandTotal);
      setTotalPPNDownPayment(totalPPN);
      setTotalSewaKontrakDownPayment(SewaKontrakRuangan);
      setRemainingPayment(total - dp);
    }
  }, [downPayment, paymentType, totalPayment]);

  // Hitung cicilan otomatis saat remainingPayment berubah
  useEffect(() => {
    if (paymentType !== "cicilan") {
      setEstimatedInstallment1("");
      setEstimatedInstallment2("");
      setEstimatedInstallment3("");
      setTotalInstallment("");
      return;
    }

    const sisa = Number(remainingPayment) || 0;
    const tenor = Number(chooseTenor) || 1;

    if (tenor === 1) {
      // Pelunasan langsung
      setEstimatedInstallment1(sisa);
      setEstimatedInstallment2("");
      setEstimatedInstallment3("");
      setTotalInstallment(sisa);
      return;
    }

    // Cicilan > 1
    const perCicilan = Math.floor(sisa / tenor);
    const sisaPembulatan = sisa - perCicilan * tenor;

    const cicilan = Array(tenor).fill(perCicilan);
    cicilan[tenor - 1] += sisaPembulatan; // cicilan terakhir menyesuaikan

    setEstimatedInstallment1(cicilan[0] || "");
    setEstimatedInstallment2(cicilan[1] || "");
    setEstimatedInstallment3(cicilan[2] || "");

    setTotalInstallment(cicilan.reduce((a, b) => a + b, 0));
  }, [remainingPayment, paymentType, chooseTenor]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // gabungkan nomor + prefix
    const now = new Date();
    const monthRoman = toRoman(now.getMonth() + 1);
    const year = now.getFullYear();
    const prefix = `/PM/SKR/${monthRoman}/${year}`;
    const finalDocNumber = `${documentNumber}${prefix}`;

    // const totalPaymentWithoutAdminFee =
    //   Number(totalPayment) - biayaAdministrasi;
    const total = Number(totalPayment) || 0;
    const minDp = Math.round(total * 0.4);
    const dp = Number(downPayment) || 0;

    setIsSubmitting(true);

    if (paymentType === "cicilan" && dp < minDp) {
      onNotify &&
        onNotify({
          open: true,
          message: `DP minimal 40% (${formatRupiah(
            minDp,
          )}) dari total pembayaran ${formatRupiah(total)}.`,
          severity: "error",
        });
      setIsSubmitting(false);
      return;
    }

    if (dp > total) {
      onNotify &&
        onNotify({
          open: true,
          message: `DP tidak boleh lebih besar dari total pembayaran ${formatRupiah(
            total,
          )}.`,
          severity: "error",
        });
      loadingFalse && loadingFalse();
      setIsSubmitting(false);
      return;
    }

    if (!total || total === 0) {
      onNotify &&
        onNotify({
          open: true,
          message: "Silakan isi total pembayaran terlebih dahulu.",
          severity: "error",
        });
      loadingFalse && loadingFalse();
      setIsSubmitting(false);
      return;
    }

    if (paymentType === "cicilan") {
      const cicilan = [
        Number(estimatedInstallment1) || 0,
        Number(estimatedInstallment2) || 0,
        Number(estimatedInstallment3) || 0,
      ];

      const usedCicilan = cicilan.slice(0, Number(chooseTenor));
      const totalCicilan = usedCicilan.reduce((a, b) => a + b, 0);

      if (totalCicilan !== Number(remainingPayment)) {
        onNotify &&
          onNotify({
            open: true,
            message: `Total cicilan harus sama dengan sisa tagihan ${formatRupiah(
              remainingPayment,
            )}.`,
            severity: "error",
          });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const formData = new FormData();
      formData.append("location_id", locationId);
      formData.append("room_id", roomId);
      formData.append("payment_type", paymentType);
      formData.append("total_payment", totalPayment);
      formData.append("down_payment", downPayment);
      formData.append("remaining_payment", remainingPayment);
      formData.append("approval_status", approvalStatus);
      formData.append("user_id", user.id);
      formData.append("current_step", 1);
      formData.append("tenant_type", tenantType);
      formData.append("tenant_identity_id", identityID);
      formData.append("total_payment_room", totalSewaKontrakRuangan);
      formData.append("admin_fee", biayaAdministrasi);
      formData.append("total_ppn", totalPPN);
      formData.append("choose_tenor", chooseTenor);
      formData.append("document_number", finalDocNumber);
      formData.append("start_date", moment(startDate).format("YYYY-MM-DD"));
      formData.append("end_date", moment(endDate).format("YYYY-MM-DD"));
      formData.append("tenant_type", tenantType);

      // if (tenantType === "perpanjang_tenant" && endDate) {
      //   // tenant lama endDate dijadikan start_date tenant baru
      //   const newStartDate = moment(endDate).format("YYYY-MM-DD");
      //   // endDate tenant baru = endDate lama + 1 tahun
      //   const newEndDate = moment(endDate).add(1, "year").format("YYYY-MM-DD");

      //   formData.append("start_date", newStartDate);
      //   formData.append("end_date", newEndDate);
      // }

      // hanya kirim data cicilan kalau paymentType === 'cicilan'
      if (paymentType === "cicilan") {
        formData.append("down_payment", downPayment);
        formData.append("remaining_payment", remainingPayment);

        formData.append("estimated_installment_1", estimatedInstallment1 || 0);
        formData.append("estimated_installment_2", estimatedInstallment2 || 0);
        formData.append("estimated_installment_3", estimatedInstallment3 || 0);

        if (estimatedInstallmentDate1) {
          formData.append(
            "estimated_installment_date_1",
            moment(estimatedInstallmentDate1).format("YYYY-MM-DD"),
          );
        }
        if (estimatedInstallmentDate2) {
          formData.append(
            "estimated_installment_date_2",
            moment(estimatedInstallmentDate2).format("YYYY-MM-DD"),
          );
        }
        if (estimatedInstallmentDate3) {
          formData.append(
            "estimated_installment_date_3",
            moment(estimatedInstallmentDate3).format("YYYY-MM-DD"),
          );
        }
      }

      if (tenantType === "perpanjang_tenant") {
        formData.append(
          "renewal_of",
          selectedDataTenantExtends
            ? selectedDataTenantExtends?.tenant_application_id
            : null,
        );
      }

      // for (let pair of formData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      const response = await axios.post("/api/tenant-application", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // console.log("response", response);

      if (response?.data?.success) {
        onNotify &&
          onNotify({
            open: true,
            message:
              response?.data?.message || "Form Permohonan berhasil dibuat!",
            severity: "success",
          });
        getDataTenantApplication();
        getLocationsData();
        getRoomsData();
        setTimeout(() => {
          onClose();
          setIsSubmitting(false);
          clearForm();
        }, 1000);
      } else {
        onNotify &&
          onNotify({
            open: true,
            message:
              response?.data?.message || "Gagal membuat form permohonan.",
            severity: "error",
          });
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error.response?.data?.message ||
            error.message ||
            "Terjadi error saat membuat form permohonan.",
          severity: "error",
        });
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const clearForm = () => {
    setLocationId("");
    setRoomId("");
    setStartDate(null);
    setEndDate(null);
    setPaymentType("lunas");
    setTotalPayment("");
    setDownPayment("");
    setRemainingPayment("");
    setListDataIdentity([]);
    setIdentityID("");
    setEstimatedInstallment1("");
    setEstimatedInstallment2("");
    setEstimatedInstallment3("");
    setEstimatedInstallmentDate1(null);
    setEstimatedInstallmentDate2(null);
    setEstimatedInstallmentDate3(null);
    setTenantType("permohonan_baru");
    setSelectedDataTenantExtends(null);
    setChooseTenor(1);
    setDocumentNumber("");
    setHighestDocumentNumber(null);
    setDurasiKontrak(0);
  };

  // Pilihan dropdown
  const tenantOptions = [
    { label: "Permohonan Baru", value: "permohonan_baru" },
    { label: "Perpanjang Tenant", value: "perpanjang_tenant" },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 0, // hilangkan padding default
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(30,30,30,0.25)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        },
      }}
    >
      <Box sx={style}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontWeight: "bold",
              fontSize: isMobile ? "18px" : "20px",
            }}
          >
            Form Permohonan Sewa Ruangan
          </Typography>
        </Box>

        <Divider
          sx={{
            mt: 0.5,
            mb: 3,
            borderColor: theme.palette.primary.main,
          }}
        />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              <Autocomplete
                options={tenantOptions}
                getOptionLabel={(option) => option.label}
                value={
                  tenantOptions.find((item) => item.value === tenantType) ||
                  null
                }
                onChange={(event, newValue) => {
                  // simpan value ke state
                  if (newValue?.value === "perpanjang_tenant") {
                    clearForm();
                    getListTenantExtends();
                    getHighestDocumentNumber();
                  } else {
                    clearForm();
                    setListDataTenantExtends([]);
                    setSelectedDataTenantExtends(null);
                    getListIdentities();
                  }
                  setTenantType(newValue ? newValue.value : null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Jenis Permohonan"
                    variant="filled"
                    required
                  />
                )}
              />
            </Grid>
            {tenantType === "perpanjang_tenant" ? (
              <Grid size={12}>
                <Autocomplete
                  disabled={!tenantType || tenantType === "permohonan_baru"}
                  options={listDataTenantExtends || []}
                  getOptionLabel={(option) =>
                    option?.tenant_name +
                      " - " +
                      option?.location_name +
                      " - " +
                      option?.room_number || ""
                  }
                  value={selectedDataTenantExtends}
                  onChange={(event, newValue) => {
                    setSelectedDataTenantExtends(newValue ?? null);
                    console.log("newValue perpanjang_tenant", newValue);

                    // clear form setelah menghapus data tenant lama
                    if (!newValue) {
                      clearForm();
                    } else {
                      getCurrentExtendTenant(newValue?.tenant_application_id);
                      setStartDate(moment(newValue?.end_date));
                      setIdentityID(newValue?.tenant_identity_id);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Data Penyewa"
                      variant="filled"
                      required
                    />
                  )}
                />
              </Grid>
            ) : (
              <Grid size={12}>
                <Autocomplete
                  options={listDataIdentity || []}
                  getOptionLabel={(option) => option.full_name || ""}
                  value={
                    listDataIdentity.find((item) => item.id === identityID) ||
                    null
                  }
                  onChange={(event, newValue) => {
                    // console.log("newValue", newValue);
                    setIdentityID(newValue ? newValue.id : null);
                    setSelectedDataIdentity(newValue ?? "");
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Pilih Data Penyewa"
                      variant="filled"
                      required
                    />
                  )}
                />
              </Grid>
            )}
            {identityID && (
              <Grid
                container
                size={12}
                sx={{
                  mt: isMobile ? -2 : -1.2,
                }}
              >
                <Grid size={isMobile ? 12 : 6}>
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: theme.palette.primary.main,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                    onClick={() => setOpenViewInformationModal(true)}
                  >
                    Lihat Data Penyewa
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Grid size={isMobile ? 12 : 6}>
              <Autocomplete
                options={dataLocations || []}
                getOptionLabel={(option) =>
                  option.location_name
                    ? option.location_name.charAt(0).toUpperCase() +
                      option.location_name.slice(1)
                    : ""
                }
                value={
                  dataLocations
                    ? dataLocations.find((item) => item.id === locationId) ||
                      null
                    : null
                }
                onChange={(event, newValue) => {
                  const selectedLocationId = newValue ? newValue.id : "";

                  if (!selectedLocationId) {
                    setLocationId("");
                    setRoomId("");
                    setStartDate(null);
                    setEndDate(null);
                    setPaymentType("lunas");
                    setTotalPayment("");
                    setDownPayment("");
                    setRemainingPayment("");
                    setEstimatedInstallment1("");
                    setEstimatedInstallment2("");
                    setEstimatedInstallment3("");
                    setEstimatedInstallmentDate1(null);
                    setEstimatedInstallmentDate2(null);
                    setEstimatedInstallmentDate3(null);
                  } else {
                    setLocationId("");
                    setRoomId("");
                    setStartDate(null);
                    setEndDate(null);
                    setPaymentType("lunas");
                    setTotalPayment("");
                    setDownPayment("");
                    setRemainingPayment("");
                    setEstimatedInstallment1("");
                    setEstimatedInstallment2("");
                    setEstimatedInstallment3("");
                    setEstimatedInstallmentDate1(null);
                    setEstimatedInstallmentDate2(null);
                    setEstimatedInstallmentDate3(null);
                    setLocationId(selectedLocationId);
                    getRoomsData(selectedLocationId); // <-- load rooms sesuai lokasi
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Lokasi"
                    variant="filled"
                    required
                  />
                )}
              />
            </Grid>
            <Grid size={isMobile ? 12 : 6}>
              <Autocomplete
                options={dataAvailableRooms}
                getOptionLabel={(option) =>
                  "Ruangan No. " + option?.room_number || ""
                }
                value={
                  dataAvailableRooms.find((room) => room.id === roomId) || null
                }
                onChange={(event, newValue) => {
                  // console.log("newValue.id", newValue.id);

                  setRoomId(newValue ? newValue.id : "");
                  setSelectedDataRooms(newValue || {});
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Ruangan"
                    variant="filled"
                    required
                  />
                )}
                disabled={!locationId}
              />
            </Grid>

            {roomId && (
              <Grid container size={12}>
                {!isMobile && <Grid size={6}></Grid>}
                <Grid
                  size={isMobile ? 12 : 6}
                  sx={{
                    mt: isMobile ? -1.5 : -1,
                    mb: isMobile ? -2 : -1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: "bold",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: theme.palette.primary.main,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                    onClick={() => setOpenViewDetailRoomModal(true)}
                  >
                    Lihat Detail Ruangan
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Grid size={isMobile ? 12 : 6}>
              <FormControl
                fullWidth
                variant="filled"
                required
                disabled={!roomId}
              >
                <InputLabel id="demo-simple-select-filled-label">
                  Tipe Pembayaran
                </InputLabel>
                <Select
                  value={paymentType}
                  defaultValue={true}
                  onChange={(e) => {
                    setPaymentType(e.target.value);
                  }}
                >
                  <MenuItem value={"lunas"}>Lunas</MenuItem>
                  <MenuItem value={"cicilan"}>Cicilan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {paymentType === "cicilan" && (
              <Grid size={isMobile ? 12 : 6}>
                <FormControl
                  fullWidth
                  variant="filled"
                  required
                  disabled={!paymentType}
                >
                  <InputLabel id="demo-simple-select-filled-label">
                    Pilih Tenor Pembayaran
                  </InputLabel>
                  <Select
                    value={chooseTenor}
                    defaultValue={true}
                    onChange={(e) => {
                      setChooseTenor(e.target.value);
                    }}
                  >
                    <MenuItem value={1}>Menyicil 1x</MenuItem>
                    <MenuItem value={2}>Menyicil 2x</MenuItem>
                    <MenuItem value={3}>Menyicil 3x</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={isMobile ? 12 : 6}>
              <TextField
                label="Total Pembayaran"
                variant="filled"
                fullWidth
                value={formatRupiah(totalPayment)}
                onChange={(e) => {
                  setTotalPayment(e.target.value.replace(/[^0-9]/g, ""));
                }}
                required
                disabled
                color="primary"
              />
            </Grid>
            {paymentType === "cicilan" && (
              <>
                <Grid size={6}>
                  <TextField
                    label="Uang Muka (DP)"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(downPayment)}
                    onChange={(e) => {
                      setDownPayment(e.target.value.replace(/[^0-9]/g, ""));
                    }}
                    required
                    color="primary"
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Sisa Tagihan"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(remainingPayment)}
                    disabled
                    required
                    color="primary"
                  />
                </Grid>
                <Grid
                  size={isMobile ? 12 : 6}
                  sx={{
                    p: 1,
                    bgcolor:
                      themeMode === "dark"
                        ? alpha(theme.palette.primary.main, 0.12)
                        : alpha(theme.palette.primary.main, 0.12),
                    borderRadius: 1,
                    alignContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "primary.main",
                      textAlign: "justify",
                    }}
                  >
                    DP minimal 40% ({formatRupiah(totalPayment * 0.4)}) dari
                    total pembayaran {formatRupiah(totalPayment)}.
                  </Typography>
                </Grid>
                {/* {isMobile ? undefined : <Grid size={6}></Grid>} */}

                {installments.slice(0, chooseTenor).map((item, index) => (
                  <React.Fragment key={index}>
                    <Grid size={6}>
                      <TextField
                        label={item.label}
                        variant="filled"
                        fullWidth
                        disabled
                        value={formatRupiah(item.amount)}
                        onChange={(e) => {
                          item.setAmount(e.target.value.replace(/[^0-9]/g, ""));
                        }}
                        required
                        color="primary"
                      />
                    </Grid>

                    <Grid size={6}>
                      <DatePicker
                        label={`Tanggal ${item.label}`}
                        value={item.date}
                        onChange={(newValue) => item.setDate(newValue)}
                        views={["year", "month"]}
                        // minDate={moment()}
                        slotProps={{
                          textField: {
                            variant: "filled",
                            fullWidth: true,
                            required: true,
                            disabled: loading,
                            color: "primary",
                          },
                        }}
                      />
                    </Grid>
                  </React.Fragment>
                ))}
              </>
            )}
            {totalPayment > 0 && (
              <Grid
                size={12}
                sx={{
                  mt: isMobile ? -1.5 : -1,
                  mb: isMobile ? -2 : -1,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                    color: theme.palette.primary.main,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                  onClick={() => setOpenViewDetailCalculatePPNModal(true)}
                >
                  Lihat detail perhitungan biaya dan PPN
                </Typography>
              </Grid>
            )}

            <Grid size={isMobile ? 12 : 6}>
              <DatePicker
                label="Tanggal Mulai Kontrak"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  // console.log("startdate", newValue);

                  // if (newValue) {
                  //   // Tambahkan 365 hari ke tanggal mulai
                  //   const end = moment(newValue).add(365, "days");

                  //   setEndDate(end);
                  // } else {
                  //   setEndDate(null);
                  // }
                }}
                // minDate={moment()}
                disabled={tenantType === "perpanjang_tenant"}
                slotProps={{
                  textField: {
                    variant: "filled",
                    fullWidth: true,
                    required: true,
                    disabled: tenantType === "perpanjang_tenant",
                    color: "primary",
                  },
                }}
              />
            </Grid>
            <Grid size={isMobile ? 12 : 6}>
              <DatePicker
                label="Tanggal Berakhir Kontrak"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                }}
                // minDate={moment()}
                // disabled
                slotProps={{
                  textField: {
                    variant: "filled",
                    fullWidth: true,
                    required: true,
                    color: "primary",
                    // disabled: true,
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Durasi Kontrak (hari)"
                variant="filled"
                fullWidth
                value={`${durasiKontrak} hari`}
                // onChange={(e) => {
                // }}
                disabled
                required
                color="primary"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                label="Nomor Dokumen"
                // placeholder="Cth: 001"
                variant="filled"
                fullWidth
                value={documentNumber}
                onChange={(e) => {
                  // document number hanya boleh angka
                  setDocumentNumber(e.target.value.replace(/[^0-9]/g, ""));
                }}
                InputProps={{
                  endAdornment: getPrefix(),
                }}
                required
                color="primary"
              />
            </Grid>
            {highestDocumentNumber && (
              <Grid
                size={12}
                sx={{
                  p: 1,
                  bgcolor:
                    themeMode === "dark"
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.12),
                  borderRadius: 1,
                  // mt: -1,
                  mb: -1,
                  display: "flex",
                  flexDirection: "row",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "primary.main",
                  }}
                >
                  Nomor Dokumen terakhir adalah{" "}
                  {highestDocumentNumber?.highest_document_number
                    .split("/")[0]
                    .trim() || "-"}
                </Typography>
              </Grid>
            )}

            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                }}
                disabled={isSubmitting}
                startIcon={
                  isSubmitting && <CircularProgress size={22} color="inherit" />
                }
              >
                {isSubmitting ? "Mengirim..." : "Submit Data"}
              </Button>
            </Grid>
          </Grid>
        </form>
        <DetailRoomsModal
          open={openViewDetailRoomModal}
          onClose={() => setOpenViewDetailRoomModal(false)}
          loading={loading}
          loadingFalse={loadingFalse}
          loadingTrue={loadingTrue}
          setLoadingMessage={setLoadingMessage}
          selectedDataRooms={selectedDataRooms}
        />
        <ViewCalcPPNModal
          open={openViewDetailCalculatePPNModal}
          onClose={() => setOpenViewDetailCalculatePPNModal(false)}
          loading={loading}
          loadingFalse={loadingFalse}
          loadingTrue={loadingTrue}
          setLoadingMessage={setLoadingMessage}
          totalPayment={totalPayment}
          downPayment={downPayment}
          estimatedInstallment1={estimatedInstallment1}
          estimatedInstallment2={estimatedInstallment2}
          estimatedInstallment3={estimatedInstallment3}
          remainingPayment={remainingPayment}
          paymentType={paymentType}
          totalSewaKontrakRuangan={totalSewaKontrakRuangan}
          totalPPN={totalPPN}
          estimatedInstallmentDate1={estimatedInstallmentDate1}
          estimatedInstallmentDate2={estimatedInstallmentDate2}
          estimatedInstallmentDate3={estimatedInstallmentDate3}
          biayaAdministrasi={biayaAdministrasi}
          totalPPNDownPayment={totalPPNDownPayment}
          totalSewaKontrakDownPayment={totalSewaKontrakDownPayment}
          totalPaymentDownPayment={totalPaymentDownPayment}
          totalInstallment={totalInstallment}
          chooseTenor={chooseTenor}
        />
        <InformationPreviewModal
          open={openViewInformationModal}
          onClose={() => setOpenViewInformationModal(false)}
          selectedData={selectedDataIdentity}
        />
        {/* Modal Preview Gambar */}
        <ImagePreviewModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          imageUrl={ktpFilePath}
          alt="Preview KTP"
        />
      </Box>
    </Modal>
  );
};

export default AddTenantApplication;
