"use client";
import React, { forwardRef } from "react";
import SuratPernyataanPenyewa from "./SuratPernyataanPenyewa";
import PersetujuanSewaRuangan from "./PersetujuanSewaRuangan";
import LembarPersetujuan from "./LembarPersetujuan";
import FotoKTP from "./FotoKTP";

const PrintDocumentTenant = forwardRef(({ data }, ref) => {
  if (!data) return null;

  return (
    <>
      <div ref={ref}>
        {/* PAGE 1 */}
        <div className="print-page">
          <SuratPernyataanPenyewa data={data} />
        </div>

        {/* PAGE BREAK */}
        <div className="page-break" />

        {/* PAGE 2 */}
        <div className="print-page">
          <LembarPersetujuan data={data} />
        </div>

        {/* PAGE BREAK */}
        <div className="page-break" />

        {/* PAGE 3 */}
        <div className="print-page">
          <PersetujuanSewaRuangan data={data} />
        </div>

        {/* PAGE BREAK */}
        <div className="page-break" />

        {/* PAGE 3 */}
        <div className="print-page">
          <FotoKTP data={data} />
        </div>
      </div>

      <style jsx>{`
        @media print {
          .page-break {
            page-break-before: always;
            break-before: page;
          }

          .print-page {
            width: 100%;
            min-height: 100vh;
          }
        }
      `}</style>
    </>
  );
});

export default PrintDocumentTenant;
