"use client";

import moment from "moment";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";
import formatRupiah from "@/app/components/formatrupiah/page";
import { numberToWords } from "@/app/utils/numberToWords";

const ROMAN_MONTHS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const safeMoment = (value) => {
  const date = moment(value);
  return value && date.isValid() ? date : null;
};

const dateParts = (value) => {
  const date = safeMoment(value);

  if (!date) {
    return {
      dayName: "-",
      dayNumber: "-",
      dayInWords: "-",
      monthName: "-",
      yearNumber: "-",
      yearInWords: "-",
    };
  }

  const dayNumber = Number(date.format("D"));
  const yearNumber = Number(date.format("YYYY"));

  return {
    dayName: date.format("dddd"),
    dayNumber,
    dayInWords: numberToWords(dayNumber),
    monthName: date.format("MMMM"),
    yearNumber,
    yearInWords: numberToWords(yearNumber),
  };
};

const getContractNumberOnly = (contractNumber) =>
  String(contractNumber || "-").split("/")[0].trim();

/**
 * Menyiapkan payload template DOCX kontrak dari data API.
 * Helper ini memusatkan mapping field agar halaman contracts tidak lagi penuh
 * dengan detail format tanggal, terbilang, dan nominal.
 */
const buildContractTemplateData = (record) => {
  const contract = record?.contracts || {};
  const tenant = record?.tenant_identities || {};
  const application = record?.tenant_application || {};
  const room = record?.rooms || {};
  const location = record?.locations || {};

  const contractDate = dateParts(contract.contract_date);
  const birthDate = dateParts(tenant.birth_date);
  const startDate = dateParts(application.start_date);
  const endDate = dateParts(application.end_date);
  const now = moment();

  const startMoment = safeMoment(application.start_date);
  const endMoment = safeMoment(application.end_date);
  const leaseDurationYears =
    Number(application.lease_duration_years) > 0
      ? Number(application.lease_duration_years)
      : startMoment && endMoment
        ? endMoment.diff(startMoment, "years") || 1
        : 1;

  const contractRoomTotal = Number(application.total_payment_room || 0);
  const totalPpn = Number(application.total_ppn || 0);
  const adminFee = Number(application.admin_fee || 0);

  return {
    day_name: contractDate.dayName,
    day_number: contractDate.dayNumber,
    day_in_words: contractDate.dayInWords,
    month_name: contractDate.monthName,
    year_number: contractDate.yearNumber,
    year_in_words: contractDate.yearInWords,
    tenant_name: tenant.full_name ? tenant.full_name.toUpperCase() : "-",
    room_number: room.room_number || "-",
    location_name: location.location_name || "-",
    currentYear: now.format("YYYY"),
    monthInRomawi: ROMAN_MONTHS[now.month()],
    contract_number: contract.contract_number || "-",
    contract_number_only: getContractNumberOnly(contract.contract_number),
    location_code: location.location_code || "-",
    floor: room.floor || "-",
    birth_place: tenant.birth_place || "-",
    birth_date: `${birthDate.dayNumber} (${birthDate.dayInWords}) ${birthDate.monthName} ${birthDate.yearNumber} (${birthDate.yearInWords})`,
    nik: tenant.nik || "-",
    occupation: tenant.occupation || "-",
    religion: tenant.religion || "-",
    nationality:
      tenant.nationality === "WNI"
        ? "Warga Negara Indonesia"
        : tenant.nationality || "-",
    street_address: tenant.street_address || "-",
    rt: tenant.rt || "-",
    rw: tenant.rw || "-",
    city: tenant.city || "-",
    province: location.province || tenant.province || "-",
    kelurahan: location.kelurahan || tenant.kelurahan || "-",
    district: location.district || tenant.district || "-",
    location_city: location.city || "-",
    room_width: room.room_width || "-",
    room_length: room.room_length || "-",
    room_area: room.room_area || "-",
    startDateDayNumber: startDate.dayNumber,
    startDateInWords: startDate.dayInWords,
    startDateMonthName: startDate.monthName,
    startDateYearNumber: startDate.yearNumber,
    startDateYearInWords: startDate.yearInWords,
    endDateDayNumber: endDate.dayNumber,
    endDateInWords: endDate.dayInWords,
    endDateMonthName: endDate.monthName,
    endDateYearNumber: endDate.yearNumber,
    endDateYearInWords: endDate.yearInWords,
    masaBerlaku: leaseDurationYears,
    masaBerlakuInWords: numberToWords(leaseDurationYears),
    totalPayment: formatRupiah(contractRoomTotal),
    totalPaymentInWords: numberToWords(contractRoomTotal),
    totalPPN: formatRupiah(totalPpn),
    totalPPNInWords: numberToWords(totalPpn),
    biayaAdministrasi: formatRupiah(adminFee),
    biayaAdministrasiInWords: numberToWords(adminFee),
    thisYear: now.format("YYYY"),
  };
};

/**
 * Generate dan download file DOCX kontrak dari template public.
 * Fungsi ini hanya dipakai di client karena memakai fetch template dan file-saver.
 */
export const generateContractDocument = async (record) => {
  const response = await fetch("/documents/contract-template.docx");
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();

  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(buildContractTemplateData(record));

  const out = doc.getZip().generate({
    type: "blob",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const tenantName = record?.tenant_identities?.full_name || "Tenant";
  const locationName = record?.locations?.location_name || "Lokasi";
  const roomNumber = record?.rooms?.room_number || "Ruangan";

  saveAs(out, `Contract_${tenantName}_${locationName}_${roomNumber}.docx`);
};
