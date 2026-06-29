import { Box, Typography } from "@mui/material";

export const formatNotificationTime = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const compactNumber = (value) => value?.split("/")?.[0]?.trim() || value || "-";

const getRoleUserLabel = (role, name) => {
  if (role && name) return `${role} (${name})`;
  return role || name || "-";
};

const getNotificationDetail = (notification) => {
  const metadata = notification?.metadata || {};

  return {
    documentNumber: compactNumber(
      metadata.documentNumber || metadata.document_number,
    ),
    contractNumber: compactNumber(
      metadata.contractNumber || metadata.contract_number,
    ),
    tenantName: metadata.tenantName || metadata.tenant_name || "-",
    roomNumber: metadata.roomNumber || metadata.room_number || "-",
    locationName: metadata.locationName || metadata.location_name || "-",
    paymentNumber: metadata.paymentNumber || metadata.payment_number,
    sectorName: metadata.sectorName || metadata.sector_name || "-",
    stallNumber: metadata.stallNumber || metadata.stall_number || "-",
    commodity: metadata.commodity || metadata.commodity_type || "-",
  };
};

const isLandPermitNotification = (notification) =>
  notification?.metadata?.module === "land_permit" ||
  String(notification?.entity_type || "").startsWith("land_permit");

const HighlightText = ({ children }) => (
  <Box component="strong" sx={{ color: "text.primary", fontWeight: 800 }}>
    {children}
  </Box>
);

const PaymentLabel = ({ paymentNumber }) => {
  if (!paymentNumber) return null;

  return (
    <>
      , <HighlightText>Pembayaran ke-{paymentNumber}</HighlightText>
    </>
  );
};

const ActorText = ({ action, role, name }) => {
  if (!role && !name) return null;

  return (
    <>
      {" "}
      {action}{" "}
      <HighlightText>{getRoleUserLabel(role, name)}</HighlightText>
    </>
  );
};

const BaseTenantInfo = ({ detail }) => (
  <>
    <HighlightText>Dokumen {detail.documentNumber}</HighlightText>{" "}
    atas nama <HighlightText>{detail.tenantName}</HighlightText>
    {detail.roomNumber !== "-" && (
      <>
        , <HighlightText>Ruangan {detail.roomNumber}</HighlightText>
      </>
    )}
    {detail.locationName !== "-" && (
      <>
        , <HighlightText>Lokasi {detail.locationName}</HighlightText>
      </>
    )}
  </>
);

const BaseLandPermitInfo = ({ detail }) => (
  <>
    Pemohon <HighlightText>{detail.tenantName}</HighlightText>
    {detail.locationName !== "-" && (
      <>
        {" "}
        di <HighlightText>{detail.locationName}</HighlightText>
      </>
    )}
    {detail.sectorName !== "-" && (
      <>
        {" "}
        sektor <HighlightText>{detail.sectorName}</HighlightText>
      </>
    )}
    {detail.stallNumber !== "-" && (
      <>
        , lahan <HighlightText>{detail.stallNumber}</HighlightText>
      </>
    )}
  </>
);

const NotificationActionText = ({ notification }) => {
  const metadata = notification?.metadata || {};

  switch (notification?.type) {
    case "tenant_application_created":
      return (
        <>
          Permohonan sewa baru masuk dan sedang menunggu approval dari{" "}
          <HighlightText>{metadata.waiting_role_label}</HighlightText>.
        </>
      );
    case "tenant_approval_waiting":
      return <>Silakan cek dan proses approval permohonan sewa.</>;
    case "tenant_approval_completed":
      return (
        <>
          Anda berhasil melakukan approval sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_approval_rejected_by_you":
      return (
        <>
          Anda berhasil menolak permohonan sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_approval_progress":
      return (
        <>
          Menunggu persetujuan{" "}
          <HighlightText>{metadata.waiting_role_label}</HighlightText>.
        </>
      );
    case "tenant_application_approved":
      return (
        <>
          Permohonan sewa sudah disetujui final oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_application_rejected":
      return (
        <>
          Permohonan sewa ditolak oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.rejected_by_role, metadata.rejected_by_name)}
          </HighlightText>
          . Tekan notifikasi ini untuk melihat alasan penolakan.
        </>
      );
    case "tenant_application_updated":
      return (
        <>
          Data permohonan telah diperbarui oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.updated_by_role, metadata.updated_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_application_deleted":
      return (
        <>
          Data permohonan telah dihapus oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.deleted_by_role, metadata.deleted_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_termination_created":
      return (
        <>
          Pengajuan nonaktif tenant baru sedang menunggu approval dari{" "}
          <HighlightText>{metadata.waiting_role_label}</HighlightText>.
        </>
      );
    case "tenant_termination_waiting":
      return <>Silakan cek dan proses approval nonaktif tenant.</>;
    case "tenant_termination_approval_completed":
      return (
        <>
          Anda berhasil melakukan approval nonaktif sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_termination_rejected_by_you":
      return (
        <>
          Anda berhasil menolak pengajuan nonaktif sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          .
        </>
      );
    case "tenant_termination_progress":
      return (
        <>
          Menunggu approval nonaktif dari{" "}
          <HighlightText>{metadata.waiting_role_label}</HighlightText>.
        </>
      );
    case "tenant_termination_approved":
      return (
        <>
          Nonaktif tenant disetujui final oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.approved_by_role, metadata.approved_by_name)}
          </HighlightText>
          . Ruangan sudah tersedia kembali.
        </>
      );
    case "tenant_termination_rejected":
      return (
        <>
          Pengajuan nonaktif tenant ditolak oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.rejected_by_role, metadata.rejected_by_name)}
          </HighlightText>
          . Tekan notifikasi ini untuk melihat alasan penolakan.
        </>
      );
    case "tenant_termination_deleted":
      return (
        <>
          Pengajuan nonaktif tenant telah dihapus oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.deleted_by_role, metadata.deleted_by_name)}
          </HighlightText>
          .
        </>
      );
    case "payment_submitted":
      return (
        <>
          Bukti pembayaran baru
          <ActorText
            action="dibuat oleh"
            role={metadata.submitted_by_role}
            name={metadata.submitted_by_name}
          />{" "}
          dan menunggu validasi bagian keuangan.
        </>
      );
    case "payment_updated":
      return (
        <>
          Bukti pembayaran diperbarui
          <ActorText
            action="oleh"
            role={metadata.updated_by_role}
            name={metadata.updated_by_name}
          />{" "}
          dan perlu divalidasi ulang.
        </>
      );
    case "payment_deleted":
      return (
        <>
          Bukti pembayaran telah dihapus
          <ActorText
            action="oleh"
            role={metadata.deleted_by_role}
            name={metadata.deleted_by_name}
          />
          .
        </>
      );
    case "payment_approved":
      return (
        <>
          Bukti pembayaran telah divalidasi
          <ActorText
            action="oleh"
            role={metadata.decided_by_role}
            name={metadata.decided_by_name}
          />
          .
        </>
      );
    case "payment_rejected":
      return (
        <>
          Bukti pembayaran ditolak
          <ActorText
            action="oleh"
            role={metadata.decided_by_role}
            name={metadata.decided_by_name}
          />
          . Tekan notifikasi ini untuk melihat alasan penolakan.
        </>
      );
    case "land_permit_approval_waiting":
      return <>Perlu dicek dan diproses sesuai giliran approval Anda.</>;
    case "land_permit_approval_completed":
      return (
        <>
          Anda sudah menyetujui sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(
              metadata.processed_by_role,
              metadata.processed_by_name,
            )}
          </HighlightText>
          .
        </>
      );
    case "land_permit_approval_rejected_by_you":
      return (
        <>
          Anda sudah menolak sebagai{" "}
          <HighlightText>
            {getRoleUserLabel(
              metadata.processed_by_role,
              metadata.processed_by_name,
            )}
          </HighlightText>
          .
        </>
      );
    case "land_permit_approval_progress":
      return (
        <>
          Disetujui oleh{" "}
          <HighlightText>
            {getRoleUserLabel(
              metadata.approved_by_role,
              metadata.approved_by_name,
            )}
          </HighlightText>
          . Menunggu{" "}
          <HighlightText>{metadata.waiting_role_label || "approval berikutnya"}</HighlightText>
          .
        </>
      );
    case "land_permit_application_approved":
      return (
        <>
          Persetujuan final selesai. Lanjutkan proses pembayaran dan dokumen
          izin lahan.
        </>
      );
    case "land_permit_application_rejected":
      return (
        <>
          Ditolak oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.rejected_by_role, metadata.rejected_by_name)}
          </HighlightText>
          . Tekan notifikasi ini untuk melihat alasan penolakan.
        </>
      );
    case "land_permit_payment_submitted":
      return <>Bukti pembayaran baru menunggu verifikasi keuangan.</>;
    case "land_permit_payment_updated":
      return <>Bukti pembayaran diperbarui dan perlu diverifikasi ulang.</>;
    case "land_permit_payment_deleted":
      return (
        <>
          Bukti pembayaran dihapus oleh{" "}
          <HighlightText>
            {getRoleUserLabel(metadata.deleted_by_role, metadata.deleted_by_name)}
          </HighlightText>
          .
        </>
      );
    case "land_permit_payment_approved":
      return <>Pembayaran sudah diverifikasi oleh keuangan.</>;
    case "land_permit_payment_rejected":
      return (
        <>
          Pembayaran ditolak. Tekan notifikasi ini untuk melihat alasan
          penolakan.
        </>
      );
    case "land_permit_termination_waiting":
      return <>Pengajuan nonaktif izin lahan perlu diproses oleh Anda.</>;
    case "land_permit_termination_progress":
      return (
        <>
          Nonaktif izin lahan disetujui oleh{" "}
          <HighlightText>
            {getRoleUserLabel(
              metadata.approved_by_role,
              metadata.approved_by_name,
            )}
          </HighlightText>
          . Menunggu{" "}
          <HighlightText>{metadata.waiting_role_label || "approval berikutnya"}</HighlightText>
          .
        </>
      );
    case "land_permit_termination_approved":
      return <>Pengajuan nonaktif izin lahan disetujui final.</>;
    case "land_permit_termination_rejected":
      return (
        <>
          Pengajuan nonaktif izin lahan ditolak. Tekan notifikasi ini untuk
          melihat alasan penolakan.
        </>
      );
    case "contract_created":
      return (
        <>
          Nomor kontrak{" "}
          <HighlightText>
            {compactNumber(metadata.contractNumber || metadata.contract_number)}
          </HighlightText>{" "}
          berhasil dibuat.
        </>
      );
    default:
      return (
        <>
          {notification?.message
            ?.replace(/^Dokumen .*?\.\s*/, "")
            ?.replace("siap dipantau", "siap ditinjau")}
        </>
      );
  }
};

export const getNotificationTitle = (notification) => {
  const metadata = notification?.metadata || {};

  if (
    notification?.type === "tenant_approval_progress" &&
    (metadata.approved_by_role || metadata.approved_by_name)
  ) {
    return `${getRoleUserLabel(
      metadata.approved_by_role,
      metadata.approved_by_name,
    )} sudah approve`;
  }

  if (
    notification?.type === "tenant_termination_progress" &&
    (metadata.approved_by_role || metadata.approved_by_name)
  ) {
    return `${getRoleUserLabel(
      metadata.approved_by_role,
      metadata.approved_by_name,
    )} sudah approve nonaktif`;
  }

  if (
    notification?.type === "land_permit_approval_progress" &&
    (metadata.approved_by_role || metadata.approved_by_name)
  ) {
    return `${getRoleUserLabel(
      metadata.approved_by_role,
      metadata.approved_by_name,
    )} sudah approve izin lahan`;
  }

  if (
    notification?.type === "land_permit_termination_progress" &&
    (metadata.approved_by_role || metadata.approved_by_name)
  ) {
    return `${getRoleUserLabel(
      metadata.approved_by_role,
      metadata.approved_by_name,
    )} sudah approve nonaktif izin lahan`;
  }

  return notification?.title;
};

const NotificationMessage = ({ notification }) => {
  const detail = getNotificationDetail(notification);
  const isPayment = notification?.entity_type === "payment";
  const isLandPermit = isLandPermitNotification(notification);

  return (
    <Box sx={{ mt: 0.35 }}>
      <Typography
        component="div"
        sx={{
          display: "block",
          fontSize: 12,
          color: "text.primary",
          overflowWrap: "anywhere",
          lineHeight: 1.65,
        }}
      >
        <Box component="span">
          {isLandPermit ? (
            <BaseLandPermitInfo detail={detail} />
          ) : (
            <BaseTenantInfo detail={detail} />
          )}
          {isPayment && !isLandPermit && (
            <PaymentLabel paymentNumber={detail.paymentNumber} />
          )}
          .{" "}
          <NotificationActionText notification={notification} />
        </Box>
      </Typography>
      <Typography
        component="div"
        sx={{
          display: "block",
          mt: 0.5,
          fontSize: 11,
          color: "text.secondary",
          fontWeight: 600,
        }}
      >
        {formatNotificationTime(notification.created_at)}
      </Typography>
    </Box>
  );
};

export default NotificationMessage;
