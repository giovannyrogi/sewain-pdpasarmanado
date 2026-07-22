import moment from "moment";
import formatRupiah from "@/app/components/formatrupiah/page";

export const APPLICATION_TYPE_LABEL = {
  baru: "Permohonan Baru",
  perpanjangan: "Perpanjang",
};

export const APPROVAL_STATUS_LABEL = {
  proses: "Dalam Proses",
  approved: "Disetujui",
  rejected: "Ditolak",
};

export const formatDateDisplay = (value) =>
  value && moment(value).isValid() ? moment(value).format("DD MMMM YYYY") : "-";

export const calculateLandPermitCost = (stall, durationYears = 1, administrationType) => {
  const length = Number(stall?.stall_length || 0);
  const width = Number(stall?.stall_width || 0);
  const area = Number(stall?.stall_area || length * width || 0);
  const price = Number(stall?.price_per_m2 || 0);
  const duration = Number(durationYears) > 0 ? Number(durationYears) : 1;
  const annualRent = area * price;
  const adminFee = administrationType === "kip" ? 100000 * duration : 150000 * duration;
  const totalPayment = annualRent * duration + adminFee;

  return {
    area,
    annualRent,
    totalPaymentLand: totalPayment,
    totalPayment,
    formattedAnnualRent: formatRupiah(annualRent),
    formattedTotalPayment: formatRupiah(totalPayment),
  };
};

export const normalizeLandPermitSearch = (value) =>
  String(value || "").toLowerCase();

export const buildLandPermitStats = (data, theme) => {
  const process = data.filter(
    (item) => item.approval_status === "proses",
  ).length;
  const approved = data.filter(
    (item) => item.approval_status === "approved",
  ).length;
  const rejected = data.filter(
    (item) => item.approval_status === "rejected",
  ).length;

  return [
    {
      label: "Total Permohonan",
      value: data.length,
      icon: "solar:document-text-bold-duotone",
      color: theme.palette.primary.main,
    },
    {
      label: "Dalam Proses",
      value: process,
      icon: "solar:hourglass-line-bold-duotone",
      color: theme.palette.warning.main,
    },
    {
      label: "Disetujui",
      value: approved,
      icon: "solar:verified-check-bold-duotone",
      color: theme.palette.success.main,
    },
    {
      label: "Ditolak",
      value: rejected,
      icon: "solar:close-circle-bold-duotone",
      color: theme.palette.error.main,
    },
  ];
};

export const filterLandPermitApplications = (data, searchText) => {
  const keyword = normalizeLandPermitSearch(searchText);
  if (!keyword) return data;

  return data.filter((item) =>
    [
      item.tenant_name,
      item.tenant_nik,
      item.commodity_type,
      item.location_name,
      item.sector_name,
      item.stall_number,
      item.approval_status,
      item.application_type,
    ].some((value) => normalizeLandPermitSearch(value).includes(keyword)),
  );
};
