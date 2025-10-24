import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

const EditFloorPrice = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getFloorData,
  getLocationsData,
  dataLocations,
  onNotify,
  selectedData,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");

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

  const [locationId, setLocationId] = useState("");
  const [floor, setFloor] = useState("");
  const [basePrice, setBasePrice] = useState(0);

  const getSelectedData = () => {
    setLocationId(selectedData.location_id);
    setFloor(selectedData.floor);
  };

  useEffect(() => {
    if (open) {
      getSelectedData();
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    // if (basePrice < 0) {
    //   onNotify &&
    //     onNotify({
    //       open: true,
    //       message: "Silakan isi total pembayaran terlebih dahulu.",
    //       severity: "error",
    //     });
    //   loadingFalse && loadingFalse();
    //   return;
    // }

    try {
      const response = await axios.put(
        `/api/location-floor-price/${selectedData.id}`,
        {
          location_id: locationId,
          floor: floor,
        }
      );

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Lantai berhasil ditambahkan!",
            severity: "success",
          });
        getFloorData();
        getLocationsData();
        setTimeout(() => {
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal menambah Lantai.",
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
          message: error.response.datamessage || "Terjadi error saat menambah Lantai.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
      }, 1000);
    }
  };

  // daftar lantai 1 - 10 contoh "Lt. 1"
  const floors = Array.from({ length: 10 }, (_, index) => `Lt. ${index + 1}`);

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
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Form Tambah Lantai
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Lokasi
                </InputLabel>
                <Select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                  }}
                >
                  {dataLocations &&
                    dataLocations.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.location_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Lantai
                </InputLabel>
                <Select
                  value={floor}
                  onChange={(e) => {
                    setFloor(e.target.value);
                    console.log(e.target.value);
                  }}
                >
                  {floors &&
                    floors.map((index) => (
                      <MenuItem key={index} value={index}>
                        {index}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            {/* <Grid size={12}>
              <TextField
                label="Harga Lantai"
                placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={formatRupiah(basePrice || 0)}
                onChange={(e) =>
                  setBasePrice(e.target.value.replace(/[^0-9]/g, ""))
                }
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid> */}
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
      </Box>
    </Modal>
  );
};

export default EditFloorPrice;
