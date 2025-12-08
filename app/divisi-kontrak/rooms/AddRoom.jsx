import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
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
import axios from "axios";
import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

const AddRoom = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getRoomsData,
  getLocationsData,
  dataLocations,
  onNotify,
  setLoadingMessage,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
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

  const [locationId, setLocationId] = useState("");
  const [floorId, setFloorId] = useState("");
  const [dataFloor, setDataFloor] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomArea, setRoomArea] = useState("");
  const [roomLength, setRoomLength] = useState("");
  const [roomWidth, setRoomWidth] = useState("");
  const [statusRoom, setStatusRoom] = useState("available");
  const [pricePerMeter, setPricePerMeter] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getFloorData = async (locationId) => {
    if (!locationId) {
      setDataFloor([]);
      return;
    }

    setLoadingMessage("Mengambil data Lantai...");

    loadingTrue();

    try {
      const response = await axios.get(
        `/api/location-floor-price/floor-by-location-id?location_id=${locationId}`
      );
      // console.log("data floor", response);

      setDataFloor(response.data.data);
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

  // Hitung luas otomatis ketika panjang atau lebar berubah
  useEffect(() => {
    const length = parseFloat(roomLength) || 0;
    const width = parseFloat(roomWidth) || 0;
    const area = length * width;
    setRoomArea(area > 0 ? area.toFixed(2) : ""); // 2 desimal
  }, [roomLength, roomWidth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/rooms", {
        location_id: locationId,
        room_number: roomNumber,
        floor_id: floorId,
        room_length: roomLength,
        room_width: roomWidth,
        status: statusRoom,
        price_per_m2: pricePerMeter,
        notes: notes || null,
      });

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Ruangan berhasil ditambahkan!",
            severity: "success",
          });
        getRoomsData();
        getLocationsData();
        setTimeout(() => {
          onClose();
          loadingFalse();
          setIsSubmitting(false);
          clearForm();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal menambah Ruangan.",
            severity: "error",
          });
        setTimeout(() => {
          loadingFalse();
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message: error.response.data.message || "Terjadi error saat menambah Ruangan.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const clearForm = () => {
    setLocationId("");
    setFloorId("");
    setRoomNumber("");
    setRoomArea("");
    setRoomLength("");
    setRoomWidth("");
    setStatusRoom("available");
    setPricePerMeter("");
    setNotes("");
    setDataFloor([]);
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
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Form Tambah Ruangan
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
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
                  getFloorData(selectedLocationId); // <-- load rooms sesuai lokasi
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
            <Grid size={12}>
              <Autocomplete
                disabled={!locationId}
                options={dataFloor || []}
                getOptionLabel={(option) =>
                  option.floor
                    // ? option.floor +
                    //   " " +
                    //   `(${formatRupiah(option.base_price)})`
                    // : ""
                }
                value={
                  dataFloor
                    ? dataFloor.find((item) => item.floor_id === floorId) ||
                      null
                    : null
                }
                onChange={(event, newValue) => {
                  setFloorId(newValue ? newValue.floor_id : "");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Pilih Lantai"
                    variant="filled"
                    required
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Nomor Ruangan"
                placeholder="Contoh : 21M"
                variant="filled"
                fullWidth
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
                // prefix = "No. "
                InputProps={{
                  startAdornment: (
                    <InputAdornment
                      position="start"
                      sx={{
                        whiteSpace: "nowrap",
                        fontSize: "14px",
                      }}
                      align="center"
                    >
                      No.
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Panjang (m)"
                placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={roomLength}
                onChange={(e) =>
                  setRoomLength(e.target.value.replace(/\s/g, ""))
                }
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Lebar (m)"
                placeholder="Cth: 13.00"
                variant="filled"
                fullWidth
                value={roomWidth}
                onChange={(e) =>
                  setRoomWidth(e.target.value.replace(/\s/g, ""))
                }
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Luas (m)"
                placeholder="Cth: 13.00"
                variant="filled"
                fullWidth
                value={roomArea}
                onChange={(e) => setRoomArea(e.target.value.replace(/\s/g, ""))}
                autoFocus
                disabled
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Harga Per Meter (Rp)"
                // placeholder=""
                variant="filled"
                fullWidth
                value={pricePerMeter ? formatRupiah(pricePerMeter) : ""}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, ""); // hanya ambil angka
                  setPricePerMeter(rawValue);
                }}
                autoFocus
                required
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Status
                </InputLabel>
                <Select
                  value={statusRoom}
                  defaultValue={statusRoom}
                  onChange={(e) => {
                    setStatusRoom(e.target.value);
                    if (e.target.value === "available" || "occupied") {
                      setNotes("");
                    }
                  }}
                >
                  <MenuItem value="available">Tersedia</MenuItem>
                  <MenuItem value="occupied">Sudah Terisi</MenuItem>
                  <MenuItem value="maintenance">
                    Ruangan Dalam Perbaikan
                  </MenuItem>
                  <MenuItem value="unavailable">Ruangan Tidak Layak</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(statusRoom === "maintenance" || statusRoom === "unavailable") && (
              <Grid size={12}>
                <TextField
                  label="Alasan Tidak Tersedia"
                  placeholder="Tuliskan alasan kenapa ruangan tidak tersedia..."
                  fullWidth
                  variant="filled"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 150))}
                  inputProps={{ maxLength: 150 }}
                  required
                />
                <Typography variant="caption" sx={{ float: "right", mt: 0.5 }}>
                  {notes.length}/150
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
      </Box>
    </Modal>
  );
};

export default AddRoom;
