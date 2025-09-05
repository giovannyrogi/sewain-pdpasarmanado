import {
  Box,
  Button,
  CircularProgress,
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
import { Icon } from "@iconify/react";
import axios from "axios";

const EditRoom = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  onNotify,
  selectedData,
  getRoomsData,
  getLocationsData,
  dataLocations,
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
  };

  const [locationId, setLocationId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState("");
  const [roomLength, setRoomLength] = useState("");
  const [roomWidth, setRoomWidth] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (open) {
      setLocationId(selectedData.location_id);
      setRoomNumber(selectedData.room_number);
      setFloor(selectedData.floor);
      setRoomLength(selectedData.room_length);
      setRoomWidth(selectedData.room_width);
      setIsAvailable(selectedData.is_available);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    try {
      const response = await axios.put(`/api/rooms/${selectedData.id}`, {
        location_id: locationId,
        room_number: roomNumber,
        floor: floor,
        room_length: roomLength,
        room_width: roomWidth,
        is_available: isAvailable,
      });

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Ruangan berhasil ditambahkan!",
            severity: "success",
          });
        setTimeout(() => {
          getRoomsData();
          getLocationsData();
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal menambah Ruangan.",
            severity: "error",
          });
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error.response.data.message ||
            "Terjadi error saat menambah Ruangan.",
          severity: "error",
        });
    }
    setTimeout(() => {
      loadingFalse();
    }, 1000);
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
            Form Edit Ruangan
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
                        {item.location_name.charAt(0).toUpperCase() +
                          item.location_name.slice(1)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Nomor Ruangan"
                variant="filled"
                fullWidth
                value={roomNumber}
                onChange={(e) =>
                  setRoomNumber(e.target.value.replace(/\s/g, ""))
                }
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Lantai"
                placeholder="Hanya isi angka"
                variant="filled"
                fullWidth
                value={floor}
                onChange={(e) =>
                  setFloor(e.target.value.replace(/[^0-9]/g, ""))
                }
                autoFocus
                required
                disabled={loading}
                color="primary"
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
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Status
                </InputLabel>
                <Select
                  value={isAvailable}
                  defaultValue={true}
                  onChange={(e) => {
                    setIsAvailable(e.target.value);
                  }}
                >
                  <MenuItem value={true}>Tidak Tersedia</MenuItem>
                  <MenuItem value={false}>Tersedia</MenuItem>
                </Select>
              </FormControl>
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
      </Box>
    </Modal>
  );
};

export default EditRoom;
