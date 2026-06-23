"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
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
import LandSectorFormModal from "./LandSectorFormModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

/**
 * Halaman master sektor izin lahan.
 * Sektor menjadi pengelompokan lapak per lokasi, sehingga admin izin lahan bisa
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
        label: "Lapak Tersedia",
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
            <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
              {record.sector_name}
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={record.sector_code || "Tanpa kode"}
                sx={{
                  height: 22,
                  borderRadius: 1.25,
                  fontWeight: 750,
                  color: theme.palette.primary.main,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.14)"
                      : "rgba(230,9,9,0.10)",
                }}
              />
              <Tag color={record.status === "active" ? "success" : "warning"}>
                {record.status === "active" ? "Aktif" : "Tidak Aktif"}
              </Tag>
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
          <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
            {value || "-"}
          </Typography>
        ),
      },
      {
        title: "Lapak",
        dataIndex: "stall_count",
        width: 220,
        render: (_, record) => (
          <Stack spacing={0.5}>
            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
              {record.available_stall_count || 0} tersedia
            </Typography>
            <Typography
              sx={{ color: theme.ui.mutedText, fontWeight: 650, fontSize: 12 }}
            >
              Total {record.stall_count || 0} lapak terdaftar
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Deskripsi",
        dataIndex: "description",
        width: 360,
        render: (value) => (
          <Typography
            sx={{
              color: value ? "text.primary" : theme.ui.mutedText,
              fontWeight: 650,
              fontSize: 12.5,
              whiteSpace: "normal",
            }}
          >
            {value || "Belum ada deskripsi."}
          </Typography>
        ),
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
        width: 132,
        fixed: "right",
        className: "land-sector-action-column",
        render: (_, record) => (
          <Stack
            direction="row"
            spacing={0.75}
            justifyContent="center"
            className="land-sector-action-buttons"
          >
            <Tooltip title="Ubah sektor">
              <IconButton
                size="small"
                color="info"
                onClick={() => openEditModal(record)}
              >
                <Icon icon="solar:pen-new-square-bold-duotone" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hapus sektor">
              <IconButton
                size="small"
                color="error"
                onClick={() => openDeleteModal(record)}
              >
                <Icon icon="solar:trash-bin-trash-bold-duotone" />
              </IconButton>
            </Tooltip>
          </Stack>
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
              label: "Sektor Izin Lahan",
              icon: "solar:map-arrow-square-bold-duotone",
            },
          ]}
          title="Sektor Izin Lahan"
          description="Kelola sektor di setiap lokasi sebagai dasar pengelompokan lapak izin lahan."
          action={
            <TableActionButton
              label="Tambah Sektor"
              icon="solar:add-circle-bold-duotone"
              keepLabelOnMobile
              fullWidthOnMobile
              onClick={openCreateModal}
            />
          }
          actionSx={{ width: { xs: "100%", sm: "auto" } }}
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
              width: 132,
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
        titleDescription="Sektor yang sudah memiliki lapak tidak dapat dihapus."
        description="Sektor yang dihapus tidak dapat digunakan lagi. Pastikan tidak ada lapak aktif di sektor ini sebelum menghapus."
        highlight={selectedSector?.sector_name}
        confirmLabel="Hapus Sektor"
        loading={loading}
        loadingLabel="Menghapus sektor..."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteSector}
      />

      <LoadingBackdrop
        open={loading && !formOpen && !deleteOpen}
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
