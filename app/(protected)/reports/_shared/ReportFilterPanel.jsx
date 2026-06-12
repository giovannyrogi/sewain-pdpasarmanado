"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Icon } from "@iconify/react";
import { DateRangePicker } from "react-date-range";
import { id } from "date-fns/locale";
import moment from "moment";

const QUICK_FILTERS = [
  { key: "month", label: "Bulan Ini" },
  { key: "two_month", label: "2 Bulan Terakhir" },
  { key: "week", label: "1 Minggu Terakhir" },
  { key: "two_week", label: "2 Minggu Terakhir" },
];

/**
 * Panel filter laporan reusable.
 *
 * Flow sengaja mengikuti pola lama:
 * - Klik Custom Range membuka date range picker dan menonaktifkan pilihan cepat.
 * - Klik Filter Cepat mengisi range otomatis dan membuat custom range tidak aktif.
 * - Tombol Cari Data baru menjalankan request agar user bisa mengatur periode dulu.
 */
export default function ReportFilterPanel({
  range,
  selectedPreset,
  onPresetChange,
  onRangeChange,
  onApply,
  isSubmitting,
  exportDisabled,
  onExportExcel,
  onExportPDF,
}) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [draftRange, setDraftRange] = useState(range);
  const openMenu = Boolean(anchorEl);
  const isCustomActive = selectedPreset === "custom";

  /**
   * Draft range dipisah dari parent state agar kalender selalu membuka nilai
   * terbaru secara stabil. Tanpa draft lokal, dialog bisa sempat memakai range
   * quick filter lama pada render pertama ketika user pindah ke Custom.
   */
  useEffect(() => {
    setDraftRange(range);
  }, [range]);

  const calendarRange = useMemo(
    () => [
      {
        startDate: draftRange?.startDate
          ? moment(draftRange.startDate).toDate()
          : new Date(),
        endDate: draftRange?.endDate ? moment(draftRange.endDate).toDate() : new Date(),
        key: "selection",
      },
    ],
    [draftRange?.startDate, draftRange?.endDate],
  );

  const rangeLabel = `${moment(range.startDate).format("DD MMM YYYY")} - ${moment(
    range.endDate,
  ).format("DD MMM YYYY")}`;

  const closeMenu = () => setAnchorEl(null);

  const handleExport = (callback) => {
    closeMenu();
    callback?.();
  };

  const handleCustomClick = () => {
    onPresetChange?.("custom");
    if (selectedPreset !== "custom") {
      const today = moment().format("YYYY-MM-DD");
      const todayRange = { startDate: today, endDate: today };
      setDraftRange(todayRange);
      onRangeChange?.(todayRange);
    } else {
      setDraftRange(range);
    }
    setOpenDatePicker(true);
  };

  const handleRangeChange = (item) => {
    const selected = item?.selection;
    if (!selected) return;

    const nextRange = {
      startDate: moment(selected.startDate).format("YYYY-MM-DD"),
      endDate: moment(selected.endDate).format("YYYY-MM-DD"),
    };

    setDraftRange(nextRange);
    onRangeChange?.(nextRange);
  };

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${theme.ui.dashboardCardBorder}`,
        bgcolor: theme.ui.dashboardCardBg,
        boxShadow: theme.ui.dashboardCardShadow,
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              flex: "0 0 auto",
            }}
          >
            <Icon icon="solar:tuning-2-bold-duotone" fontSize={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              Filter Laporan
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 600,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Tentukan periode sebelum menampilkan atau mengekspor laporan.
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            height: 1,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.45 : 0.35),
          }}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "minmax(260px, 330px) 1fr" },
            gap: { xs: 2, lg: 3 },
            alignItems: "start",
          }}
        >
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              Custom Range Tanggal
            </Typography>
            <Button
              fullWidth={isSmall}
              variant={isCustomActive ? "contained" : "outlined"}
              onClick={handleCustomClick}
              startIcon={<Icon icon="solar:calendar-date-bold-duotone" />}
              sx={{
                width: { xs: "100%", sm: "fit-content" },
                maxWidth: "100%",
                minHeight: 38,
                borderRadius: 2,
                px: 1.5,
                fontWeight: 700,
                justifyContent: "flex-start",
                color: isCustomActive ? theme.palette.primary.contrastText : theme.palette.primary.main,
              }}
            >
              {rangeLabel}
            </Button>
          </Stack>

          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
              Filter Cepat
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: "wrap",
                rowGap: 1,
                "& > *": {
                  flex: { xs: "1 1 calc(50% - 8px)", sm: "0 0 auto" },
                },
              }}
            >
              {QUICK_FILTERS.map((preset) => (
                <Button
                  key={preset.key}
                  size="small"
                  variant={selectedPreset === preset.key ? "contained" : "outlined"}
                  onClick={() => onPresetChange?.(preset.key)}
                  sx={{
                    minHeight: 34,
                    borderRadius: 2,
                    px: 1.5,
                    fontWeight: 700,
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </Stack>

            <Stack
              spacing={1}
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              sx={{ pt: 0.5 }}
            >
              <Button
                variant="contained"
                onClick={onApply}
                disabled={isSubmitting}
                startIcon={
                  <Icon
                    icon={
                      isSubmitting
                        ? "svg-spinners:180-ring-with-bg"
                        : "solar:magnifer-bold-duotone"
                    }
                  />
                }
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 700,
                  boxShadow: theme.ui.buttonShadow,
                  width: { xs: "100%", sm: 150 },
                }}
              >
                {isSubmitting ? "Memuat" : "Cari Data"}
              </Button>

              <Button
                variant="outlined"
                disabled={exportDisabled}
                onClick={(event) => setAnchorEl(event.currentTarget)}
                startIcon={<Icon icon="solar:export-bold-duotone" />}
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 700,
                  width: { xs: "100%", sm: 150 },
                }}
              >
                Export
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={closeMenu}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 190,
            borderRadius: 2,
            bgcolor: theme.ui.menuPaperBg,
            border: `1px solid ${theme.ui.dashboardCardBorder}`,
          },
        }}
      >
        <MenuItem onClick={() => handleExport(onExportExcel)}>
          <Icon icon="vscode-icons:file-type-excel" fontSize={20} />
          <Typography sx={{ ml: 1, fontWeight: 700 }}>Export Excel</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleExport(onExportPDF)}>
          <Icon icon="vscode-icons:file-type-pdf2" fontSize={20} />
          <Typography sx={{ ml: 1, fontWeight: 700 }}>Export PDF</Typography>
        </MenuItem>
      </Menu>

      <Dialog
        open={openDatePicker}
        onClose={() => setOpenDatePicker(false)}
        maxWidth="xs"
        fullWidth
        BackdropProps={{ style: { backdropFilter: "blur(5px)" } }}
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
            width: { xs: "calc(100vw - 28px)", sm: 420 },
            maxWidth: "calc(100vw - 28px)",
          },
        }}
      >
        <DialogContent
          sx={{
            p: { xs: 1, sm: 1.25 },
            display: "flex",
            justifyContent: "center",
            bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
            "& .rdrDateRangePickerWrapper": {
              width: "100%",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
            },
            "& .rdrDateRangeWrapper": {
              width: "100%",
              bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
            },
            "& .rdrDefinedRangesWrapper": { display: "none" },
            "& .rdrMonths": {
              flexDirection: "column",
              width: "100%",
              bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
              gap: 0,
            },
            "& .rdrMonthsVertical": {
              width: "100%",
            },
            "& .rdrMonth": {
              width: "100% !important",
              px: { xs: 0.5, sm: 1 },
              bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
            },
            "& .rdrCalendarWrapper": {
              width: "100%",
              bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
              color: theme.palette.text.primary,
            },
            "& .rdrWeekDays, & .rdrDays": {
              width: "100%",
            },
            "& .rdrMonthAndYearWrapper": {
              px: 1,
            },
            "& .rdrMonthAndYearPickers select": {
              bgcolor: theme.palette.mode === "dark" ? "#242424" : theme.palette.background.default,
              color: theme.palette.text.primary,
              border: `1px solid ${theme.ui.dashboardCardBorder}`,
              borderRadius: 1,
            },
            "& .rdrDay, & .rdrDayPassive, & .rdrDayDisabled": {
              bgcolor: "transparent !important",
            },
            "& .rdrDayDisabled": {
              opacity: 0.35,
              cursor: "not-allowed",
            },
            "& .rdrDayNumber span": {
              color: theme.palette.text.primary,
              fontWeight: 700,
            },
            "& .rdrDayPassive .rdrDayNumber span, & .rdrDayDisabled .rdrDayNumber span": {
              color:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.22)"
                  : "rgba(17,24,39,0.28)",
            },
            "& .rdrDayToday .rdrDayNumber span:after": {
              bgcolor: theme.palette.primary.main,
            },
            "& .rdrInRange, & .rdrStartEdge, & .rdrEndEdge, & .rdrDayStartPreview, & .rdrDayInPreview, & .rdrDayEndPreview": {
              bgcolor: `${theme.palette.primary.main} !important`,
              color: `${theme.palette.primary.contrastText} !important`,
            },
            "& .rdrDayStartOfMonth .rdrInRange, & .rdrDayStartOfMonth .rdrEndEdge, & .rdrDayStartOfWeek .rdrInRange, & .rdrDayStartOfWeek .rdrEndEdge": {
              borderTopLeftRadius: 999,
              borderBottomLeftRadius: 999,
            },
            "& .rdrDayEndOfMonth .rdrInRange, & .rdrDayEndOfMonth .rdrStartEdge, & .rdrDayEndOfWeek .rdrInRange, & .rdrDayEndOfWeek .rdrStartEdge": {
              borderTopRightRadius: 999,
              borderBottomRightRadius: 999,
            },
            "& .rdrDayStartPreview, & .rdrDayInPreview, & .rdrDayEndPreview": {
              borderColor: `${alpha(theme.palette.primary.main, 0.42)} !important`,
            },
          }}
        >
          <DateRangePicker
            onChange={handleRangeChange}
            moveRangeOnFirstSelection={false}
            months={isSmall ? 1 : 2}
            direction="vertical"
            showDateDisplay={false}
            ranges={calendarRange}
            rangeColors={[theme.palette.primary.main]}
            locale={id}
            maxDate={new Date()}
          />
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor: theme.palette.mode === "dark" ? "#1C1C1C" : theme.palette.background.default,
          }}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={() => setOpenDatePicker(false)}
            sx={{ minHeight: 40, borderRadius: 2, fontWeight: 700 }}
          >
            Pilih Tanggal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
