"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
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
import "moment/locale/id";

moment.locale("id");

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
  children,
  primaryFilters,
  showDateRangeFilters = true,
  range,
  selectedPreset,
  onPresetChange,
  onRangeChange,
  onApply,
  isSubmitting,
  title = "Filter Laporan",
  description = "Tentukan periode sebelum menampilkan atau mengekspor laporan.",
  icon = "solar:tuning-2-bold-duotone",
  rangeLabelTitle = "Custom Range Tanggal",
  quickFilterLabel = "Filter Cepat",
  quickFilters = QUICK_FILTERS,
  applyLabel = "Cari Data",
  submittingLabel = "Memuat",
  resetLabel = "Reset Filter",
  onReset,
  isResetting = false,
  maxDate = new Date(),
  minDate,
  setCustomPresetOnRangeOpen = true,
  resetPickerToTodayOnOpen = false,
}) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [draftRange, setDraftRange] = useState(range);
  const isCustomActive = selectedPreset === "custom";
  const disableActions = Boolean(isSubmitting || isResetting);
  const safeRange = range || {
    startDate: moment().format("YYYY-MM-DD"),
    endDate: moment().format("YYYY-MM-DD"),
  };

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
        endDate: draftRange?.endDate
          ? moment(draftRange.endDate).toDate()
          : new Date(),
        key: "selection",
      },
    ],
    [draftRange?.startDate, draftRange?.endDate],
  );

  const rangeLabel = `${moment(safeRange.startDate).format("DD MMM YYYY")} - ${moment(
    safeRange.endDate,
  ).format("DD MMM YYYY")}`;

  const handleCustomClick = () => {
    const today = moment().format("YYYY-MM-DD");
    const todayRange = { startDate: today, endDate: today };

    if (setCustomPresetOnRangeOpen) {
      onPresetChange?.("custom");
    }

    if (resetPickerToTodayOnOpen) {
      setDraftRange(todayRange);
    } else if (setCustomPresetOnRangeOpen && selectedPreset !== "custom") {
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
      <Stack spacing={{ xs: 2.25, sm: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
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
            <Icon icon={icon} fontSize={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
              {title}
            </Typography>
            <Typography
              sx={{
                color: theme.ui.mutedText,
                fontWeight: 600,
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            height: 1,
            bgcolor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.58 : 0.38,
            ),
          }}
        />

        <Stack spacing={{ xs: 2.25, sm: 2 }}>
          {showDateRangeFilters && (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: primaryFilters
                    ? {
                        xs: "1fr",
                        md: "minmax(240px, max-content) minmax(0, 1fr)",
                      }
                    : "1fr",
                  columnGap: { xs: 0, md: 1.5 },
                  rowGap: { xs: 2.25, sm: 2 },
                  alignItems: "end",
                }}
              >
                <Stack spacing={{ xs: 1.25, sm: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                    {rangeLabelTitle}
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
                      justifyContent: { xs: "center", sm: "flex-start" },
                      color: isCustomActive
                        ? theme.palette.primary.contrastText
                        : theme.palette.primary.main,
                    }}
                  >
                    {rangeLabel}
                  </Button>
                </Stack>

                {primaryFilters && (
                  <Box sx={{ width: "100%", minWidth: 0 }}>{primaryFilters}</Box>
                )}
              </Box>

              <Stack spacing={{ xs: 1.5, sm: 1.25 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                  {quickFilterLabel}
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
                  {quickFilters.map((preset) => {
                    const isActive = selectedPreset === preset.key;

                    return (
                      <Button
                        key={preset.key}
                        size="small"
                        variant={isActive ? "contained" : "outlined"}
                        onClick={() => onPresetChange?.(preset.key)}
                        sx={{
                          minHeight: 34,
                          borderRadius: 2,
                          px: 1.5,
                          fontWeight: 700,
                          gap: preset.count !== undefined ? 0.75 : 0,
                        }}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </Stack>
              </Stack>
            </>
          )}

          {children}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1.75, sm: 1 }}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ pt: { xs: 1, sm: 1.25 } }}
          >
            {onReset && (
              <Button
                variant="contained"
                onClick={onReset}
                disabled={disableActions}
                startIcon={
                  <Icon
                    icon={
                      isResetting
                        ? "svg-spinners:180-ring-with-bg"
                        : "solar:restart-bold-duotone"
                    }
                  />
                }
                sx={{
                  minHeight: 40,
                  borderRadius: 2,
                  px: 2,
                  fontWeight: 700,
                  width: { xs: "100%", sm: 160 },
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.14)
                      : alpha(theme.palette.text.primary, 0.1),
                  color: theme.palette.text.primary,
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.common.white, 0.2)
                        : alpha(theme.palette.text.primary, 0.16),
                    boxShadow: "none",
                  },
                }}
              >
                {isResetting ? "Mereset" : resetLabel}
              </Button>
            )}
            <Button
              variant="contained"
              onClick={onApply}
              disabled={disableActions}
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
                width: { xs: "100%", sm: 160 },
              }}
            >
              {isSubmitting ? submittingLabel : applyLabel}
            </Button>
          </Stack>
        </Stack>
      </Stack>

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
            bgcolor:
              theme.palette.mode === "dark"
                ? "#1C1C1C"
                : theme.palette.background.default,
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
            bgcolor:
              theme.palette.mode === "dark"
                ? "#1C1C1C"
                : theme.palette.background.default,
            "& .rdrDateRangePickerWrapper": {
              width: "100%",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
            },
            "& .rdrDateRangeWrapper": {
              width: "100%",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
            },
            "& .rdrDefinedRangesWrapper": { display: "none" },
            "& .rdrMonths": {
              flexDirection: "column",
              width: "100%",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
              gap: 0,
            },
            "& .rdrMonthsVertical": {
              width: "100%",
            },
            "& .rdrMonth": {
              width: "100% !important",
              px: { xs: 0.5, sm: 1 },
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
            },
            "& .rdrCalendarWrapper": {
              width: "100%",
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#1C1C1C"
                  : theme.palette.background.default,
              color: theme.palette.text.primary,
            },
            "& .rdrWeekDays, & .rdrDays": {
              width: "100%",
            },
            "& .rdrMonthAndYearWrapper": {
              px: 1,
            },
            "& .rdrMonthAndYearPickers select": {
              bgcolor:
                theme.palette.mode === "dark"
                  ? "#242424"
                  : theme.palette.background.default,
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
            "& .rdrDayNumber": {
              zIndex: 2,
            },
            "& .rdrDayPassive .rdrDayNumber span, & .rdrDayDisabled .rdrDayNumber span":
              {
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(17,24,39,0.28)",
              },
            "& .rdrDayToday .rdrDayNumber span:after": {
              bgcolor: theme.palette.primary.main,
            },
            "& .rdrSelected, & .rdrInRange, & .rdrStartEdge, & .rdrEndEdge": {
              bgcolor: `${theme.palette.primary.main} !important`,
              color: `${theme.palette.primary.contrastText} !important`,
            },
            "& .rdrDayStartPreview, & .rdrDayInPreview, & .rdrDayEndPreview": {
              bgcolor: `${alpha(theme.palette.primary.main, 0.22)} !important`,
              borderColor: `${alpha(theme.palette.primary.main, 0.45)} !important`,
            },
            /**
             * react-date-range menaruh bar selection sebagai sibling sebelum
             * angka tanggal. Selector ini memastikan angka tetap kontras saat
             * user drag range atau hover di atas warna primary.
             */
            "& .rdrDay .rdrSelected ~ .rdrDayNumber span, & .rdrDay .rdrInRange ~ .rdrDayNumber span, & .rdrDay .rdrStartEdge ~ .rdrDayNumber span, & .rdrDay .rdrEndEdge ~ .rdrDayNumber span":
              {
                color: `${theme.palette.primary.contrastText} !important`,
                fontWeight: 700,
              },
            "& .rdrDay:has(.rdrSelected) .rdrDayNumber span, & .rdrDay:has(.rdrInRange) .rdrDayNumber span, & .rdrDay:has(.rdrStartEdge) .rdrDayNumber span, & .rdrDay:has(.rdrEndEdge) .rdrDayNumber span":
              {
                color: "#FFFFFF !important",
                fontWeight: 700,
              },
            "& .rdrDay:hover .rdrDayNumber span": {
              color:
                theme.palette.mode === "dark"
                  ? "#FFFFFF !important"
                  : `${theme.palette.text.primary} !important`,
            },
            "& .rdrDay:hover .rdrSelected ~ .rdrDayNumber span, & .rdrDay:hover .rdrInRange ~ .rdrDayNumber span, & .rdrDay:hover .rdrStartEdge ~ .rdrDayNumber span, & .rdrDay:hover .rdrEndEdge ~ .rdrDayNumber span":
              {
                color: `${theme.palette.primary.contrastText} !important`,
              },
            "& .rdrDay:hover:has(.rdrSelected) .rdrDayNumber span, & .rdrDay:hover:has(.rdrInRange) .rdrDayNumber span, & .rdrDay:hover:has(.rdrStartEdge) .rdrDayNumber span, & .rdrDay:hover:has(.rdrEndEdge) .rdrDayNumber span":
              {
                color: "#FFFFFF !important",
              },
            "& .rdrDayStartOfMonth .rdrInRange, & .rdrDayStartOfMonth .rdrEndEdge, & .rdrDayStartOfWeek .rdrInRange, & .rdrDayStartOfWeek .rdrEndEdge":
              {
                borderTopLeftRadius: 999,
                borderBottomLeftRadius: 999,
              },
            "& .rdrDayEndOfMonth .rdrInRange, & .rdrDayEndOfMonth .rdrStartEdge, & .rdrDayEndOfWeek .rdrInRange, & .rdrDayEndOfWeek .rdrStartEdge":
              {
                borderTopRightRadius: 999,
                borderBottomRightRadius: 999,
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
            maxDate={maxDate}
            minDate={minDate}
          />
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor:
              theme.palette.mode === "dark"
                ? "#1C1C1C"
                : theme.palette.background.default,
          }}
        >
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDatePicker(false)}
              sx={{ minHeight: 40, borderRadius: 2, fontWeight: 700 }}
            >
              Pilih Tanggal
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDatePicker(false)}
              sx={{
                minHeight: 40,
                borderRadius: 2,
                fontWeight: 700,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.common.white, 0.14)
                    : alpha(theme.palette.text.primary, 0.1),
                color: theme.palette.text.primary,
                boxShadow: "none",
                "&:hover": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? alpha(theme.palette.common.white, 0.2)
                      : alpha(theme.palette.text.primary, 0.16),
                  boxShadow: "none",
                },
              }}
            >
              Batal
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
