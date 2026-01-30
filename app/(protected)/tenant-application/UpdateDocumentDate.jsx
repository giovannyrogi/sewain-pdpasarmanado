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

const UpdateDocumentDate = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataTenantApplication,
  getLocationsData,
  onNotify,
  setLoadingMessage,
  selectedData,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  // console.log("selectedData", selectedData);

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

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [durasiKontrak, setDurasiKontrak] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [highestDocumentNumber, setHighestDocumentNumber] = useState(null);

  // console.log("selectedData", selectedData);

  const getHighestDocumentNumber = async () => {
    loadingTrue();
    try {
      const response = await axios.get(
        `/api/tenant-application/update-document`
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

  useEffect(() => {
    if (open) {
      getHighestDocumentNumber();
    }
    if (open && selectedData?.start_date && selectedData?.end_date) {
      setStartDate(moment(selectedData?.start_date));
      setEndDate(moment(selectedData?.end_date));
    }
  }, [open]);

  useEffect(() => {
    if (startDate && endDate) {
      const duration = endDate.diff(startDate, "days");
      setDurasiKontrak(duration + 1);
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    loadingTrue();

    // gabungkan nomor + prefix
    const now = new Date();
    const monthRoman = toRoman(now.getMonth() + 1);
    const year = now.getFullYear();
    const prefix = `/PM/${monthRoman}/${year}`;
    const finalDocNumber = `${documentNumber}${prefix}`;

    try {
      const response = await axios.put(
        `/api/tenant-application/update-document/${selectedData.tenant_application_id}`,
        {
          start_date: startDate,
          end_date: endDate,
          document_number: finalDocNumber,
        }
      );
      // console.log("response", response);

      if (response.data.success) {
        getDataTenantApplication();
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Berhasil mengupdate document",
            severity: "success",
          });
        setTimeout(() => {
          clearForm();
          onClose();
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      } else {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal mengupdate document",
            severity: "error",
          });
        setTimeout(() => {
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      onNotify &&
        onNotify({
          open: true,
          message: error.response.data.message || "Gagal mengupdate document",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const clearForm = () => {
    setStartDate(null);
    setEndDate(null);
    setDocumentNumber("");
    setHighestDocumentNumber(null);
  };

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

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        clearForm();
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
          <Typography
            sx={{ fontWeight: "bold", fontSize: isMobile ? "18px" : "20px" }}
          >
            Update Data Dokumen
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
            <Grid size={6}>
              <DatePicker
                label="Tanggal Mulai"
                value={startDate}
                onChange={(newValue) => {
                  setStartDate(newValue);

                  // if (newValue) {
                  //   // Tambahkan 365 hari ke tanggal mulai
                  //   const end = moment(newValue).add(365, "days");

                  //   setEndDate(end);
                  // } else {
                  //   setEndDate(null);
                  // }
                }}
                minDate={moment()}
                disabled={selectedData?.start_date}
                slotProps={{
                  textField: {
                    variant: "filled",
                    fullWidth: true,
                    required: true,
                    disabled: selectedData?.start_date,
                    color: "primary",
                  },
                }}
              />
            </Grid>
            <Grid size={6}>
              <DatePicker
                label="Tanggal Berakhir"
                value={endDate}
                onChange={(newValue) => {
                  setEndDate(newValue);
                }}
                minDate={moment()}
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
                size="small"
                sx={{
                  mt: 3,
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
      </Box>
    </Modal>
  );
};

export default UpdateDocumentDate;
