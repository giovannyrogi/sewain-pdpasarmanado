"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Chip, Grid, IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
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
import formatRupiah from "@/app/components/formatrupiah/page";
import { formatNumber } from "@/app/utils/formatNumber";
import LandStallFormModal from "./LandStallFormModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const statusLabel = {
  available: "Tersedia",
  occupied: "Sudah Terisi",
  maintenance: "Dalam Perbaikan",
  unavailable: "Tidak Layak",
};

const statusColor = {
  available: "success",
  occupied: "processing",
  maintenance: "warning",
  unavailable: "error",
};

/**
 * Halaman master lapak izin lahan.
 * Data ini menjadi sumber pilihan lapak saat Phase 2 permohonan izin lahan,
 * sehingga relasi lokasi-sektor-lapak harus terlihat jelas di table.
 */
export default function LandStallsPage() {
  const theme = useTheme();
  const [stalls, setStalls] = useState([]);
  const [locations, setLocations] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const [stallResponse, locationResponse, sectorResponse] = await Promise.all([
        axios.get("/api/land-stalls"),
        axios.get("/api/locations"),
        axios.get("/api/land-sectors"),
      ]);

      if (!stallResponse.data?.success) {
        showSnackbar(stallResponse.data?.message || "Gagal mengambil data lapak.", "error");
        return;
      }

      if (!locationResponse.data?.success || !sectorResponse.data?.success) {
        showSnackbar("Gagal mengambil data lokasi atau sektor.", "error");
        return;
      }

      setStalls(stallResponse.data.data || []);
      setLocations(locationResponse.data.data || []);
      setSectors(sectorResponse.data.data || []);
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi kesalahan saat mengambil data lapak.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const filteredStalls = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return stalls;

    return stalls.filter((item) =>
      [
        item.stall_number,
        item.location_name,
        item.sector_name,
        item.status,
        item.notes,
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [searchText, stalls]);

  const stats = useMemo(() => {
    const available = stalls.filter((item) => item.status === "available").length;
    const occupied = stalls.filter((item) => item.status === "occupied").length;
    const inactive = stalls.filter((item) =>
      ["maintenance", "unavailable"].includes(item.status),
    ).length;
    const totalAnnualRent = stalls
      .filter((item) => item.status === "available")
      .reduce((total, item) => total + Number(item.annual_land_rent || 0), 0);

    return [
      {
        label: "Total Lapak",
        value: stalls.length,
        icon: "solar:shop-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Lapak Tersedia",
        value: available,
        icon: "solar:check-circle-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Lapak Terisi",
        value: occupied,
        icon: "solar:lock-keyhole-bold-duotone",
        color: theme.palette.warning.main,
      },
      {
        label: "Estimasi Tersedia",
        value: formatRupiah(totalAnnualRent),
        icon: "solar:wallet-money-bold-duotone",
        color: theme.palette.info.main,
        valueSx: { fontSize: { xs: 19, sm: 22 }, lineHeight: 1.2 },
      },
      {
        label: "Perlu Tindakan",
        value: inactive,
        icon: "solar:danger-triangle-bold-duotone",
        color: theme.palette.error.main,
      },
    ];
  }, [stalls, theme]);

  const openCreateModal = () => {
    setSelectedStall(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedStall(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedStall(record);
    setDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedStall(null);
  };

  const handleSaveStall = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedStall?.id
          ? axios.put(`/api/land-stalls/${selectedStall.id}`, payload)
          : axios.post("/api/land-stalls", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Data lapak berhasil disimpan.");
        setFormOpen(false);
        setSelectedStall(null);
        await fetchMasterData();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menyimpan lapak.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi kesalahan saat menyimpan lapak.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStall = async () => {
    if (!selectedStall?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/land-stalls/${selectedStall.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Lapak berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedStall(null);
        await fetchMasterData();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menghapus lapak.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi kesalahan saat menghapus lapak.",
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
        title: "Lapak",
        dataIndex: "stall_number",
        width: 220,
        fixed: "left",
        sorter: (a, b) => a.stall_number.localeCompare(b.stall_number),
        render: (_, record) => (
          <Stack spacing={0.6}>
            <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
              Lapak {record.stall_number}
            </Typography>
            <Tag color={statusColor[record.status] || "default"}>
              {statusLabel[record.status] || record.status}
            </Tag>
          </Stack>
        ),
      },
      {
        title: "Lokasi & Sektor",
        dataIndex: "location_name",
        width: 280,
        render: (_, record) => (
          <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
              {record.location_name || "-"}
            </Typography>
            <Chip
              size="small"
              label={record.sector_name || "-"}
              sx={{
                width: "fit-content",
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
          </Stack>
        ),
      },
      {
        title: "Ukuran",
        dataIndex: "stall_area",
        width: 240,
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 800, fontSize: 13 }}>
              {formatNumber(record.stall_length, { maxFractionDigits: 4 })} m x{" "}
              {formatNumber(record.stall_width, { maxFractionDigits: 4 })} m
            </Typography>
            <Typography sx={{ color: theme.ui.mutedText, fontWeight: 700, fontSize: 12 }}>
              Luas {formatNumber(record.stall_area, { useGrouping: true })} m²
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Harga per m²",
        dataIndex: "price_per_m2",
        width: 180,
        align: "right",
        sorter: (a, b) => Number(a.price_per_m2 || 0) - Number(b.price_per_m2 || 0),
        render: (value) => (
          <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
            {formatRupiah(value)}
          </Typography>
        ),
      },
      {
        title: "Estimasi / Tahun",
        dataIndex: "annual_land_rent",
        width: 190,
        align: "right",
        sorter: (a, b) =>
          Number(a.annual_land_rent || 0) - Number(b.annual_land_rent || 0),
        render: (value) => (
          <Typography sx={{ fontWeight: 850, fontSize: 13 }}>
            {formatRupiah(value)}
          </Typography>
        ),
      },
      {
        title: "Catatan",
        dataIndex: "notes",
        width: 300,
        render: (value) => (
          <Typography
            sx={{
              color: value ? "text.primary" : theme.ui.mutedText,
              fontWeight: 650,
              fontSize: 12.5,
              whiteSpace: "normal",
            }}
          >
            {value || "Tidak ada catatan."}
          </Typography>
        ),
      },
      {
        title: "Aksi",
        key: "actions",
        width: 132,
        fixed: "right",
        className: "land-stall-action-column",
        render: (_, record) => (
          <Stack
            direction="row"
            spacing={0.75}
            justifyContent="center"
            className="land-stall-action-buttons"
          >
            <Tooltip title="Ubah lapak">
              <IconButton size="small" color="info" onClick={() => openEditModal(record)}>
                <Icon icon="solar:pen-new-square-bold-duotone" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hapus lapak">
              <IconButton size="small" color="error" onClick={() => openDeleteModal(record)}>
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
          { label: "Lapak Izin Lahan", icon: "solar:shop-bold-duotone" },
        ]}
        title="Lapak Izin Lahan"
        description="Kelola lapak pada setiap sektor, termasuk ukuran, harga per meter, dan status ketersediaan."
        action={
          <TableActionButton
            label="Tambah Lapak"
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
          <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <SummaryStatCard {...item} />
          </Grid>
        ))}
      </Grid>

      <DataTableShell
        title="Daftar Lapak"
        description={`${filteredStalls.length} dari ${stalls.length} lapak ditampilkan`}
        searchValue={searchText}
        searchPlaceholder="Cari lapak, lokasi, sektor, status, atau catatan"
        onSearchChange={setSearchText}
      >
        <ReusableAntTable
          rowKey="id"
          columns={columns}
          dataSource={filteredStalls}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
          scroll={{ x: 1540, y: 430 }}
          fixedActionColumn={{
            className: "land-stall-action-column",
            buttonsClassName: "land-stall-action-buttons",
            width: 132,
          }}
        />
      </DataTableShell>
      </Stack>

      <LandStallFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedStall}
        locations={locations}
        sectors={sectors}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveStall}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Lapak"
        description="Lapak yang sudah dipakai permohonan izin lahan tidak dapat dihapus."
        confirmDescription="Anda yakin ingin menghapus lapak"
        highlight={selectedStall?.stall_number}
        confirmLabel="Hapus Lapak"
        loading={loading}
        loadingLabel="Menghapus lapak..."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteStall}
      />

      <LoadingBackdrop open={loading && !formOpen && !deleteOpen} message="Memuat data lapak..." />

      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(getInitialSnackbar())}
      />
    </Box>
  );
}
