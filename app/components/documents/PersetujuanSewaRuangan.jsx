// components/PersetujuanSewaRuangan.jsx
import React from "react";

const PersetujuanSewaRuangan = React.forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <div ref={ref} style={{ padding: "40px", fontFamily: "Times New Roman" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        PERUSAHAAN UMUM DAERAH PASAR MANADO
      </h2>
      <p style={{ margin: "5px 0" }}>Nomor: 666 / PPM / VIII / 2025</p>
      <p style={{ margin: "5px 0" }}>Perihal: Persetujuan Sewa Ruangan</p>
      <br />
      <p>Kepada Yth. {data.tenant_name}</p>
      <p>Lokasi: {data.location_name}</p>
      <p>Ruangan: {data.room_number}</p>
      <p>Durasi: {data.start_date} - {data.end_date}</p>
      <br />
      <p>Dengan ini permohonan Anda telah disetujui.</p>
      <br /><br />
      <p style={{ textAlign: "right" }}>Manado, {new Date().toLocaleDateString()}</p>
      <p style={{ textAlign: "right", marginTop: "60px" }}>
        <strong>Direktur</strong>
      </p>
    </div>
  );
});

export default PersetujuanSewaRuangan;
