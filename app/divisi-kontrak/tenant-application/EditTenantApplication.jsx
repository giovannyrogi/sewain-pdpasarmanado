import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Modal,
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
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import DetailRoomsModal from "@/app/components/detailroomsmodal/page";

const EditTenantApplication = ({
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

  const [ktpFilePath, setKtpFilePath] = useState("");
  const [ktpFile, setKtpFile] = useState(null);
  const [locationId, setLocationId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantNIK, setTenantNIK] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [roomId, setRoomId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [paymentType, setPaymentType] = useState("");
  const [totalPayment, setTotalPayment] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [remainingPayment, setRemainingPayment] = useState("");
  const [approvalStatus, setApprovalStatus] = useState("proses");
  const [openPreview, setOpenPreview] = useState(false);
  const [dataAvailableRooms, setDataAvailableRooms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openViewDetailRoomModal, setOpenViewDetailRoomModal] = useState(false);
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

  const getRoomsData = async (locationId) => {
    if (!locationId) {
      setDataAvailableRooms([]);
      return;
    }

    setLoadingMessage("Mengambil data ruangan...");
    loadingTrue();

    try {
      const response = await axios.get(
        `/api/rooms/available-rooms?location_id=${locationId}`
      );
      console.log("response rooms", response.data);
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
      setLocationId(selectedData.location_id || "");
      setRoomId(selectedData.room_id || "");
      setTenantName(selectedData.tenant_name || "");
      setTenantNIK(selectedData.tenant_nik || "");
      setTenantPhone(selectedData.tenant_phone || "");
      // setStartDate(
      //   selectedData.start_date ? moment(selectedData.start_date) : null
      // );
      // setEndDate(selectedData.end_date ? moment(selectedData.end_date) : null);
      setPaymentType(selectedData.payment_type || "");
      setTotalPayment(selectedData.total_payment || "");
      setDownPayment(selectedData.down_payment || "");
      setRemainingPayment(selectedData.remaining_payment || "");
      setApprovalStatus(selectedData.approval_status || "proses");
      setKtpFilePath(selectedData.ktp_file_path || "");

      getRoomsData(selectedData.location_id);
      handleViewDetailRooms(selectedData);
      setEstimatedInstallment1(selectedData.estimated_installment_1 || "");
      setEstimatedInstallment2(selectedData.estimated_installment_2 || "");
      setEstimatedInstallment3(selectedData.estimated_installment_3 || "");
      setEstimatedInstallmentDate1(
        selectedData.estimated_installment_1_date
          ? moment(selectedData.estimated_installment_1_date)
          : null
      );
      setEstimatedInstallmentDate2(
        selectedData.estimated_installment_2_date
          ? moment(selectedData.estimated_installment_2_date)
          : null
      );
      setEstimatedInstallmentDate3(
        selectedData.estimated_installment_3_date
          ? moment(selectedData.estimated_installment_3_date)
          : null
      );
    }
  }, [open]);

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

  // Sinkronisasi Sisa saat DP diubah manual
  useEffect(() => {
    if (paymentType === "cicilan") {
      const total = Number(totalPayment) || 0;
      const dp = Number(downPayment) || 0;
      setRemainingPayment(total - dp);
    }
  }, [downPayment, paymentType, totalPayment]);

  // Hitung cicilan otomatis saat remainingPayment berubah
  useEffect(() => {
    if (paymentType === "cicilan") {
      const sisa = Number(remainingPayment) || 0;
      const perCicilan = Math.floor(sisa / 3); // dibagi rata 3 cicilan
      setEstimatedInstallment1(perCicilan);
      setEstimatedInstallment2(perCicilan);
      setEstimatedInstallment3(sisa - perCicilan * 2);
    } else {
      setEstimatedInstallment1("");
      setEstimatedInstallment2("");
      setEstimatedInstallment3("");
    }
  }, [remainingPayment, paymentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const total = Number(totalPayment) || 0;
    const minDp = Math.round(total * 0.4);
    const dp = Number(downPayment) || 0;

    // Validasi KTP
    if (!ktpFile && !ktpFilePath) {
      onNotify &&
        onNotify({
          open: true,
          message: "Silakan upload gambar KTP terlebih dahulu.",
          severity: "error",
        });
      loadingFalse && loadingFalse();
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    if (paymentType === "cicilan" && dp < minDp) {
      onNotify &&
        onNotify({
          open: true,
          message: "DP minimal 40% dari total pembayaran.",
          severity: "error",
        });
      setIsSubmitting(false);
      return;
    }

    if (dp > total) {
      onNotify &&
        onNotify({
          open: true,
          message: "DP tidak boleh lebih besar dari total pembayaran.",
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
      const totalCicilan =
        (Number(estimatedInstallment1) || 0) +
        (Number(estimatedInstallment2) || 0) +
        (Number(estimatedInstallment3) || 0);

      if (totalCicilan > Number(remainingPayment)) {
        onNotify &&
          onNotify({
            open: true,
            message:
              "Total 3 cicilan tidak boleh lebih besar dari sisa pembayaran.",
            severity: "error",
          });
        setIsSubmitting(false);
        return;
      }

      if (totalCicilan < Number(remainingPayment)) {
        onNotify &&
          onNotify({
            open: true,
            message: "Total 3 cicilan harus sama dengan sisa pembayaran.",
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
      formData.append("tenant_name", tenantName);
      formData.append("tenant_nik", tenantNIK);
      formData.append("tenant_phone", tenantPhone);
      // formData.append(
      //   "start_date",
      //   startDate ? moment(startDate).format("YYYY-MM-DD") : ""
      // );
      // formData.append(
      //   "end_date",
      //   endDate ? moment(endDate).format("YYYY-MM-DD") : ""
      // );
      formData.append("payment_type", paymentType);
      formData.append("total_payment", totalPayment);
      formData.append("down_payment", downPayment);
      formData.append("remaining_payment", remainingPayment);
      formData.append("approval_status", approvalStatus);
      formData.append("user_id", user.id);
      formData.append("current_step", 1);
      
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
            moment(estimatedInstallmentDate1).format("YYYY-MM-DD")
          );
        }
        if (estimatedInstallmentDate2) {
          formData.append(
            "estimated_installment_date_2",
            moment(estimatedInstallmentDate2).format("YYYY-MM-DD")
          );
        }
        if (estimatedInstallmentDate3) {
          formData.append(
            "estimated_installment_date_3",
            moment(estimatedInstallmentDate3).format("YYYY-MM-DD")
          );
        }
      }

      // Cek file lama vs file baru
      if (ktpFile instanceof File) {
        // User upload file baru
        formData.append("ktp_file", ktpFile);
      } else if (ktpFilePath) {
        // Tidak ada file baru, gunakan file lama (URL/relative path)
        formData.append("ktp_file_path", ktpFilePath);
      }

      // for (let pair of formData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      const response = await axios.put(
        `/api/tenant-application/${selectedData.tenant_application_id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("response", response);

      if (response?.data?.success) {
        onNotify &&
          onNotify({
            open: true,
            message:
              response?.data?.message || "Form Permohonan berhasil dibuat!",
            severity: "success",
          });
        setTimeout(() => {
          getDataTenantApplication();
          getLocationsData();
          getRoomsData();
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
            sx={{ fontWeight: "bold", fontSize: isMobile ? "18px" : "20px" }}
          >
            Form Ubah Permohonan Sewa Ruangan
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
              <TextField
                label="Nama Lengkap(sesuai KTP)"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="NIK"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={tenantNIK}
                onChange={(e) => {
                  // simpan hanya angka dan tidak ada spasi
                  setTenantNIK(e.target.value.replace(/[^0-9]/g, ""));
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="No HP"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={tenantPhone}
                onChange={(e) => {
                  // simpan hanya angka dan tidak ada spasi
                  setTenantPhone(e.target.value.replace(/[^0-9]/g, ""));
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid
              size={12}
              sx={{
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
              }}
            >
              {ktpFilePath ? (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 0.8,
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
                    onClick={() => setOpenPreview(true)}
                  >
                    Lihat KTP
                  </Typography>
                  <IconButton
                    size="small"
                    variant={themeMode === "dark" ? "outlined" : "contained"}
                    color="error"
                    sx={{ minWidth: 0, p: 0 }}
                  >
                    <Icon
                      icon="line-md:trash"
                      fontSize={18}
                      color="error"
                      onClick={() => setKtpFilePath("")}
                    />
                  </IconButton>
                </Box>
              ) : (
                <Button
                  variant="text"
                  component="label"
                  color="primary"
                  fullWidth
                  sx={{
                    textTransform: "none",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: "bold",
                  }}
                  disabled={loading}
                >
                  <Typography sx={{ fontWeight: "bold", fontSize: "12px" }}>
                    Upload KTP
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleKtpChange}
                    disabled={loading}
                  />
                </Button>
              )}
            </Grid>
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
                  setRoomId("");
                  setLocationId(selectedLocationId);
                  getRoomsData(selectedLocationId); // <-- load rooms sesuai lokasi
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
                  }}
                >
                  <MenuItem value={"cicilan"}>Cicilan</MenuItem>
                  <MenuItem value={"lunas"}>Lunas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
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
                    label="Sisa Pembayaran"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(remainingPayment)}
                    disabled
                    required
                    color="primary"
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Cicilan 1"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(estimatedInstallment1)}
                    onChange={(e) => {
                      setEstimatedInstallment1(
                        e.target.value.replace(/[^0-9]/g, "")
                      );
                    }}
                    required
                    color="primary"
                  />
                </Grid>
                <Grid size={6}>
                  <DatePicker
                    label="Bulan Cicilan 1"
                    // value harus dayjs, bukan string
                    value={estimatedInstallmentDate1}
                    onChange={(newValue) => {
                      // langsung simpan dayjs object
                      setEstimatedInstallmentDate1(newValue);
                    }}
                    views={["year", "month"]} // hanya bulan & tahun
                    minDate={dayjs()} // bulan sekarang ke atas
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
                  <TextField
                    label="Cicilan 2"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(estimatedInstallment2)}
                    onChange={(e) => {
                      setEstimatedInstallment2(
                        e.target.value.replace(/[^0-9]/g, "")
                      );
                    }}
                    required
                    color="primary"
                  />
                </Grid>
                <Grid size={6}>
                  <DatePicker
                    label="Bulan Cicilan 2"
                    // value harus dayjs, bukan string
                    value={estimatedInstallmentDate2}
                    onChange={(newValue) => {
                      // langsung simpan dayjs object
                      setEstimatedInstallmentDate2(newValue);
                    }}
                    views={["year", "month"]} // hanya bulan & tahun
                    minDate={dayjs()} // bulan sekarang ke atas
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
                  <TextField
                    label="Cicilan 3"
                    variant="filled"
                    fullWidth
                    value={formatRupiah(estimatedInstallment3)}
                    onChange={(e) => {
                      setEstimatedInstallment3(
                        e.target.value.replace(/[^0-9]/g, "")
                      );
                    }}
                    required
                    color="primary"
                  />
                </Grid>
                <Grid size={6}>
                  <DatePicker
                    label="Bulan Cicilan 3"
                    // value harus dayjs, bukan string
                    value={estimatedInstallmentDate3}
                    onChange={(newValue) => {
                      // langsung simpan dayjs object
                      setEstimatedInstallmentDate3(newValue);
                    }}
                    views={["year", "month"]} // hanya bulan & tahun
                    minDate={dayjs()} // bulan sekarang ke atas
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
              </>
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

export default EditTenantApplication;
