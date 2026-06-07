"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { ConfigProvider, Table, Tag, theme as antdTheme } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
import LoadingBackdrop from "@/app/components/loading/Backdrop";
import Notification from "@/app/components/Notification";
import PageHeader from "@/app/components/page-header/PageHeader";
import DataTableShell from "@/app/components/data-table/DataTableShell";
import CrudConfirmModal from "@/app/components/crud/CrudConfirmModal";
import SummaryStatCard from "@/app/components/stats/SummaryStatCard";
import { useThemeMode } from "@/app/components/themeprovider/ThemeContext";
import FloorFormModal from "./FloorFormModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

/**
 * Filter table reusable untuk kolom yang berasal dari dataset aktif.
 * Nilai kosong dibuang agar dropdown filter tetap bersih dan mudah dipindai.
 */
const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

const createExactFilter = (key) => (value, record) => record[key] === value;

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

/**
 * Halaman master data lantai.
 * Halaman ini memakai komponen reusable yang sama dengan Locations agar pola
 * CRUD data master tetap konsisten, responsif, dan mudah dirawat.
 */
export default function FloorPrices() {
  const theme = useTheme();
  const { themeMode } = useThemeMode();
  const [locations, setLocations] = useState([]);
  const [floors, setFloors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReferenceData = useCallback(async () => {
    setLoading(true);
    try {
      const [locationsResponse, floorsResponse] = await Promise.all([
        axios.get("/api/locations"),
        axios.get("/api/location-floor-price"),
      ]);

      if (locationsResponse.data?.success) {
        setLocations(locationsResponse.data.data || []);
      } else {
        showSnackbar(
          locationsResponse.data?.message || "Gagal mengambil data lokasi.",
          "error",
        );
      }

      if (floorsResponse.data?.success) {
        setFloors(floorsResponse.data.data || []);
      } else {
        showSnackbar(
          floorsResponse.data?.message || "Gagal mengambil data lantai.",
          "error",
        );
      }
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat mengambil data lantai.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  const filteredFloors = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return floors;

    return floors.filter((item) =>
      [item.location_name, item.floor, item.created_at, item.updated_at].some((value) =>
        normalizeText(value).includes(keyword),
      ),
    );
  }, [floors, searchText]);

  const floorStats = useMemo(() => {
    const usedLocations = new Set(floors.map((item) => item.location_id).filter(Boolean));
    const basementCount = floors.filter((item) =>
      normalizeText(item.floor).includes("basement"),
    ).length;
    const standardFloorCount = floors.length - basementCount;

    return [
      {
        label: "Total Lantai",
        value: floors.length,
        icon: "solar:tag-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Lokasi Terpakai",
        value: usedLocations.size,
        icon: "solar:map-point-bold-duotone",
        color: theme.palette.info.main,
      },
      {
        label: "Lantai Gedung",
        value: standardFloorCount,
        icon: "solar:buildings-3-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Basement",
        value: basementCount,
        icon: "solar:garage-bold-duotone",
        color: theme.palette.warning.main,
      },
    ];
  }, [floors, theme]);

  const openCreateModal = () => {
    setSelectedFloor(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedFloor(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedFloor(record);
    setDeleteOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedFloor(null);
  };

  const handleSaveFloor = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedFloor?.id
          ? axios.put(`/api/location-floor-price/${selectedFloor.id}`, payload)
          : axios.post("/api/location-floor-price", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(response.data.message || "Data lantai berhasil disimpan.");
        setFormOpen(false);
        setSelectedFloor(null);
        await fetchReferenceData();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menyimpan data lantai.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menyimpan data lantai.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloor = async () => {
    if (!selectedFloor?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/location-floor-price/${selectedFloor.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Data lantai berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedFloor(null);
        await fetchReferenceData();
        return;
      }

      showSnackbar(response.data?.message || "Gagal menghapus data lantai.", "error");
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message || "Terjadi error saat menghapus data lantai.",
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
        width: 320,
        filters: createColumnFilters(floors, "location_name"),
        onFilter: createExactFilter("location_name"),
        filterSearch: true,
        sorter: (a, b) => a.location_name.localeCompare(b.location_name),
        render: (_, record) => (
          <Stack spacing={0.55}>
            <Typography sx={{ fontFamily: "Poppins", fontWeight: 850, fontSize: 13 }}>
              {record.location_name || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Lantai",
        dataIndex: "floor",
        width: 180,
        filters: createColumnFilters(floors, "floor"),
        onFilter: createExactFilter("floor"),
        filterSearch: true,
        sorter: (a, b) => String(a.floor).localeCompare(String(b.floor)),
        render: (value) => (
          <Tag
            color={themeMode === "dark" ? "orange" : "red"}
            style={{
              borderRadius: 8,
              fontFamily: "Poppins",
              fontWeight: 800,
              padding: "3px 9px",
            }}
          >
            {value || "-"}
          </Tag>
        ),
      },
      {
        title: "Diperbarui",
        dataIndex: "updated_at",
        width: 190,
        render: (value) => (
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 650, fontSize: 12 }}>
            {formatDateTime(value)}
          </Typography>
        ),
      },
      {
        title: "Dibuat",
        dataIndex: "created_at",
        width: 190,
        render: (value) => (
          <Typography sx={{ fontFamily: "Poppins", fontWeight: 650, fontSize: 12 }}>
            {formatDateTime(value)}
          </Typography>
        ),
      },
      {
        title: "Aksi",
        key: "action",
        width: 116,
        fixed: "right",
        align: "center",
        render: (_, record) => (
          <Stack direction="row" spacing={0.75} justifyContent="center">
            <Tooltip title="Ubah lantai">
              <IconButton
                size="small"
                onClick={() => openEditModal(record)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  color: theme.palette.info.main,
                  border: `1px solid ${theme.palette.info.main}55`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(33,150,243,0.10)"
                      : "rgba(33,150,243,0.08)",
                }}
              >
                <Icon icon="solar:pen-bold-duotone" fontSize={18} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Hapus lantai">
              <IconButton
                size="small"
                onClick={() => openDeleteModal(record)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 1.5,
                  color: theme.palette.error.main,
                  border: `1px solid ${theme.palette.error.main}55`,
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? "rgba(244,67,54,0.10)"
                      : "rgba(244,67,54,0.08)",
                }}
              >
                <Icon icon="solar:trash-bin-trash-bold-duotone" fontSize={18} />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [floors, theme, themeMode],
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
          title="Floor"
          description="Kelola lantai per lokasi untuk membantu pengelompokan ruangan, filter data operasional, dan proses transaksi sewa."
          icon="solar:tag-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:tag-bold-duotone" />}
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
              Tambah Lantai
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {floorStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Lantai"
          description={`${filteredFloors.length} dari ${floors.length} lantai ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari lokasi, lantai, atau tanggal..."
          onSearchChange={setSearchText}
        >
          <ConfigProvider
            theme={{
              algorithm:
                themeMode === "dark"
                  ? antdTheme.darkAlgorithm
                  : antdTheme.defaultAlgorithm,
              token: {
                colorPrimary: theme.palette.primary.main,
                colorBgContainer: theme.ui.dashboardCardBg,
                colorText: theme.palette.text.primary,
                colorBorder: theme.ui.dashboardCardBorder,
                fontFamily: "Poppins, sans-serif",
                borderRadius: 10,
              },
              components: {
                Table: {
                  headerBg:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.045)"
                      : "rgba(17,24,39,0.035)",
                  rowHoverBg:
                    theme.palette.mode === "dark"
                      ? "rgba(255,152,0,0.08)"
                      : "rgba(230,9,9,0.05)",
                },
              },
            }}
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredFloors}
              loading={loading}
              showSorterTooltip={{ target: "sorter-icon" }}
              scroll={{ x: 1180, y: 430 }}
              onChange={(pagination) => {
                if (pagination.pageSize !== pageSize) {
                  setPageSize(pagination.pageSize);
                }
              }}
              pagination={{
                pageSize,
                showSizeChanger: true,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} dari ${total} data`,
              }}
            />
          </ConfigProvider>
        </DataTableShell>
      </Stack>

      <FloorFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedFloor}
        locations={locations}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveFloor}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Lantai"
        description={
          <>
            Lantai{" "}
            <Box component="strong" sx={{ color: "text.primary", fontWeight: 850 }}>
              {selectedFloor?.floor || "-"}
            </Box>{" "}
            pada lokasi{" "}
            <Box component="strong" sx={{ color: "text.primary", fontWeight: 850 }}>
              {selectedFloor?.location_name || "-"}
            </Box>{" "}
            tidak dapat digunakan lagi setelah dihapus.
          </>
        }
        confirmLabel="Hapus Lantai"
        loadingLabel="Menghapus..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteFloor}
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
