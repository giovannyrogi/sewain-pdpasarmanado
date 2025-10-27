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
import InformationPreviewModal from "@/app/components/informationpreviewmodal/page";
import { Tag } from "antd";

const AddContract = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataContract,
  onNotify,
  selectedData,
  setLoadingMessage,
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

  const [documentNumber, setDocumentNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listAvailableTenant, setListAvailableTenant] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedTenantData, setSelectedTenantData] = useState(null);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);

  // console.log("selectedData", selectedData);

  const getListTenantFullyPaid = async () => {
    loadingTrue();
    try {
      const response = await axios.get(`/api/contracts/tenants-fully-paid`);
      console.log("response", response);

      if (response.data.success) {
        // mapping biar gampang dipakai di Autocomplete
        const mapped = response.data.data.map((item) => ({
          tenant_application_id: item.tenant_application.id,
          full_name: item.tenant_identities.full_name,
          nik: item.tenant_identities.nik,
          phone: item.tenant_identities.phone,
          ktp_file_path: item.tenant_identities.ktp_file_path,
          id: item.tenant_identities.id,
          birth_place: item.tenant_identities.birth_place,
          birth_date: item.tenant_identities.birth_date,
          occupation: item.tenant_identities.occupation,
          religion: item.tenant_identities.religion,
          nationality: item.tenant_identities.nationality,
          street_address: item.tenant_identities.street_address,
          rt: item.tenant_identities.rt,
          rw: item.tenant_identities.rw,
          kelurahan: item.tenant_identities.kelurahan,
          district: item.tenant_identities.district,
          city: item.tenant_identities.city,
          province: item.tenant_identities.province,
          location_code: item.locations.location_code,
          latest_contract_number: item.contracts.latest_contract_number,
          latest_contract_number_only:
            item.contracts.latest_contract_number_only,
          status: item.tenant_identities.status,
          notes: item.tenant_identities.notes,
        }));

        setListAvailableTenant(mapped);
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
      console.log("error", error);
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

  useEffect(() => {
    if (open) {
      setLoadingMessage("Loading...");
      getListTenantFullyPaid();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    loadingTrue();

    // gabungkan nomor + prefix
    const now = new Date();
    const monthRoman = toRoman(now.getMonth() + 1);
    const year = now.getFullYear();
    const prefix = `${" "}/ PM / SK / - ${
      selectedTenantData?.location_code
        ? selectedTenantData?.location_code
        : "-"
    } / ${monthRoman} / ${year}`;
    const finalContractNumber = `${documentNumber}${prefix}`;

    try {
      const response = await axios.post(`/api/contracts`, {
        tenant_application_id: selectedTenantId,
        contract_number: finalContractNumber,
      });
      console.log("response", response);

      if (response.data.success) {
        getDataContract();
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Berhasil Membuat Kontrak",
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
            message: response.data.message || "Gagal Membuat Kontrak",
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
          message: error.response.data.message || "Gagal Membuat kontrak",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const clearForm = () => {
    setDocumentNumber("");
    setSelectedTenantData(null);
    setSelectedTenantId(null);
    setListAvailableTenant([]);
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
            // letterSpacing: "1px",
          }}
        >{`/ PM / SK / - ${
          selectedTenantData?.location_code
            ? selectedTenantData?.location_code
            : "-"
        } / ${monthRoman} / ${year}`}</Typography>
      </InputAdornment>
    );
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
            Tambah Kontrak Baru
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
                options={listAvailableTenant || []}
                getOptionLabel={(option) => option.full_name || ""}
                value={
                  listAvailableTenant.find(
                    (item) => item.tenant_application_id === selectedTenantId
                  ) || null
                }
                onChange={(event, newValue) => {
                  // console.log("newValue", newValue);
                  if (!newValue) {
                    setSelectedTenantId(null);
                    setSelectedTenantData(null);
                    return;
                  }
                  setSelectedTenantId(
                    newValue ? newValue.tenant_application_id : null
                  );
                  setSelectedTenantData(newValue);
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
            {selectedTenantId && (
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
                    onClick={() => setOpenPreviewModal(true)}
                  >
                    Lihat Data Penyewa
                  </Typography>
                </Grid>
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                label="Nomor Kontrak"
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
            {selectedTenantData &&
            selectedTenantData?.latest_contract_number ? (
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
                  Nomor kontrak terakhir adalah{" "}
                  {selectedTenantData?.latest_contract_number
                    ? selectedTenantData?.latest_contract_number
                        .split("/")[0]
                        .trim()
                    : "-"}
                </Typography>
              </Grid>
            ) : undefined}
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="small"
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

        <InformationPreviewModal
          open={openPreviewModal}
          onClose={() => setOpenPreviewModal(false)}
          selectedData={selectedTenantData}
        />
      </Box>
    </Modal>
  );
};

export default AddContract;
