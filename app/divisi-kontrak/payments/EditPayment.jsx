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
import axios from "axios";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import DetailTenantApplicationModal from "@/app/components/tenantapplicationmodal/DetailTenantApplicationModal";
import dayjs from "dayjs";

const EditPayment = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataPayments,
  onNotify,
  setLoadingMessage,
  selectedData,
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

  // const getDataTenantApplication = async () => {
  //   loadingTrue();
  //   try {
  //     const response = await axios.get(
  //       "/api/tenant-application/tenant-payment"
  //     );

  //     console.log("data tenant", response);

  //     if (response.data.success) {
  //       setDataTenantApplication(response.data.data);

  //       setTimeout(() => {
  //         loadingFalse();
  //       }, 1000);
  //     }
  //   } catch (error) {
  //     console.log("error", error);
  //     loadingFalse();
  //   }
  // };

  useEffect(() => {
    if (open) {
      setSelectedTenantApplicationId(selectedData.tenant_application_id);
      setProofFilePath(selectedData.proof_file_path);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

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
    formData.append("tenant_application_id", selectedTenantApplicationId);
    formData.append("amount", amount);
    formData.append("proof_file", proofFile);
    formData.append("type_pembayaran", typePembayaran);
    formData.append("payment_date", paymentDate);
    formData.append("tenant_name", selectedData.tenant_name);
    formData.append("uploaded_by", user.id || null);

    if (paymentNumber) {
      formData.append("payment_number", paymentNumber);
    }

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

export default EditPayment;
