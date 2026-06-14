import {
  alpha,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import axios from "axios";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import dayjs from "dayjs";
import formatRupiah from "@/app/components/formatrupiah/page";
import { Icon } from "@iconify/react";
import ImagePreviewModal from "@/app/components/modals/ImagePreviewModal";
import DetailRoomsModal from "@/app/components/detailroomsmodal/page";
import PaymentCalculationDetailModal from "@/app/components/modals/PaymentCalculationDetailModal";
import TenantIdentityPreviewModal from "@/app/components/modals/TenantIdentityPreviewModal";
import { calculateAllPayments } from "@/app/utils/calculateAllPayments";
import { calculateLeaseEndDate } from "@/app/utils/calculateRoomRent";
import CrudFormModal from "@/app/components/crud/CrudFormModal";

const TenantApplicationEditForm = ({
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
  selectedData,
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  const { themeMode } = useThemeMode();
  const theme = useTheme();

  // console.log('selectedData', selectedData);

  const [ktpFilePath, setKtpFilePath] = useState("");
  const [ktpFile, setKtpFile] = useState(null);
  const [locationId, setLocationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentType, setPaymentType] = useState("lunas");
  const [totalPayment, setTotalPayment] = useState("");
  const [totalSewaKontrakRuangan, setTotalSewaKontrakRuangan] = useState("");
  const [annualRoomRent, setAnnualRoomRent] = useState(0);
  const [leaseDurationYears, setLeaseDurationYears] = useState(1);
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

  const [biayaAdministrasi, setBiayaAdministrasi] = useState(0);
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

  // Durasi sewa disimpan sebagai angka tahun agar edit kontrak lama/baru tetap
  // memakai rumus yang sama dengan form pembuatan permohonan.
  const handleLeaseDurationChange = (event) => {
    const value = Math.floor(Number(event.target.value));
    setLeaseDurationYears(value > 0 ? value : 1);
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

  const getListIdentities = async () => {
    // console.log("tenant_identity_id");

    loadingTrue();
    setLoadingMessage("Mengambil data penyewa...");
    try {
      const response = await axios.get(
        `/api/identity-list/${selectedData?.tenant_identity_id}`,
      );

      // console.log("response identity-list", response);
      if (response.data.success) {
        setListDataIdentity(response.data.data);
        setIdentityID(selectedData?.tenant_identity_id);
        setSelectedDataIdentity(response.data.data[0]);
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
      // console.log("selectedData", selectedData);

      let rooms = response.data.data || [];

      // Tambahkan room lama dari selectedData kalau belum ada di list
      if (selectedData?.room_id && selectedData?.location_id === locationId) {
        const exists = rooms.some((r) => r.id === selectedData.room_id);
        if (!exists) {
          rooms = [
            {
              id: selectedData.room_id,
              location_id: selectedData.location_id,
              location_name: selectedData.location_name,
              room_number: selectedData.room_number,
              room_length: selectedData.room_length,
              room_width: selectedData.room_width,
              room_area: selectedData.room_area,
              price_per_m2: selectedData.price_per_m2,
              price_type: selectedData.price_type,
              floor_id: selectedData.floor_id,
              floor: selectedData.floor,
              base_price: selectedData.base_price,
              is_available: false,
            },
            ...rooms,
          ];
        }
      }

      // console.log("rooms test", rooms);
      setBiayaAdministrasi(Number(selectedData?.admin_fee || 0));
      setDataAvailableRooms(rooms);

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

  // Setiap kali selectedData atau open berubah, update form
  useEffect(() => {
    if (open) {
      setLocationId(selectedData?.location_id || "");
      setRoomId(selectedData?.room_id || "");
      // setStartDate(
      //   selectedData?.start_date ? moment(selectedData?.start_date) : null
      // );
      // setEndDate(selectedData?.end_date ? moment(selectedData?.end_date) : null);
      setPaymentType(selectedData?.payment_type || "");
      setTotalPayment(selectedData?.total_payment || "");
      setDownPayment(selectedData?.down_payment || "");
      setRemainingPayment(selectedData?.remaining_payment || "");

      getRoomsData(selectedData?.location_id);
      handleViewDetailRooms(selectedData);
      setEstimatedInstallment1(selectedData?.estimated_installment_1 || "");
      setEstimatedInstallment2(selectedData?.estimated_installment_2 || "");
      setEstimatedInstallment3(selectedData?.estimated_installment_3 || "");
      setEstimatedInstallmentDate1(
        selectedData?.estimated_installment_1_date
          ? moment(selectedData?.estimated_installment_1_date)
          : null,
      );
      setEstimatedInstallmentDate2(
        selectedData?.estimated_installment_2_date
          ? moment(selectedData?.estimated_installment_2_date)
          : null,
      );
      setEstimatedInstallmentDate3(
        selectedData?.estimated_installment_3_date
          ? moment(selectedData?.estimated_installment_3_date)
          : null,
      );

      setChooseTenor(selectedData?.current_tenor || 1);
      setDocumentNumber(selectedData?.document_number?.split("/")[0] || "");
      setStartDate(
        selectedData?.start_date ? moment(selectedData?.start_date) : null,
      );
      setEndDate(
        selectedData?.end_date ? moment(selectedData?.end_date) : null,
      );
      setLeaseDurationYears(selectedData?.lease_duration_years || 1);
      setAnnualRoomRent(selectedData?.annual_room_rent || 0);
      setTenantType(selectedData?.application_type || "permohonan_baru");
      getListIdentities();
      getHighestDocumentNumber();
    }
  }, [open]);

  useEffect(() => {
    if (!selectedDataRooms) return;

    // JANGAN hitung kalau data belum lengkap
    if (!locationId || !selectedDataRooms) {
      setTotalSewaKontrakRuangan(0);
      setTotalPPN(0);
      setTotalPayment(0);
      return;
    }

    const result = calculateAllPayments({
      room: selectedDataRooms,
      leaseDurationYears,
      paymentType,
      downPayment,
      chooseTenor,
      adminFee: biayaAdministrasi,
    });

    // total utama
    setAnnualRoomRent(result.annualRoomRent);
    setTotalSewaKontrakRuangan(result.totalSewa);
    setTotalPPN(result.totalPPN);
    setTotalPayment(result.totalPayment);

    if (paymentType === "cicilan") {
      const dp = Number(downPayment || 0);

      // default DP kalau kosong
      if (!dp) {
        const defaultDP = Math.round(result.totalPayment * 0.4);
        setDownPayment(defaultDP);
        setRemainingPayment(result.totalPayment - defaultDP);
      } else {
        setRemainingPayment(result.remaining);
      }

      // cicilan
      setEstimatedInstallment1(result.installments[0] || "");
      setEstimatedInstallment2(result.installments[1] || "");
      setEstimatedInstallment3(result.installments[2] || "");

      setTotalInstallment(result.installments.reduce((a, b) => a + b, 0));

      // DP breakdown
      const dpValue = Number(downPayment || 0);
      const sewaDP = dpValue / 1.11;
      const ppnDP = sewaDP * 0.11;

      setTotalSewaKontrakDownPayment(sewaDP);
      setTotalPPNDownPayment(ppnDP);
      setTotalPaymentDownPayment(sewaDP + ppnDP);
    } else {
      setDownPayment("");
      setRemainingPayment("");
      setEstimatedInstallment1("");
      setEstimatedInstallment2("");
      setEstimatedInstallment3("");
      setTotalInstallment("");
    }
  }, [
    selectedDataRooms,
    leaseDurationYears,
    paymentType,
    downPayment,
    chooseTenor,
    biayaAdministrasi,
  ]);

  useEffect(() => {
    if (!startDate) {
      setEndDate(null);
      setDurasiKontrak(0);
      return;
    }

    const calculatedEndDate = calculateLeaseEndDate(
      moment(startDate).toDate(),
      leaseDurationYears,
    );

    setEndDate(calculatedEndDate ? moment(calculatedEndDate.toDate()) : null);
  }, [startDate, leaseDurationYears]);

  useEffect(() => {
    if (startDate && endDate) {
      const duration = endDate.diff(startDate, "days");
      setDurasiKontrak(duration + 1);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingMessage("Loading...");

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
      formData.append("annual_room_rent", annualRoomRent);
      formData.append("lease_duration_years", leaseDurationYears);
      formData.append("total_payment_room", totalSewaKontrakRuangan);
      formData.append("admin_fee", biayaAdministrasi);
      formData.append("total_ppn", totalPPN);
      formData.append("choose_tenor", chooseTenor);
      formData.append("document_number", finalDocNumber);
      formData.append("start_date", moment(startDate).format("YYYY-MM-DD"));
      formData.append("end_date", moment(endDate).format("YYYY-MM-DD"));
      formData.append("tenant_type", tenantType);

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

      // for (let pair of formData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      const response = await axios.put(
        `/api/tenant-application/${selectedData.tenant_application_id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

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

  const handleViewDetailRooms = (newValue) => {
    // console.log("newValue", newValue);
    setSelectedDataRooms(newValue);
  };

  const handleKtpChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB = 1024*1024 bytes
        onNotify &&
          onNotify({
            open: true,
            message:
              "Ukuran file maksimal 1MB. Silakan pilih file yang lebih kecil.",
            severity: "error",
          });
        // Reset input file agar user bisa pilih ulang
        e.target.value = "";
        return;
      }
      setKtpFile(file);
      setKtpFilePath(URL.createObjectURL(file));
    }
  };

  return (
    <CrudFormModal
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Ubah Permohonan Sewa"
      description="Perbarui data permohonan, pembayaran, dokumen, dan masa kontrak dengan tetap mengikuti alur approval yang berjalan."
      icon="solar:document-medicine-bold-duotone"
      width={680}
      loading={isSubmitting}
      loadingLabel="Menyimpan perubahan..."
      // hideFooter
      contentSx={{ p: { xs: 2, sm: 2.5 } }}
    >
      <Grid container spacing={isMobile ? 3 : 2}>
        <Grid size={12}>
          <Autocomplete
            options={listDataIdentity || []}
            getOptionLabel={(option) => option.full_name || ""}
            value={
              listDataIdentity.find((item) => item.id === identityID) || null
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
            disabled
          />
        </Grid>
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
                ? dataLocations.find((item) => item.id === locationId) || null
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
              } // <-- load rooms sesuai lokasi
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
            disabled={!locationId}
            options={dataAvailableRooms || []}
            getOptionLabel={(option) => option.room_number || ""}
            value={
              dataAvailableRooms.find((item) => item.id === roomId) || null
            }
            onChange={(event, newValue) => {
              setRoomId(newValue ? newValue.id : "");
              handleViewDetailRooms(newValue);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pilih Ruangan"
                variant="filled"
                required
              />
            )}
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

        {/* <Grid size={6}>
              <DatePicker
                label="Tanggal Mulai"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);
                  if (newValue) {
                    // Tambahkan 365 hari ke tanggal mulai
                    const end = moment(newValue).add(365, "days");

                    setEndDate(end);
                  } else {
                    setEndDate(null);
                  }
                }}
                minDate={dayjs()}
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
            <Grid size={6}>
              <DatePicker
                label="Tanggal Berakhir"
                value={endDate}
                disabled
                slotProps={{
                  textField: {
                    variant: "filled",
                    fullWidth: true,
                    required: true,
                    color: "primary",
                    disabled: true,
                  },
                }}
              />
            </Grid> */}

        <Grid size={isMobile ? 12 : 6}>
          <FormControl fullWidth variant="filled" required>
            <InputLabel id="demo-simple-select-filled-label">
              Tipe Pembayaran
            </InputLabel>
            <Select
              value={paymentType}
              defaultValue={true}
              onChange={(e) => {
                setPaymentType(e.target.value);
                if (e.target.value === "lunas") {
                  setDownPayment(selectedData?.down_payment || 0);
                }
              }}
            >
              <MenuItem value={"cicilan"}>Cicilan</MenuItem>
              <MenuItem value={"lunas"}>Lunas</MenuItem>
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
                label="Uang Muka"
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
                DP minimal 40% ({formatRupiah(totalPayment * 0.4)}) dari total
                pembayaran {formatRupiah(totalPayment)}.
              </Typography>
            </Grid>

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
        <Grid size={{ xs: 12, md: 4 }}>
          <DatePicker
            label="Mulai Kontrak"
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
            disabled={tenantType === "perpanjang_tenant" || totalPayment < 1}
            slotProps={{
              textField: {
                variant: "filled",
                fullWidth: true,
                required: true,
                disabled:
                  tenantType === "perpanjang_tenant" || totalPayment < 1,
                color: "primary",
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Durasi Sewa"
            value={leaseDurationYears}
            onChange={handleLeaseDurationChange}
            type="text"
            variant="filled"
            fullWidth
            required
            disabled={!startDate}
            slotProps={{
              htmlInput: {
                min: 1,
                step: 1,
              },
            }}
            helperText="Durasi sewa dalam tahun"
            //styling hypertext menghilangkan margin bawaaan jadi 0
            sx={{
              "& .MuiFormHelperText-root": {
                m: "8px 0 0 0",
                fontWeight: "600",
                color: "primary.main",
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DatePicker
            label="Kontrak Berakhir"
            value={endDate}
            // minDate={moment()}
            disabled
            slotProps={{
              textField: {
                variant: "filled",
                fullWidth: true,
                required: true,
                color: "primary",
                disabled: true,
              },
            }}
          />
        </Grid>
        <Grid size={12}>
          <TextField
            label="Durasi Kontrak"
            variant="filled"
            fullWidth
            value={`${leaseDurationYears} tahun (${durasiKontrak} hari)`}
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
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "primary.main",
                display: "flex",
                flexDirection: "row",
                gap: 1,
              }}
            >
              Nomor Dokumen terakhir adalah{" "}
              {highestDocumentNumber?.highest_document_number.split("/")[0] ||
                "-"}
            </Typography>
          </Grid>
        )}
      </Grid>
      <DetailRoomsModal
        open={openViewDetailRoomModal}
        onClose={() => setOpenViewDetailRoomModal(false)}
        loading={loading}
        loadingFalse={loadingFalse}
        loadingTrue={loadingTrue}
        setLoadingMessage={setLoadingMessage}
        selectedDataRooms={selectedDataRooms}
      />
      <PaymentCalculationDetailModal
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
        annualRoomRent={annualRoomRent}
        leaseDurationYears={leaseDurationYears}
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
      <TenantIdentityPreviewModal
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
    </CrudFormModal>
  );
};

export default TenantApplicationEditForm;
