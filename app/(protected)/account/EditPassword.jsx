import {
  Autocomplete,
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

const EditPassword = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getUsersData,
  onNotify,
  selectedData,
  user,
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

  const [newPassword, setNewPassword] = useState("");
  const [comfirmNewPassword, setComfirmNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [showPassOldPassword, setShowPassOldPassword] = useState(false);
  const [showPassNewPassword, setShowPassNewPassword] = useState(false);
  const [showPassComfirmPassword, setShowPassComfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();

    try {
      const response = await axios.put(
        `/api/account/update-password/${selectedData.id}`,
        {
          oldPassword,
          newPassword,
          comfirmNewPassword,
        }
      );
      // console.log("response update password", response);
      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Password berhasil diubah!",
            severity: "success",
          });
        await getUsersData();
        setTimeout(() => {
          loadingFalse();
          onClose();
          clearForm();
        }, 1000);
      } else {
        // Notifikasi error
        onNotify &&
          onNotify({
            open: true,
            message: response?.data?.message || "Gagal mengubah Password.",
            severity: "error",
          });
      }
    } catch (error) {
      console.log("error", error);
      onNotify &&
        onNotify({
          open: true,
          message:
            error?.response?.data?.message ||
            "Terjadi error saat mengubah Password.",
          severity: "error",
        });
    }
    setTimeout(() => {
      loadingFalse();
    }, 1000);
  };

  const clearForm = () => {
    setOldPassword("");
    setNewPassword("");
    setComfirmNewPassword("");
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
            mb: 5,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Form Ubah Password
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              <TextField
                label="Password Lama"
                variant="filled"
                fullWidth
                type={showPassOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                disabled={loading}
                color="primary"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setShowPassOldPassword(!showPassOldPassword)
                        }
                        edge="end"
                        disabled={loading}
                      >
                        {showPassOldPassword ? (
                          <Icon
                            icon="line-md:watch-twotone-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        ) : (
                          <Icon
                            icon="line-md:watch-off-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Password Baru"
                variant="filled"
                fullWidth
                type={showPassNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                color="primary"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setShowPassNewPassword(!showPassNewPassword)
                        }
                        edge="end"
                        disabled={loading}
                      >
                        {showPassNewPassword ? (
                          <Icon
                            icon="line-md:watch-twotone-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        ) : (
                          <Icon
                            icon="line-md:watch-off-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Konfirmasi Password Baru"
                variant="filled"
                fullWidth
                type={showPassComfirmPassword ? "text" : "password"}
                value={comfirmNewPassword}
                onChange={(e) => setComfirmNewPassword(e.target.value)}
                required
                disabled={loading}
                color="primary"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() =>
                          setShowPassComfirmPassword(!showPassComfirmPassword)
                        }
                        edge="end"
                        disabled={loading}
                      >
                        {showPassComfirmPassword ? (
                          <Icon
                            icon="line-md:watch-twotone-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        ) : (
                          <Icon
                            icon="line-md:watch-off-loop"
                            style={{ color: theme.palette.primary.main }}
                            fontSize={25}
                          />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{
                  mt: 5,
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

export default EditPassword;
