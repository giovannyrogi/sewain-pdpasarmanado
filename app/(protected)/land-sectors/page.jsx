"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
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
import LandSectorFormModal from "./LandSectorFormModal";
import LandSectorDescriptionModal from "./LandSectorDescriptionModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const ACTION_COLUMN_WIDTH = 136;

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const getStatusChipSx = (theme, status) => {
  const mainColor =
    status === "active" ? theme.palette.success.main : theme.palette.warning.main;

  return {
    alignSelf: "flex-start",
    width: "fit-content",
    height: 22,
    borderRadius: 1.25,
    color: mainColor,
    bgcolor:
      theme.palette.mode === "dark"
        ? `${mainColor}24`
        : `${mainColor}18`,
    border: `1px solid ${mainColor}55`,
    "& .MuiChip-label": {
      px: 1,
      fontSize: 11.5,
      fontWeight: 700,
      lineHeight: 1,
    },
  };
};

/**
 * Halaman master sektor izin lahan.
 * Sektor menjadi pengelompokan lahan per lokasi, sehingga admin izin lahan bisa
 * memisahkan area seperti sayur, daging, borito, booth, tenant, atau sektor A/B.
 */
export default function LandSectorsPage() {
  const theme = useTheme();
  const [sectors, setSectors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const [sectorResponse, locationResponse] = await Promise.all([
        axios.get("/api/land-sectors"),
        axios.get("/api/locations"),
      ]);

      if (!sectorResponse.data?.success) {
        showSnackbar(
          sectorResponse.data?.message || "Gagal mengambil data sektor.",
          "error",
        );
        return;
      }

      if (!locationResponse.data?.success) {
        showSnackbar(
          locationResponse.data?.message || "Gagal mengambil data lokasi.",
          "error",
        );
        return;
      }

      setSectors(sectorResponse.data.data || []);
      setLocations(locationResponse.data.data || []);
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat mengambil data sektor.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const filteredSectors = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return sectors;

    return sectors.filter((item) =>
      [
        item.sector_name,
        item.sector_code,
        item.location_name,
        item.description,
        item.status,
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [searchText, sectors]);

  const stats = useMemo(() => {
    const activeCount = sectors.filter(
      (item) => item.status === "active",
    ).length;
    const inactiveCount = sectors.filter(
      (item) => item.status === "inactive",
    ).length;
    const availableStalls = sectors.reduce(
      (total, item) => total + Number(item.available_stall_count || 0),
      0,
    );

    return [
      {
        label: "Total Sektor",
        value: sectors.length,
        icon: "solar:map-arrow-square-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Sektor Aktif",
        value: activeCount,
        icon: "solar:check-circle-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Sektor Nonaktif",
        value: inactiveCount,
        icon: "solar:minus-circle-bold-duotone",
        color: theme.palette.warning.main,
      },
      {
        label: "Lahan Tersedia",
        value: availableStalls,
        icon: "solar:shop-bold-duotone",
        color: theme.palette.info.main,
      },
    ];
  }, [sectors, theme]);

  const openCreateModal = () => {
    setSelectedSector(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedSector(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedSector(record);
    setDeleteOpen(true);
  };

  const openDescriptionModal = (record) => {
    if (!record?.description) return;
    setSelectedSector(record);
    setDescriptionOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedSector(null);
  };

  const handleSaveSector = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedSector?.id
          ? axios.put(`/api/land-sectors/${selectedSector.id}`, payload)
          : axios.post("/api/land-sectors", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Data sektor berhasil disimpan.");
        setFormOpen(false);
        setSelectedSector(null);
        await fetchMasterData();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyimpan sektor.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan sektor.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSector = async () => {
    if (!selectedSector?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `/api/land-sectors/${selectedSector.id}`,
      );

      if (response.data?.success) {
        showSnackbar(response.data.message || "Sektor berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedSector(null);
        await fetchMasterData();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menghapus sektor.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi kesalahan saat menghapus sektor.",
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
        title: "Sektor",
        dataIndex: "sector_name",
        width: 260,
        sorter: (a, b) => a.sector_name.localeCompare(b.sector_name),
        render: (_, record) => (
          <Stack spacing={0.6}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              {record.sector_name}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={record.sector_code || "Tanpa kode"}
                sx={{
                  height: 22,
                  borderRadius: 1.25,
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.14)"
                      : "rgba(230,9,9,0.10)",
                  "& .MuiChip-label": {
                    px: 1,
                    fontWeight: 700,
                  },
                }}
              />
              <Chip
                size="small"
                label={record.status === "active" ? "Aktif" : "Tidak Aktif"}
                sx={getStatusChipSx(theme, record.status)}
              />
            </Stack>
          </Stack>
        ),
      },
      {
        title: "Lokasi",
        dataIndex: "location_name",
        width: 240,
        sorter: (a, b) => a.location_name.localeCompare(b.location_name),
        render: (value) => (
          <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
            {value || "-"}
          </Typography>
        ),
      },
      {
        title: "Lahan",
        dataIndex: "stall_count",
        width: 220,
        render: (_, record) => (
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              {record.available_stall_count || 0} tersedia
            </Typography>
            <Typography
              sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}
            >
              Total {record.stall_count || 0} lahan terdaftar
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Deskripsi",
        dataIndex: "description",
        width: 150,
        render: (_, record) => {
          const hasDescription = Boolean(String(record.description || "").trim());

          return (
            <Button
              size="small"
              variant={hasDescription ? "outlined" : "contained"}
              color={hasDescription ? "warning" : "inherit"}
              disabled={!hasDescription}
              onClick={() => openDescriptionModal(record)}
              startIcon={<Icon icon="solar:document-text-bold-duotone" />}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                whiteSpace: "nowrap",
                ...(!hasDescription && {
                  color: theme.ui.mutedText,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(17,24,39,0.06)",
                  boxShadow: "none",
                }),
              }}
            >
              Lihat
            </Button>
          );
        },
      },
      {
        title: "Diperbarui",
        dataIndex: "updated_at",
        width: 180,
        render: (value) => (
          <Typography
            sx={{ color: theme.ui.mutedText, fontWeight: 700, fontSize: 12 }}
          >
            {value || "-"}
          </Typography>
        ),
      },
      {
        title: "Aksi",
        key: "actions",
        width: ACTION_COLUMN_WIDTH,
        fixed: "right",
        className: "land-sector-action-column",
        onHeaderCell: () => ({ className: "land-sector-action-column" }),
        onCell: () => ({ className: "land-sector-action-column" }),
        render: (_, record) => (
          <Box
            className="land-sector-action-buttons"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.85,
              width: "100%",
              minWidth: 82,
              flexWrap: "nowrap",
            }}
          >
            <TableActionButton
              title="Ubah sektor"
              color="info"
              icon="solar:pen-bold-duotone"
              onClick={() => openEditModal(record)}
            />
            <TableActionButton
              title="Hapus sektor"
              color="error"
              icon="solar:trash-bin-trash-bold-duotone"
              onClick={() => openDeleteModal(record)}
            />
          </Box>
        ),
      },
    ],
    [theme],
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
          breadcrumbs={[
            { label: "Data Master", icon: "solar:database-bold-duotone" },
            {
              label: "Sektor",
              icon: "solar:map-arrow-square-bold-duotone",
            },
          ]}
          title="Sektor"
          description="Kelola sektor di setiap lokasi sebagai dasar pengelompokan lahan izin."
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:add-circle-bold-duotone" />}
              onClick={openCreateModal}
              sx={{
                minHeight: 46,
                px: { xs: 2, sm: 2.5 },
                borderRadius: 2,
                fontFamily: "Poppins",
                fontWeight: 700,
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
              Tambah Sektor
            </Button>
          }
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {stats.map((item) => (
            <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Sektor"
          description={`${filteredSectors.length} dari ${sectors.length} sektor ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari sektor, kode, lokasi, atau deskripsi"
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            rowKey="id"
            columns={columns}
            dataSource={filteredSectors}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={setPageSize}
            scroll={{ x: 1260, y: 430 }}
            fixedActionColumn={{
              className: "land-sector-action-column",
              buttonsClassName: "land-sector-action-buttons",
              buttonsOffsetX: 6,
              width: ACTION_COLUMN_WIDTH,
              paddingX: 16,
            }}
          />
        </DataTableShell>
      </Stack>

      <LandSectorFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedSector}
        locations={locations}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveSector}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Sektor"
        titleDescription="Sektor yang sudah memiliki lahan tidak dapat dihapus."
        description="Sektor yang dihapus tidak dapat digunakan lagi. Pastikan tidak ada lahan aktif di sektor ini sebelum menghapus."
        highlight={selectedSector?.sector_name}
        confirmLabel="Hapus Sektor"
        loading={loading}
        loadingLabel="Menghapus sektor..."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteSector}
      />

      <LandSectorDescriptionModal
        open={descriptionOpen}
        onClose={() => setDescriptionOpen(false)}
        selectedData={selectedSector}
      />

      <LoadingBackdrop
        open={loading && !formOpen && !deleteOpen && !descriptionOpen}
        message="Memuat data sektor..."
      />

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(getInitialSnackbar())}
      />
    </Box>
  );
}
