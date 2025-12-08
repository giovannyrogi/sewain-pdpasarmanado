import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Grid,
  Modal,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import axios from "axios";
import wilayah from "daftar-wilayah-indonesia";

const EditLocation = ({
  open,
  onClose,
  loadingTrue,
  loadingFalse,
  loading,
  getLocationsData,
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

  const [locatioName, setLocatioName] = useState("");
  const [address, setAddress] = useState("");
  const [locationCode, setLocationCode] = useState("");

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

  // Setiap kali selectedData atau open berubah, update form
  useEffect(() => {
    if (open) {
      setLocatioName(selectedData.location_name || "");
      setLocationCode(selectedData.location_code || "");
      setAddress(selectedData.street_address || "");

      // isi list provinsi
      const allProv = wilayah.provinsi();
      setListProvinsi(allProv);

      // cari provinsi by nama (kalau di DB simpan nama)
      const prov = allProv.find((p) => p.nama === selectedData?.province);
      //   console.log("prov", prov);

      if (prov) {
        setProvinsiCode(prov.kode);
        setProvinsi(prov.nama);

        // isi kabupaten sesuai provinsi
        const allKab = wilayah.kabupaten(prov.kode);

        setListKabupaten(allKab);

        const kab = allKab.find((k) => k.nama === selectedData?.city);

        if (kab) {
          setKabupatenCode(kab.kode);
          setKabupaten(kab.nama);

          // isi kecamatan sesuai kabupaten
          const allKec = wilayah.kecamatan(kab.kode);
          setListKecamatan(allKec);

          const kec = allKec.find((c) => c.nama === selectedData?.district);
          if (kec) {
            setKecamatanCode(kec.kode);
            setKecamatan(kec.nama);

            // isi kelurahan sesuai kecamatan
            const allKel = wilayah.desa(kec.kode);
            setListKelurahan(allKel);

            const kel = allKel.find((d) => d.nama === selectedData?.kelurahan);
            if (kel) {
              setKelurahanCode(kel.kode);
              setKelurahan(kel.nama);
            }
          }
        }
      }
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // console.log("activeUntilISO", activeUntilISO);

    loadingTrue();
    try {
      const response = await axios.put(`/api/locations/${selectedData.id}`, {
        location_name: locatioName,
        city: kabupaten,
        street_address: address,
        location_code: locationCode,
        province: provinsi,
        district: kecamatan,
        kelurahan: kelurahan,
      });
      // console.log("response update", response);

      if (response.data.success) {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Lokasi berhasil diubah!",
            severity: "success",
          });
        getLocationsData();
        setTimeout(() => {
          onClose();
          loadingFalse();
        }, 1000);
      } else {
        onNotify &&
          onNotify({
            open: true,
            message: response.data.message || "Gagal mengubah lokasi.",
            severity: "error",
          });
        setTimeout(() => {
          loadingFalse();
        }, 1000);
      }
    } catch (error) {
      onNotify &&
        onNotify({
          open: true,
          message:
            error.response.data.message ||
            "Terjadi error saat mengubah lokasi.",
          severity: "error",
        });
      setTimeout(() => {
        loadingFalse();
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
    // console.log("kabupaten", allKab);

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
    // console.log("kecamatan", allKec);

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
    // console.log("kelurahan", allKel);

    setListKelurahan(allKel);
  };

  /* Handler saat kelurahan dipilih */
  const handleKelurahanChange = (newValue) => {
    const kodeKel = newValue?.kode || "";
    setKelurahanCode(kodeKel);
    setKelurahan(newValue?.nama || "");
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
            Form Ubah Lokasi
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={isMobile ? 3 : 2}>
            <Grid size={12}>
              <TextField
                label="Nama Lokasi"
                variant="filled"
                fullWidth
                value={locatioName}
                onChange={(e) => setLocatioName(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Kode Lokasi"
                variant="filled"
                fullWidth
                value={locationCode}
                onChange={(e) => setLocationCode(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
            </Grid>
            <Grid size={12}>
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

            <Grid size={12}>
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

            <Grid size={12}>
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

            <Grid size={12}>
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
            <Grid size={12}>
              <TextField
                label="Nama Jalan"
                variant="filled"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                autoFocus
                required
                disabled={loading}
                color="primary"
              />
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

export default EditLocation;
