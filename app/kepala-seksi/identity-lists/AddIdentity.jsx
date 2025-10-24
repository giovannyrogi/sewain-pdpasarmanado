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
import ImagePreviewModal from "@/app/components/imagepreviewmodal/page";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import { Icon } from "@iconify/react";
import wilayah from "daftar-wilayah-indonesia";

const AddIdentity = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getDataIdentities,
  onNotify,
  setLoadingMessage,
}) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
  const { themeMode } = useThemeMode();

  const style = {
    width: isMobile ? "90vw" : 500,
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

  const [nomorIndukKependudukan, setNomorIndukKependudukan] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [ktpFilePath, setKtpFilePath] = useState("");
  const [ktpFile, setKtpFile] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState(null);
  const [agama, setAgama] = useState("");
  const [pekerjaan, setPekerjaan] = useState("");
  const [wargaNegara, setWargaNegara] = useState("WNI");
  const [phone, setPhone] = useState("");
  const [openPreview, setOpenPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [alamatJalan, setAlamatJalan] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [provinsi, setProvinsi] = useState("");
  const [kelurahan, setKelurahan] = useState("");
  const [kecamatan, setKecamatan] = useState("");
  const [kabupaten, setKabupaten] = useState("");

  // List options
  const [listProvinsi, setListProvinsi] = useState([]);
  const [listKabupaten, setListKabupaten] = useState([]);
  const [listKecamatan, setListKecamatan] = useState([]);
  const [listKelurahan, setListKelurahan] = useState([]);

  const [provinsiCode, setProvinsiCode] = useState("");
  const [kabupatenCode, setKabupatenCode] = useState("");
  const [kecamatanCode, setKecamatanCode] = useState("");
  const [kelurahanCode, setKelurahanCode] = useState("");

  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  /* panggil sekali untuk isi provinsi saat mount */
  useEffect(() => {
    if (open) {
      setListProvinsi(wilayah.provinsi);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    loadingTrue();
    setIsSubmitting(true);

    if (!ktpFile) {
      onNotify &&
        onNotify({
          open: true,
          message: "Silakan upload foto KTP terlebih dahulu.",
          severity: "error",
        });
      loadingFalse();
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("nomorIndukKependudukan", nomorIndukKependudukan);
    formData.append("namaLengkap", namaLengkap);
    formData.append("ktpFile", ktpFile);
    formData.append("tempatLahir", tempatLahir);
    formData.append("tanggalLahir", tanggalLahir);
    formData.append("agama", agama);
    formData.append("pekerjaan", pekerjaan);
    formData.append("wargaNegara", wargaNegara);
    formData.append("phone", phone);
    formData.append("alamatJalan", alamatJalan);
    formData.append("rt", rt);
    formData.append("rw", rw);
    formData.append("provinsi", provinsi);
    formData.append("kabupaten", kabupaten);
    formData.append("kecamatan", kecamatan);
    formData.append("kelurahan", kelurahan);
    formData.append("status", status);
    formData.append("notes", notes);

    // log formdata
    // for (let pair of formData.entries()) {
    //   console.log(pair[0] + ", " + pair[1]);
    // }

    try {
      const response = await axios.post("/api/identity-list", formData);

      if (response.data.success) {
        // Notifikasi sukses
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Data berhasil ditambahkan!",
            severity: "success",
          });
        getDataIdentities();
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
            message: response.data.message || "Gagal menambah data.",
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
          message:
            error.response.data.message || "Terjadi error saat menambah Data.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
        setIsSubmitting(false);
      }, 1000);
    }
  };

  /* Handler saat provinsi dipilih */
  const handleProvinsiChange = (newValue) => {
    const kodeProv = newValue?.kode || "";
    setProvinsiCode(kodeProv);
    setProvinsi(newValue?.nama || "");
    setKabupatenCode("");
    setKecamatanCode("");
    setKelurahanCode("");
    setListKabupaten([]);
    setListKecamatan([]);
    setListKelurahan([]);

    if (!kodeProv) return;

    // ambil kabupaten yang sesuai kode_provinsi
    const allKab = wilayah.kabupaten(kodeProv);
    console.log("kabupaten", allKab);

    setListKabupaten(allKab);
  };

  /* Handler saat kecamatan dipilih */
  const handleKabupatenChange = (newValue) => {
    const kodeKab = newValue?.kode || "";
    setKabupatenCode(kodeKab);
    setKabupaten(newValue?.nama || "");
    setKecamatanCode("");
    setKelurahanCode("");
    setListKecamatan([]);
    setListKelurahan([]);

    // ambil kecamatan yang sesuai kode_kabupaten
    const allKec = wilayah.kecamatan(kodeKab);
    console.log("kecamatan", allKec);

    setListKecamatan(allKec);
  };

  /* Handler saat Kecamatan dipilih */
  const handleKecamatanChange = (newValue) => {
    const kodeKec = newValue?.kode || "";
    setKecamatanCode(kodeKec);
    setKecamatan(newValue?.nama || "");
    setKelurahanCode("");
    setListKelurahan([]);

    // ambil kecamatan yang sesuai kode_kabupaten
    const allKel = wilayah.desa(kodeKec);
    console.log("kelurahan", allKel);

    setListKelurahan(allKel);
  };

  /* Handler saat kelurahan dipilih */
  const handleKelurahanChange = (newValue) => {
    const kodeKel = newValue?.kode || "";
    setKelurahanCode(kodeKel);
    setKelurahan(newValue?.nama || "");
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

  const clearForm = () => {
    setProvinsiCode("");
    setProvinsi("");
    setKabupatenCode("");
    setKabupaten("");
    setKecamatanCode("");
    setKecamatan("");
    setKelurahanCode("");
    setKelurahan("");
    setKtpFile(null);
    setKtpFilePath("");
    setStatus("active");
    setTempatLahir("");
    setTanggalLahir(null);
    setNotes("");
    setNamaLengkap("");
    setNomorIndukKependudukan("");
    setAgama("");
    setPekerjaan("");
    setAlamatJalan("");
    setRt("");
    setRw("");
    setPhone("");
    setWargaNegara("WNI");
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
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            Form Pendaftaran Identitas
          </Typography>
        </Box>

        <Divider
          sx={{
            borderColor: theme.palette.primary.main,
            mb: 2,
          }}
        />

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={6}>
              <TextField
                label="Nama Lengkap(sesuai KTP)"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
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
                value={nomorIndukKependudukan}
                onChange={(e) => {
                  // simpan hanya angka dan tidak ada spasi
                  setNomorIndukKependudukan(
                    e.target.value.replace(/[^0-9]/g, "")
                  );
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Tempat Lahir"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={tempatLahir}
                onChange={(e) => {
                  setTempatLahir(e.target.value);
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <DatePicker
                label="Tanggal Lahir"
                // value harus dayjs, bukan string
                value={tanggalLahir}
                onChange={(newValue) => {
                  // langsung simpan dayjs object
                  setTanggalLahir(newValue);
                }}
                // minDate={dayjs()} // bulan sekarang ke atas
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
            <Grid size={6}>
              <TextField
                label="Agama"
                variant="filled"
                fullWidth
                value={agama}
                onChange={(e) => {
                  setAgama(e.target.value);
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Pekerjaan"
                variant="filled"
                fullWidth
                value={pekerjaan}
                onChange={(e) => {
                  setPekerjaan(e.target.value);
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={6}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="warga-negara">Kewarganegaraan</InputLabel>
                <Select
                  value={wargaNegara}
                  onChange={(e) => {
                    setWargaNegara(e.target.value);
                  }}
                >
                  <MenuItem value={"WNI"}>WNI</MenuItem>
                  <MenuItem value={"WNA"}>WNA</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <TextField
                label="No HP"
                // placeholder="Cth: 2.86"
                variant="filled"
                fullWidth
                value={phone}
                onChange={(e) => {
                  // simpan hanya angka dan tidak ada spasi
                  setPhone(e.target.value.replace(/[^0-9]/g, ""));
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
            <Grid size={6}>
              <Autocomplete
                options={listProvinsi}
                getOptionLabel={(option) => option.nama || ""}
                value={
                  listProvinsi.find((item) => item.kode === provinsiCode) ||
                  null
                }
                onChange={(event, newValue) => {
                  handleProvinsiChange(newValue);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.kode === value.kode
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Provinsi"
                    variant="filled"
                    required
                  />
                )}
              />
            </Grid>

            <Grid size={6}>
              <Autocomplete
                options={listKabupaten}
                getOptionLabel={(option) => option.nama || ""}
                value={
                  listKabupaten.find((item) => item.kode === kabupatenCode) ||
                  null
                }
                onChange={(event, newValue) => {
                  handleKabupatenChange(newValue);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.kode === value.kode
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kabupaten/Kota"
                    variant="filled"
                    required
                  />
                )}
                disabled={!provinsiCode}
              />
            </Grid>

            <Grid size={6}>
              <Autocomplete
                options={listKecamatan}
                getOptionLabel={(option) => option.nama || ""}
                value={
                  listKecamatan.find((item) => item.kode === kecamatanCode) ||
                  null
                }
                onChange={(event, newValue) => {
                  handleKecamatanChange(newValue);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.kode === value.kode
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kecamatan"
                    variant="filled"
                    required
                  />
                )}
                disabled={!kabupatenCode}
              />
            </Grid>

            <Grid size={6}>
              <Autocomplete
                options={listKelurahan}
                getOptionLabel={(option) => option.nama || ""}
                value={
                  listKelurahan.find((item) => item.kode === kelurahanCode) ||
                  null
                }
                onChange={(event, newValue) => {
                  handleKelurahanChange(newValue);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.kode === value.kode
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Kelurahan/Desa"
                    variant="filled"
                    required
                  />
                )}
                disabled={!kecamatanCode}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                label="Nama Jalan"
                placeholder="Jl. XXXX"
                variant="filled"
                fullWidth
                value={alamatJalan}
                onChange={(e) => {
                  setAlamatJalan(e.target.value);
                }}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid container size={6} spacing={1}>
              <Grid size={6}>
                <TextField
                  label="RT"
                  placeholder="000"
                  variant="filled"
                  fullWidth
                  value={rt}
                  onChange={(e) => {
                    setRt(e.target.value.replace(/[^0-9]/g, ""));
                  }}
                  autoFocus
                  required
                  disabled={loading}
                  color="primary"
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  label="RW"
                  placeholder="000"
                  variant="filled"
                  fullWidth
                  value={rw}
                  onChange={(e) => {
                    setRw(e.target.value.replace(/[^0-9]/g, ""));
                  }}
                  autoFocus
                  required
                  disabled={loading}
                  color="primary"
                />
              </Grid>
            </Grid>

            <Grid size={12}>
              {" "}
              <FormControl fullWidth variant="filled" required>
                <InputLabel id="demo-simple-select-filled-label">
                  Pilih Status
                </InputLabel>
                <Select
                  value={status}
                  defaultValue={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    if (e.target.value === "active" || "inactive") {
                      setNotes("");
                    }
                  }}
                >
                  <MenuItem value="active">Aktif</MenuItem>
                  <MenuItem value="inactive">Tidak Aktif</MenuItem>
                  <MenuItem value="blacklisted">Blacklist</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {status === "blacklisted" && (
              <Grid size={12}>
                <TextField
                  label="Alasan Blacklist"
                  placeholder="Alasan Blacklist..."
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

export default AddIdentity;
