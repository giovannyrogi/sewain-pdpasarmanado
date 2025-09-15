import pool from "@/lib/dbConfig";
import moment from "moment";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // id dari URL (rooms.id)
    const body = await request.json();
    const { start_date, end_date, document_number } = body;

    console.log("start_date", start_date);
    console.log("end_date", end_date);
    console.log("document_number", document_number);

    //check document number
    const checkDocumentNumber = await pool.query(
      "SELECT 1 FROM tenant_application WHERE document_number = $1 AND id != $2",
      [document_number, id]
    );
    if (checkDocumentNumber.rows.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nomor dokumen sudah terdaftar!",
        }),
        { status: 200 }
      );
    }

    // check start_date dari frontend
    if (!start_date) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tanggal mulai wajib diisi!",
        }),
        { status: 200 }
      );
    }

    // check end_date dari frontend
    if (!end_date) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Tanggal selesai wajib diisi!",
        }),
        { status: 200 }
      );
    }

    const result = await pool.query(
      `UPDATE tenant_application 
         SET start_date = $1,
             end_date = $2,
             document_number = $3
       WHERE id = $4
       RETURNING *`,
      [
        moment(start_date).format("YYYY-MM-DD"),
        moment(end_date).format("YYYY-MM-DD"),
        document_number.toUpperCase(),
        id,
      ]
    );

    return new Response(
      JSON.stringify({
        success: true,
        message: "Berhasil mengupdate document",
        data: result.rows[0],
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("error update document", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500 }
    );
  }
}
