import moment from "moment";
import { parsePositiveInteger } from "@/app/utils/apiValidation";
import {
  calculateLeaseEndDate,
  normalizeLeaseDurationYears,
} from "@/app/utils/calculateRoomRent";
import {
  LAND_PERMIT_COMMODITY_OPTIONS,
  isValidLandPermitCommodity,
} from "@/app/utils/landPermitCommodityOptions";

const APPLICATION_TYPES = ["baru", "perpanjangan"];
const ADMINISTRATION_TYPES = ["kip", "kkip"];

const getRequiredId = (body, key, label) =>
  parsePositiveInteger(body?.[key], label);

export const validateLandPermitApplicationPayload = (
  body,
  { mode = "create" } = {},
) => {
  const applicationType = String(body?.application_type || "baru").trim();
  if (!APPLICATION_TYPES.includes(applicationType)) {
    return { values: null, error: "Jenis permohonan tidak valid." };
  }

  const ids = [
    ["tenant_identity_id", "ID identitas"],
    ["location_id", "ID lokasi"],
    ["sector_id", "ID sektor"],
    ["stall_id", "ID lahan"],
  ];

  const values = { application_type: applicationType };

  for (const [key, label] of ids) {
    const parsed = getRequiredId(body, key, label);
    if (parsed.error) return { values: null, error: parsed.error };
    values[key] = parsed.value;
  }

  if (applicationType === "perpanjangan") {
    const renewal = getRequiredId(body, "renewal_of", "ID permohonan lama");
    if (renewal.error) return { values: null, error: renewal.error };
    values.renewal_of = renewal.value;
  } else {
    values.renewal_of = null;
  }

  const commodity = String(body?.commodity_type || "").trim();
  if (!isValidLandPermitCommodity(commodity)) {
    return {
      values: null,
      error: `Jenis dagangan harus salah satu dari: ${LAND_PERMIT_COMMODITY_OPTIONS.join(", ")}.`,
    };
  }
  values.commodity_type = commodity;

  const startDate = moment(body?.start_date);
  if (!startDate.isValid()) {
    return { values: null, error: "Tanggal mulai izin tidak valid." };
  }

  const durationYears = normalizeLeaseDurationYears(body?.lease_duration_years);
  const calculatedEndDate = calculateLeaseEndDate(
    startDate.toDate(),
    durationYears,
  );
  if (!calculatedEndDate?.isValid()) {
    return { values: null, error: "Tanggal akhir izin tidak valid." };
  }

  values.start_date = startDate.format("YYYY-MM-DD");
  values.end_date = calculatedEndDate.format("YYYY-MM-DD");
  values.lease_duration_years = durationYears;
  values.administration_type = String(body?.administration_type || "").trim();
  if (!ADMINISTRATION_TYPES.includes(values.administration_type)) {
    return { values: null, error: "Jenis administrasi tidak valid." };
  }

  if (mode === "edit") {
    values.tenant_identity_id = Number(body?.tenant_identity_id);
  }

  return { values, error: null };
};
