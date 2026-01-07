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

const EditPayment = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataPayments,
  onNotify,
  setLoadingMessage,
  selectedCurrentData,
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

  const [dataPenyewa, setDataPenyewa] = useState("");
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

  const getCurrentPaymentData = async () => {
    if (selectedCurrentData) {
      const FormattedData =
        selectedCurrentData?.tenant_application?.tenant_name +
        " - " +
        selectedCurrentData?.location?.location_name +
        " - " +
        selectedCurrentData?.room?.room_number;

      const parsedDate = selectedCurrentData?.payments?.payment_date
        ? moment(selectedCurrentData.payments.payment_date, "YYYY-MM-DD")
        : null;

      const currentPayment = Number(
        selectedCurrentData?.payments?.payment_amount || 0
      );

      const totalPaymentRoom =
        Number(selectedCurrentData?.tenant_application?.total_payment) || 0;

      const downPayment = Number(
        selectedCurrentData?.tenant_application?.down_payment || 0
      );

      const previousAmountDP =
        Number(selectedCurrentData?.payments?.previous_payments?.[0]?.amount) ||
        0;
      const previousAmountCicilan1 =
        Number(selectedCurrentData?.payments?.previous_payments?.[1]?.amount) ||
        0;
      const previousAmountCicilan2 =
        Number(selectedCurrentData?.payments?.previous_payments?.[2]?.amount) ||
        0;
      const previousAmountCicilan3 =
        Number(selectedCurrentData?.payments?.previous_payments?.[3]?.amount) ||
        0;

      let calcRemainingBalance = 0;

      if (selectedCurrentData?.tenant_application?.payment_type === "lunas") {
        setAmount(
          Number(selectedCurrentData?.tenant_application?.total_payment)
        );
      } else {
        if (selectedCurrentData?.payments?.payment_number === 1) {
          calcRemainingBalance = totalPaymentRoom - amount;

          setPaymentNumber(selectedCurrentData?.payments?.payment_number || 1);
          setAmount(Number(currentPayment || 0));
          setRemainingBalance(calcRemainingBalance);
        } else if (selectedCurrentData?.payments?.payment_number === 2) {
          calcRemainingBalance = totalPaymentRoom - amount - previousAmountDP;
          setPaymentNumber(selectedCurrentData?.payments?.payment_number || 2);
          setAmount(Number(currentPayment || 0));
          setRemainingBalance(Number(calcRemainingBalance || 0));
        } else if (selectedCurrentData?.payments?.payment_number === 3) {
          calcRemainingBalance =
            totalPaymentRoom -
            amount -
            previousAmountDP -
            previousAmountCicilan1;
          setPaymentNumber(selectedCurrentData?.payments?.payment_number || 3);
          setAmount(Number(currentPayment || 0));
          setRemainingBalance(Number(calcRemainingBalance || 0));
        } else if (selectedCurrentData?.payments?.payment_number >= 4) {
          calcRemainingBalance =
            totalPaymentRoom -
            amount -
            previousAmountDP -
            previousAmountCicilan1 -
            previousAmountCicilan2;
          setPaymentNumber(selectedCurrentData?.payments?.payment_number || 4);
          setAmount(Number(currentPayment || 0));
          setRemainingBalance(Number(calcRemainingBalance || 0));
        }
      }

      setSelectedData(selectedCurrentData);
      setDataPenyewa(FormattedData);
      setProofFilePath(`/api${selectedCurrentData?.payments?.proof_file_path}` || null);
      setProofFile(selectedCurrentData?.payments?.proof_file_path || null);
      setTypePembayaran(
        selectedCurrentData?.tenant_application?.payment_type || "lunas"
      );
      setPaymentDate(parsedDate);
    }
  };

  useEffect(() => {
    if (open) {
      getCurrentPaymentData();
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
      selectedData?.tenant_application?.payment_type,
      amount,
      selectedData?.tenant_application?.total_payment_room
    );

    let remainingBalanceAfterInstallment = 0;

    const dp = Number(selectedData?.tenant_application?.down_payment) || 0;

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

    // Jika payment_type = cicilan
    if (selectedData?.tenant_application?.payment_type === "cicilan") {
      formData.append("contract_amount", contractAmount);
      remainingBalanceAfterInstallment = remainingBalance - amount;
    }

    formData.append(
      "payment_approval_id",
      selectedCurrentData?.payment_approval?.id
    );
    formData.append("proof_file", proofFile);
    formData.append("type_pembayaran", typePembayaran);
    formData.append("payment_date", moment(paymentDate).format("YYYY-MM-DD"));
    formData.append(
      "tenant_name",
      selectedData?.tenant_application?.tenant_name
    );
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
      const response = await axios.put(
        `/api/payments/${selectedCurrentData?.payments?.payment_id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // console.log("update payment", response);

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
            Form Edit Bukti Pembayaran
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
              <TextField
                fullWidth
                variant="filled"
                label="Nama Penyewa"
                value={dataPenyewa || ""}
                disabled
              />
            </Grid>
            {/* {selectedData && (
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
            )} */}
            <Grid size={12}>
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
                  selectedData?.payments?.payment_number > 3 ||
                  selectedData?.tenant_application?.payment_type === "lunas"
                }
                color="primary"
              />
            </Grid>
            {selectedData &&
              selectedData?.tenant_application?.payment_type === "cicilan" && (
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
                  {selectedData?.payments?.payment_number === 1 ? (
                    <Grid size={12}>
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "primary.main",
                        }}
                      >
                        Pembayaran Uang Muka(DP) atas nama "
                        {selectedData?.tenant_application?.tenant_name}" sesuai
                        persetujuan awal Adalah{" "}
                        {formatRupiah(
                          selectedData?.tenant_application?.down_payment
                        )}
                      </Typography>
                    </Grid>
                  ) : selectedData?.payments?.payment_number  >= 4 ? (
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

export default EditPayment;
