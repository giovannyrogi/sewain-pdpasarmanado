"use client";

/**
 * Helper ini menyatukan bentuk data payments yang nested dengan bentuk data
 * detail tenant yang dipakai modal lintas menu. Dengan begitu page payments
 * tidak perlu punya adapter modal terpisah hanya untuk merapikan struktur data.
 */
export const getPaymentLabel = (record) => {
  const paymentType = record?.tenant_application?.payment_type;
  const paymentNumber = Number(record?.payments?.payment_number || 1);

  if (paymentType === "lunas") return "Pelunasan";
  if (paymentNumber === 1) return "Uang Muka (DP)";
  return `Cicilan ${paymentNumber - 1}`;
};

export const normalizePaymentForLeaseDetail = (selectedData) => {
  if (!selectedData) return null;

  const tenant = selectedData.tenant_application || {};
  const room = selectedData.room || {};
  const location = selectedData.location || {};
  const payment = selectedData.payments || {};

  return {
    ...tenant,
    ...room,
    ...location,
    status: payment.approval_status,
    approval_status: payment.approval_status,
    tenant_name: tenant.tenant_name,
    tenant_nik: tenant.tenant_nik,
    tenant_phone: tenant.tenant_phone,
    ktp_file_path: tenant.ktp_file_path,
    location_name: location.location_name,
    room_number: room.room_number,
    floor: room.floor,
    room_length: room.room_length,
    room_width: room.room_width,
    room_area: room.room_area,
    price_per_m2: room.price_per_m2,
    created_at: tenant.created_at,
  };
};

export const buildPaymentContext = (selectedData) => {
  if (!selectedData?.payments) return null;

  return {
    ...selectedData.payments,
    payment_label: getPaymentLabel(selectedData),
  };
};
