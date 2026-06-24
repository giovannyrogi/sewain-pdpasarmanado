"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Grid, Stack, Typography, useTheme } from "@mui/material";
import { Tag } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import ReusableAntTable from "@/app/components/data-table/ReusableAntTable";
import TableActionButton from "@/app/components/data-table/TableActionButton";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import LocationFormModal from "./LocationFormModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const normalizeText = (value) => String(value || "").toLowerCase();

/**
 * Mengambil nilai unik untuk filter Ant Design Table.
 * Fungsi ini sengaja dibuat generic agar pola filter bisa dipakai ulang saat
 * halaman master data lain ikut dipoles.
 */
const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

const createExactFilter = (key) => (value, record) => record[key] === value;

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

/**
 * Halaman master data lokasi.
 * Fokus halaman ini adalah memberi gambaran cepat lokasi terdaftar, wilayah
 * administratif, dan aksi CRUD tanpa membuat user bergumul dengan table mentah.
 */
export default function Locations() {
  const theme = useTheme();
  const [locations, setLocations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/locations");
      if (response.data?.success) {
        setLocations(response.data.data || []);
      } else {
        showSnackbar(response.data?.message || "Gagal mengambil data lokasi.", "error");
      }
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat mengambil data lokasi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const filteredLocations = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return locations;

    return locations.filter((item) =>
      [
        item.location_name,
        item.location_code,
        item.province,
        item.city,
        item.district,
        item.kelurahan,
        item.street_address,
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [locations, searchText]);

  const locationStats = useMemo(() => {
    const provinces = new Set(locations.map((item) => item.province).filter(Boolean));
    const cities = new Set(locations.map((item) => item.city).filter(Boolean));
    const districts = new Set(locations.map((item) => item.district).filter(Boolean));

    return [
      {
        label: "Total Lokasi",
        value: locations.length,
        icon: "solar:map-point-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Provinsi",
        value: provinces.size,
        icon: "solar:global-bold-duotone",
        color: theme.palette.info.main,
      },
      {
        label: "Kota/Kabupaten",
        value: cities.size,
        icon: "solar:city-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Kecamatan",
        value: districts.size,
        icon: "solar:streets-map-point-bold-duotone",
        color: theme.palette.warning.main,
      },
    ];
  }, [locations, theme]);

  const openCreateModal = () => {
    setSelectedLocation(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedLocation(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedLocation(record);
    setDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedLocation(null);
  };

  const handleSaveLocation = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedLocation?.id
          ? axios.put(`/api/locations/${selectedLocation.id}`, payload)
          : axios.post("/api/locations", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Data lokasi berhasil disimpan.");
        setFormOpen(false);
        setSelectedLocation(null);
        await fetchLocations();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menyimpan lokasi.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menyimpan lokasi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/locations/${selectedLocation.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Lokasi berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedLocation(null);
        await fetchLocations();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menghapus lokasi.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menghapus lokasi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "No",
        width: 72,
        align: "center",
        render: (_, __, index) => index + 1,
      },
      {
        title: "Lokasi",
        dataIndex: "location_name",
        width: 260,
        filters: createColumnFilters(locations, "location_name"),
        onFilter: createExactFilter("location_name"),
        filterSearch: true,
        sorter: (a, b) => a.location_name.localeCompare(b.location_name),
        render: (_, record) => (
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 950, fontSize: 13 }}>
              {record.location_name}
            </Typography>
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Chip
                size="small"
                label={record.location_code || "-"}
                sx={{
                  height: 22,
                  borderRadius: 1.2,
                  fontWeight: 850,
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.13)"
                      : "rgba(230,9,9,0.10)",
                }}
              />
            </Stack>
          </Stack>
        ),
      },
      {
        title: "Wilayah Administratif",
        dataIndex: "province",
        width: 360,
        filters: createColumnFilters(locations, "province"),
        onFilter: createExactFilter("province"),
        filterSearch: true,
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 850, fontSize: 12 }}>
              {record.city || "-"}, {record.province || "-"}
            </Typography>
            <Typography sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 11 }}>
              {record.district || "-"} | {record.kelurahan || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Kecamatan",
        dataIndex: "district",
        width: 160,
        filters: createColumnFilters(locations, "district"),
        onFilter: createExactFilter("district"),
        filterSearch: true,
      },
      {
        title: "Alamat",
        dataIndex: "street_address",
        width: 280,
        render: (value) => (
          <Typography sx={{ fontWeight: 650, fontSize: 12 }}>
            {value || "-"}
          </Typography>
        ),
      },
      {
        title: "Diperbarui",
        dataIndex: "updated_at",
        width: 180,
        render: (value) => <Tag color="default">{value || "-"}</Tag>,
      },
      {
        title: "Aksi",
        key: "action",
        width: 116,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Stack direction="row" spacing={0.75} justifyContent="center">
            <TableActionButton
              title="Ubah lokasi"
              color="info"
              icon="solar:pen-bold-duotone"
              onClick={() => openEditModal(record)}
            />
            <TableActionButton
              title="Hapus lokasi"
              color="error"
              icon="solar:trash-bin-trash-bold-duotone"
              onClick={() => openDeleteModal(record)}
            />
          </Stack>
        ),
      },
    ],
    [locations, theme],
  );

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 64px)",
        bgcolor: theme.ui.pageBg,
        p: { xs: 1.25, sm: 2, lg: 2.25 },
        transition: "background-color 0.2s ease",
      }}
    >
      <Stack spacing={{ xs: 1.5, lg: 2 }}>
        <PageHeader
          eyebrow="Data Master"
          breadcrumbs={[
            {
              label: "Data Master",
              value: "data-master",
              icon: "solar:database-bold-duotone",
              path: "#",
            },
            {
              label: "Lokasi",
              value: "locations",
              icon: "solar:map-point-wave-bold-duotone",
              path: "/locations",
            },
          ]}
          title="Lokasi"
          description="Kelola daftar lokasi pasar atau gedung, kode lokasi, wilayah administratif, dan alamat operasional yang dipakai di data ruangan serta transaksi sewa."
          icon="solar:map-point-wave-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:map-point-add-bold-duotone" />}
              onClick={openCreateModal}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 900,
                textTransform: "none",
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 6px 14px rgba(255, 152, 0, 0.18)"
                    : "0 6px 14px rgba(230, 9, 9, 0.16)",
                "&:hover": {
                  boxShadow:
                    theme.palette.mode === "dark"
                      ? "0 8px 18px rgba(255, 152, 0, 0.22)"
                      : "0 8px 18px rgba(230, 9, 9, 0.20)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Tambah Lokasi
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {locationStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Lokasi"
          description={`${filteredLocations.length} dari ${locations.length} lokasi ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari lokasi, kode, kota, kecamatan, atau alamat..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            columns={columns}
            dataSource={filteredLocations}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            scroll={{ x: 1280, y: 430 }}
            onPageSizeChange={setPageSize}
          />
        </DataTableShell>
      </Stack>

      <LocationFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedLocation}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveLocation}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Lokasi"
        titleDescription="Konfirmasi penghapusan data lokasi"
        description="Lokasi yang dihapus tidak dapat digunakan lagi. Anda yakin ingin menghapus"
        highlight={selectedLocation?.location_name}
        confirmLabel="Hapus Lokasi"
        loadingLabel="Menghapus..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteLocation}
      />

      <LoadingBackdrop message="Loading..." open={loading && !formOpen && !deleteOpen} />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
