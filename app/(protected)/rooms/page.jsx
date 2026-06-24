"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Stack, Typography, useTheme } from "@mui/material";
import { Tag } from "antd";
import { Icon } from "@iconify/react";
import axios from "axios";
import moment from "moment";
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
import RoomFormModal from "./RoomFormModal";
import RoomNotesModal from "./RoomNotesModal";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const TABLE_SCROLL_WIDTH = 1580;
const ACTION_COLUMN_WIDTH = 128;

const normalizeText = (value) => String(value || "").toLowerCase();

const getInitialSnackbar = () => ({
  open: false,
  message: "",
  severity: "success",
});

const statusMeta = {
  available: { label: "Tersedia", color: "green" },
  occupied: { label: "Sudah Terisi", color: "gold" },
  maintenance: { label: "Dalam Perbaikan", color: "orange" },
  unavailable: { label: "Tidak Layak", color: "red" },
};

const priceTypeLabel = {
  harga_per_meter: "Harga Per m²",
  harga_tetap: "Harga Tetap",
};

const createColumnFilters = (data, key) =>
  [...new Set(data.map((item) => item[key]).filter(Boolean))]
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ text: value, value }));

const createExactFilter = (key) => (value, record) => record[key] === value;

const formatDateTime = (value) =>
  value ? moment(value).format("DD MMM YYYY, HH:mm") : "-";

/**
 * Halaman master data ruangan.
 * Layout mengikuti pola Locations/Floor/Identity Lists, sedangkan kolom dan
 * summary disesuaikan untuk operasional ruangan, status, dimensi, dan harga.
 */
export default function Rooms() {
  const theme = useTheme();
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [pageSize, setPageSize] = useState(5);
  const [snackbar, setSnackbar] = useState(getInitialSnackbar);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchReferenceData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsResponse, locationsResponse] = await Promise.all([
        axios.get("/api/rooms"),
        axios.get("/api/locations"),
      ]);

      if (roomsResponse.data?.success) {
        setRooms(roomsResponse.data.data || []);
      } else {
        showSnackbar(
          roomsResponse.data?.message || "Gagal mengambil data ruangan.",
          "error",
        );
      }

      if (locationsResponse.data?.success) {
        setLocations(locationsResponse.data.data || []);
      } else {
        showSnackbar(
          locationsResponse.data?.message || "Gagal mengambil data lokasi.",
          "error",
        );
      }
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat mengambil data ruangan.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  const filteredRooms = useMemo(() => {
    const keyword = normalizeText(searchText);
    if (!keyword) return rooms;

    return rooms.filter((item) =>
      [
        item.room_number,
        item.location_name,
        item.room_floor,
        item.status,
        statusMeta[item.status]?.label,
        item.price_type,
        priceTypeLabel[item.price_type],
        item.notes,
        item.room_length,
        item.room_width,
        item.room_area,
        item.price_per_m2,
      ].some((value) => normalizeText(value).includes(keyword)),
    );
  }, [rooms, searchText]);

  const roomStats = useMemo(() => {
    const available = rooms.filter(
      (item) => item.status === "available",
    ).length;
    const occupied = rooms.filter((item) => item.status === "occupied").length;
    const maintenance = rooms.filter(
      (item) => item.status === "maintenance",
    ).length;
    const unavailable = rooms.filter(
      (item) => item.status === "unavailable",
    ).length;

    return [
      {
        label: "Total Ruangan",
        value: rooms.length,
        icon: "solar:home-angle-bold-duotone",
        color: theme.palette.primary.main,
      },
      {
        label: "Tersedia",
        value: available,
        icon: "solar:check-circle-bold-duotone",
        color: theme.palette.success.main,
      },
      {
        label: "Sudah Terisi",
        value: occupied,
        icon: "solar:key-minimalistic-square-bold-duotone",
        color: theme.palette.warning.main,
      },
      {
        label: "Perlu Tindakan",
        value: maintenance + unavailable,
        icon: "solar:danger-triangle-bold-duotone",
        color: theme.palette.error.main,
      },
    ];
  }, [rooms, theme]);

  const openCreateModal = () => {
    setSelectedRoom(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEditModal = (record) => {
    setSelectedRoom(record);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDeleteModal = (record) => {
    setSelectedRoom(record);
    setDeleteOpen(true);
  };

  const openNotesModal = (record) => {
    setSelectedRoom(record);
    setNotesOpen(true);
  };

  const closeFormModal = () => {
    if (loading) return;
    setFormOpen(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async (payload) => {
    setLoading(true);
    try {
      const request =
        formMode === "edit" && selectedRoom?.id
          ? axios.put(`/api/rooms/${selectedRoom.id}`, payload)
          : axios.post("/api/rooms", payload);

      const response = await request;

      if (response.data?.success) {
        showSnackbar(
          response.data.message || "Data ruangan berhasil disimpan.",
        );
        setFormOpen(false);
        setSelectedRoom(null);
        await fetchReferenceData();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menyimpan data ruangan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menyimpan data ruangan.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!selectedRoom?.id) return;

    setLoading(true);
    try {
      const response = await axios.delete(`/api/rooms/${selectedRoom.id}`);

      if (response.data?.success) {
        showSnackbar(response.data.message || "Ruangan berhasil dihapus.");
        setDeleteOpen(false);
        setSelectedRoom(null);
        await fetchReferenceData();
        return;
      }

      showSnackbar(
        response.data?.message || "Gagal menghapus ruangan.",
        "error",
      );
    } catch (error) {
      showSnackbar(
        error?.response?.data?.message ||
          "Terjadi error saat menghapus ruangan.",
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
        title: "Ruangan",
        dataIndex: "room_number",
        width: 230,
        sorter: (a, b) =>
          String(a.room_number).localeCompare(String(b.room_number)),
        render: (_, record) => (
          <Stack spacing={0.45}>
            <Typography sx={{ fontWeight: 900, fontSize: 13 }}>
              Ruangan {record.room_number || "-"}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 700,
                fontSize: 11.5,
              }}
            >
              {record.location_name || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Lokasi & Lantai",
        dataIndex: "location_name",
        width: 280,
        filters: createColumnFilters(rooms, "location_name"),
        onFilter: createExactFilter("location_name"),
        filterSearch: true,
        sorter: (a, b) =>
          String(a.location_name).localeCompare(String(b.location_name)),
        render: (_, record) => (
          <Stack spacing={0.45}>
            <Typography sx={{ fontWeight: 850, fontSize: 12 }}>
              {record.location_name || "-"}
            </Typography>
            <Tag
              color={theme.palette.mode === "dark" ? "orange" : "red"}
              style={{ width: "fit-content", borderRadius: 8, fontWeight: 800 }}
            >
              {record.room_floor || "-"}
            </Tag>
          </Stack>
        ),
      },
      {
        title: "Dimensi",
        dataIndex: "room_area",
        width: 250,
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 850, fontSize: 12 }}>
              {formatNumber(record.room_area)} m²
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 650,
                fontSize: 11.5,
              }}
            >
              P {formatNumber(record.room_length)} m | L{" "}
              {formatNumber(record.room_width)} m
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Harga",
        dataIndex: "price_per_m2",
        width: 230,
        sorter: (a, b) =>
          Number(a.price_per_m2 || 0) - Number(b.price_per_m2 || 0),
        render: (_, record) => (
          <Stack spacing={0.35}>
            <Typography sx={{ fontWeight: 900, fontSize: 12 }}>
              {formatRupiah(record.price_per_m2)}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 650,
                fontSize: 11.5,
              }}
            >
              {priceTypeLabel[record.price_type] || "-"}
            </Typography>
          </Stack>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 170,
        filters: Object.entries(statusMeta).map(([value, meta]) => ({
          text: meta.label,
          value,
        })),
        onFilter: createExactFilter("status"),
        render: (value) => (
          <Tag
            color={statusMeta[value]?.color || "default"}
            style={{
              borderRadius: 8,
              fontFamily: "Poppins",
              fontWeight: 850,
              padding: "3px 10px",
            }}
          >
            {statusMeta[value]?.label || "-"}
          </Tag>
        ),
      },
      {
        title: "Catatan",
        dataIndex: "notes",
        width: 150,
        render: (_, record) => (
          <Button
            size="small"
            variant={record.notes ? "outlined" : "contained"}
            color={record.notes ? "warning" : "inherit"}
            onClick={() => openNotesModal(record)}
            startIcon={<Icon icon="solar:notes-bold-duotone" />}
            sx={{
              borderRadius: 2,
              fontWeight: 800,
              textTransform: "none",
              whiteSpace: "nowrap",
              ...(record.notes
                ? {}
                : {
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
        ),
      },
      {
        title: "Diperbarui",
        dataIndex: "updated_at",
        width: 190,
        render: (value) => (
          <Typography sx={{ fontWeight: 650, fontSize: 12 }}>
            {formatDateTime(value)}
          </Typography>
        ),
      },
      {
        title: "Aksi",
        key: "action",
        width: ACTION_COLUMN_WIDTH,
        align: "center",
        fixed: "right",
        className: "rooms-action-column",
        onHeaderCell: () => ({ className: "rooms-action-column" }),
        onCell: () => ({ className: "rooms-action-column" }),
        render: (_, record) => (
          <Box
            className="rooms-action-buttons"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              width: "100%",
              minWidth: 82,
              flexWrap: "nowrap",
            }}
          >
            <TableActionButton
              title="Ubah ruangan"
              color="info"
              icon="solar:pen-bold-duotone"
              onClick={() => openEditModal(record)}
            />
            <TableActionButton
              title="Hapus ruangan"
              color="error"
              icon="solar:trash-bin-trash-bold-duotone"
              onClick={() => openDeleteModal(record)}
            />
          </Box>
        ),
      },
    ],
    [rooms, theme],
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
              label: "Ruangan",
              value: "rooms",
              icon: "solar:home-angle-bold-duotone",
              path: "/rooms",
            },
          ]}
          title="Ruangan"
          description="Kelola ruangan per lokasi dan lantai, termasuk dimensi, harga sewa, status ketersediaan, dan catatan operasional."
          icon="solar:home-angle-bold-duotone"
          actionSx={{
            width: { xs: "100%", md: "auto" },
            display: "flex",
            justifyContent: { xs: "stretch", md: "flex-end" },
          }}
          action={
            <Button
              fullWidth
              variant="contained"
              startIcon={<Icon icon="solar:home-add-angle-bold-duotone" />}
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
              Tambah Ruangan
            </Button>
          }
        />

        <Grid container spacing={{ xs: 1.25, md: 1.5 }}>
          {roomStats.map((item) => (
            <Grid key={item.label} size={{ xs: 6, md: 3 }}>
              <SummaryStatCard {...item} />
            </Grid>
          ))}
        </Grid>

        <DataTableShell
          title="Daftar Ruangan"
          description={`${filteredRooms.length} dari ${rooms.length} ruangan ditampilkan`}
          searchValue={searchText}
          searchPlaceholder="Cari ruangan, lokasi, lantai, status, atau catatan..."
          onSearchChange={setSearchText}
        >
          <ReusableAntTable
            columns={columns}
            dataSource={filteredRooms}
            loading={loading}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            tableLayout="fixed"
            scroll={{ x: TABLE_SCROLL_WIDTH, y: 430 }}
            onPageSizeChange={setPageSize}
            fixedActionColumn={{
              className: "rooms-action-column",
              buttonsClassName: "rooms-action-buttons",
              width: ACTION_COLUMN_WIDTH,
              paddingX: 14,
            }}
          />
        </DataTableShell>
      </Stack>

      <RoomFormModal
        open={formOpen}
        mode={formMode}
        initialData={selectedRoom}
        locations={locations}
        loading={loading}
        onClose={closeFormModal}
        onSubmit={handleSaveRoom}
        onNotify={setSnackbar}
      />

      <CrudConfirmModal
        open={deleteOpen}
        title="Hapus Ruangan"
        description={
          <>
            Ruangan{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedRoom?.room_number || "-"}
            </Box>{" "}
            pada lokasi{" "}
            <Box
              component="strong"
              sx={{ color: "text.primary", fontWeight: 850 }}
            >
              {selectedRoom?.location_name || "-"}
            </Box>{" "}
            tidak dapat digunakan lagi setelah dihapus.
          </>
        }
        titleDescription="Form untuk menghapus data ruangan."
        confirmLabel="Hapus Ruangan"
        loadingLabel="Menghapus..."
        loading={loading}
        onClose={() => !loading && setDeleteOpen(false)}
        onConfirm={handleDeleteRoom}
      />

      <RoomNotesModal
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        selectedData={selectedRoom}
      />

      <LoadingBackdrop
        message="Loading..."
        open={loading && !formOpen && !deleteOpen}
      />
      <Notification
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      />
    </Box>
  );
}
