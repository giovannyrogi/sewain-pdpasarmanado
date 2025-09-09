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
  user
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    // Validasi KTP
    if (!ktpFile) {
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

    if (!totalPayment || totalPayment === 0) {
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

    try {
      const formData = new FormData();
      formData.append("location_id", locationId);
      formData.append("room_id", roomId);
      formData.append("tenant_name", tenantName);
      formData.append("tenant_nik", tenantNIK);
      formData.append("tenant_phone", tenantPhone);
      formData.append(
        "start_date",
        startDate ? moment(startDate).format("YYYY-MM-DD") : ""
      );
      formData.append(
        "end_date",
        endDate ? moment(endDate).format("YYYY-MM-DD") : ""
      );
      formData.append("payment_type", paymentType);
      formData.append("total_payment", totalPayment);
      formData.append("down_payment", downPayment);
      formData.append("remaining_payment", remainingPayment);
      formData.append("approval_status", approvalStatus);
      formData.append("user_id", user.id);
      formData.append("current_step", 1);
      // formData.append("ktp_file_path", ktpFilePath);

      if (ktpFile) {
        formData.append("ktp_file", ktpFile);
      }

      // for (let pair of formData.entries()) {
      //   console.log(pair[0], pair[1]);
      // }

      const response = await axios.post("/api/tenant-application", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
    setTenantName("");
    setTenantNIK("");
    setTenantPhone("");
    setStartDate(null);
    setEndDate(null);
    setPaymentType("");
    setTotalPayment("");
    setDownPayment("");
    setRemainingPayment("");
    setKtpFile(null);
    setKtpFilePath(null);
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
                getOptionLabel={(option) =>
                  option.room_number
                    ? option.room_number.charAt(0).toUpperCase() +
                      option.room_number.slice(1)
                    : ""
                }
                value={
                  dataAvailableRooms
                    ? dataAvailableRooms.find((item) => item.id === roomId) ||
                      null
                    : null
                }
                onChange={(event, newValue) => {
                  setRoomId(newValue ? newValue.id : "");
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
            <Grid size={6}>
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
            </Grid>
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
