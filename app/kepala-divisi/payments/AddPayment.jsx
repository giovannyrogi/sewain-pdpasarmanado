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
import axios from "axios";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import DetailTenantApplicationModal from "@/app/components/tenantapplicationmodal/DetailTenantApplicationModal";
import { calculateContractAndPPN } from "@/app/components/calc-contract-and-ppn/CaclContractAndPPN";

const AddPayment = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataPayments,
  onNotify,
  setLoadingMessage,
  user,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const { themeMode } = useThemeMode();
  const theme = useTheme();
  const style = {
    width: isMobile ? "90vw" : 400,
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

  const [selectedTenantApplicationId, setSelectedTenantApplicationId] =
    useState(null);
  const [dataTenantApplication, setDataTenantApplication] = useState([]);
  const [paymentNumber, setPaymentNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [proofFilePath, setProofFilePath] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [openPreview, setOpenPreview] = useState(false);
  const [typePembayaran, setTypePembayaran] = useState("lunas");
  const [paymentDate, setPaymentDate] = useState(null);
  const [openDetailTenant, setOpenDetailTenant] = useState(false);
  const [selectedData, setSelectedData] = useState("");
  const [minPayment, setMinPayment] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const getDataTenantApplication = async () => {
    loadingTrue();
    try {
      const response = await axios.get(
        "/api/tenant-application/tenant-payment"
      );

      console.log("data tenant", response);

      if (response.data.success) {
        setDataTenantApplication(response.data.data);

        setTimeout(() => {
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      loadingFalse();
    }
  };

  useEffect(() => {
    if (open) {
      getDataTenantApplication();
    }
  }, [open]);

  useEffect(() => {
    if (paymentNumber > 3) {
      setMinPayment(remainingBalance);
    } else {
      const calcMinPayment = Number(remainingBalance) * 0.2;
      setMinPayment(calcMinPayment);
    }
  }, [amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    // Hitung nilai kontrak, PPN, dan total sesuai tipe pembayaran
    const { contractAmount, ppnAmount, total } = calculateContractAndPPN(
      selectedData?.payment_type,
      amount,
      selectedData?.total_payment_room
    );

    let remainingBalanceAfterInstallment = 0;

    // console.log("contractAmount", contractAmount);
    // console.log("PPNAmount", ppnAmount);
    // console.log("total", total);
    // console.log("remainingBalance", remainingBalance);
    // console.log(
    //   "remainingBalanceAfterInstallment",
    //   remainingBalanceAfterInstallment
    // );

    // console.log("amount", amount);
    // console.log("remainingBalance", remainingBalance);

    const dp = Number(selectedData?.down_payment) || 0;

    if (amount < dp && paymentNumber === 1) {
      onNotify &&
        onNotify({
          open: true,
          message: `Total pembayaran tidak boleh dibawah Uang Muka(DP), yaitu sebesar ${formatRupiah(
            dp
          )}.`,
          severity: "error",
        });
      loadingFalse();
      return;
    }

    // jika amount dibawah 20% dari total remainingBalance maka tampilkan pesan error
    if (amount < remainingBalance * 0.2) {
      onNotify &&
        onNotify({
          open: true,
          message: `Total pembayaran minimal ${formatRupiah(
            minPayment
          )} (20%) dari sisa tagihan ${formatRupiah(remainingBalance)}.`,
          severity: "error",
        });
      loadingFalse();
      return;
    }

    if (amount > remainingBalance && typePembayaran === "cicilan") {
      onNotify &&
        onNotify({
          open: true,
          message: `Total pembayaran tidak boleh melebihi sisa tagihan ${formatRupiah(
            remainingBalance
          )}.`,
          severity: "error",
        });
      loadingFalse();
      return;
    }

    if (!proofFile) {
      onNotify &&
        onNotify({
          open: true,
          message: "Silakan upload bukti pembayaran terlebih dahulu.",
          severity: "error",
        });
      loadingFalse();
      return;
    }

    const formData = new FormData();

    if (selectedData?.payment_type === "cicilan") {
      remainingBalanceAfterInstallment = remainingBalance - total;
      formData.append("contract_amount", contractAmount);
    }

    formData.append("tenant_application_id", selectedTenantApplicationId);
    formData.append("proof_file", proofFile);
    formData.append("type_pembayaran", typePembayaran);
    formData.append("payment_date", moment(paymentDate).format("YYYY-MM-DD"));
    formData.append("tenant_name", selectedData.tenant_name);
    formData.append("uploaded_by", user.id || null);
    formData.append("payment_number", paymentNumber);
    formData.append("ppn_amount", ppnAmount);
    formData.append("amount", amount);
    formData.append("remaining_balance", remainingBalanceAfterInstallment);
    formData.append("payment_type", typePembayaran);

    // cek formdata
    // for (const pair of formData.entries()) {
    //   console.log(pair[0] + ", " + pair[1]);
    // }

    try {
      const response = await axios.post("/api/payments", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("insert payment", response);

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message:
              response.data.message || "Bukti pembayaran berhasil ditambahkan!",
            severity: "success",
          });
        getDataPayments();
        setTimeout(() => {
          onClose();
          loadingFalse();
          clearForm();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message:
              response.data.message ||
              "Terjadi error saat menambah Bukti Pembayaran.",
            severity: "error",
          });
        setTimeout(() => {
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error.message || "Terjadi error saat menambah Bukti Pembayaran.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

  const clearForm = () => {
    setSelectedTenantApplicationId(null);
    setDataTenantApplication([]);
    setPaymentNumber("");
    setAmount("");
    setProofFilePath(null);
    setProofFile(null);
    setTypePembayaran("lunas");
    setPaymentDate(null);
    setMinPayment(0);
    setRemainingBalance(0);
    setSelectedData(null);
  };

  const handleBuktiBayarChange = (e) => {
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
      setProofFile(file);
      setProofFilePath(URL.createObjectURL(file));
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        // clearForm();
        onClose();
      }}
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
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Form Upload Bukti Pembayaran
          </Typography>
        </Box>

        <Divider
          sx={{
            borderColor: theme.palette.primary.main,
            mb: 2,
          }}
        />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              <Autocomplete
                options={dataTenantApplication}
                getOptionLabel={(option) =>
                  option.tenant_name +
                  " - " +
                  option.location_name +
                  " - " +
                  option.room_number
                }
                value={
                  dataTenantApplication.find(
                    (item) =>
                      item.tenant_application_id === selectedTenantApplicationId
                  ) || null
                }
                onChange={(event, newValue) => {
                  setSelectedTenantApplicationId(
                    newValue ? newValue?.tenant_application_id : null
                  );

                  console.log("newvalue", newValue?.remaining_payment);

                  if (newValue?.payment_type === "cicilan") {
                    setTypePembayaran("cicilan");
                  } else {
                    setTypePembayaran("lunas");
                  }

                  // console.log("newvalue", newValue);

                  if (newValue?.payment_type === "lunas") {
                    setAmount(Number(newValue?.total_payment));
                  } else {
                    if (
                      newValue?.payment_number === undefined ||
                      newValue?.payment_number === null
                    ) {
                      setPaymentNumber(1);
                      setAmount(Number(newValue?.down_payment));
                      setRemainingBalance(Number(newValue?.total_payment));
                    } else if (newValue?.payment_number === 1) {
                      setPaymentNumber(2);
                      setAmount(Number(newValue?.remaining_balance));
                      setRemainingBalance(Number(newValue?.remaining_balance));
                    } else if (newValue?.payment_number === 2) {
                      setPaymentNumber(3);
                      setAmount(Number(newValue?.remaining_balance));
                      setRemainingBalance(Number(newValue?.remaining_balance));
                    } else if (newValue?.payment_number >= 3) {
                      setPaymentNumber(4);
                      setAmount(Number(newValue?.remaining_balance));
                      setRemainingBalance(Number(newValue?.remaining_balance));
                    }
                  }

                  setSelectedData(newValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Penyewa"
                    variant="filled"
                    required
                  />
                )}
              />
            </Grid>
            {selectedData && (
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
                    onClick={() => setOpenDetailTenant(true)}
                  >
                    Lihat Detail Penyewa
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Grid
              size={12}
              sx={{
                mt:
                  selectedData && isMobile
                    ? -2
                    : selectedData && !isMobile
                    ? -1
                    : 0,
              }}
            >
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Tipe Pembayaran
                </InputLabel>
                <Select
                  value={typePembayaran}
                  defaultValue={typePembayaran}
                  onChange={(e) => {
                    setTypePembayaran(e.target.value);
                  }}
                  disabled
                >
                  <MenuItem value={"lunas"}>Lunas</MenuItem>
                  <MenuItem value={"cicilan"}>Cicilan</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {typePembayaran === "cicilan" && (
              <Grid size={12}>
                {" "}
                <FormControl fullWidth variant="filled" required>
                  <InputLabel id="demo-simple-select-filled-label">
                    Tahap Cicilan
                  </InputLabel>
                  <Select
                    value={paymentNumber}
                    defaultValue={paymentNumber}
                    onChange={(e) => {
                      setPaymentNumber(e.target.value);
                    }}
                    disabled
                  >
                    <MenuItem value={1}>Uang Muka(DP)</MenuItem>
                    <MenuItem value={2}>Cicilan 1</MenuItem>
                    <MenuItem value={3}>Cicilan 2</MenuItem>
                    <MenuItem value={4}>Cicilan 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={12}>
              <DatePicker
                label="Tanggal Pembayaran"
                value={paymentDate}
                onChange={(newValue) => setPaymentDate(newValue)}
                maxDate={moment()}
                slotProps={{
                  textField: {
                    variant: "filled",
                    fullWidth: true,
                    required: true,
                    color: "primary",
                  },
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Total Pembayaran"
                // placeholder=""
                variant="filled"
                fullWidth
                value={amount ? formatRupiah(amount) : ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, ""); // hanya ambil angka
                  setAmount(rawValue);
                }}
                autoFocus
                required
                disabled={
                  selectedData?.payment_number >= 3 ||
                  selectedData?.payment_type === "lunas"
                }
                color="primary"
              />
            </Grid>
            {selectedData && selectedData?.payment_type === "cicilan" && (
              <Grid
                container
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
                {!selectedData?.payment_number ? (
                  <Grid size={12}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      Pembayaran Uang Muka(DP) atas nama "
                      {selectedData?.tenant_name}" sesuai persetujuan awal
                      Adalah {formatRupiah(selectedData?.down_payment)}
                    </Typography>
                  </Grid>
                ) : selectedData?.payment_number >= 3 ? (
                  <Grid size={12}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    >
                      Pembayaran Cicilan terakhir sebesar{" "}
                      {formatRupiah(minPayment)}
                    </Typography>
                  </Grid>
                ) : (
                  <Grid size={12}>
                    <Typography
                      sx={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "primary.main",
                        textAlign: "justify",
                      }}
                    >
                      Minimal melakukan pembayaran sebesar{" "}
                      {formatRupiah(minPayment)} (20%) dari sisa pembayaran{" "}
                      {formatRupiah(remainingBalance)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
            <Grid
              size={12}
              sx={{
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 2,
                mt: 1,
              }}
            >
              {proofFilePath ? (
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
                    Lihat Bukti Pembayaran
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
                      onClick={() => setProofFilePath("")}
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
                    Upload Bukti Pembayaran
                  </Typography>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleBuktiBayarChange}
                    disabled={loading}
                  />
                </Button>
              )}
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  fontSize: 16,
                  textTransform: "none",
                }}
                disabled={loading}
                startIcon={
                  loading && <CircularProgress size={22} color="inherit" />
                }
              >
                {loading ? "Mengirim..." : "Submit Data"}
              </Button>
            </Grid>
          </Grid>
        </form>
        <DetailTenantApplicationModal
          open={openDetailTenant}
          onClose={() => setOpenDetailTenant(false)}
          selectedData={selectedData}
        />
        {/* Modal Preview Gambar */}
        <ImagePreviewModal
          open={openPreview}
          onClose={() => setOpenPreview(false)}
          imageUrl={proofFilePath}
          alt="preview-bukti-bayar"
        />
      </Box>
    </Modal>
  );
};

export default AddPayment;
