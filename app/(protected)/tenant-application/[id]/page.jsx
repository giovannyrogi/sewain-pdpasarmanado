import PreviewDetailData from "./PreviewDetailData";

async function getDetail(id) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/tenant-application/detail-data-tenant/${id}`,
    { cache: "no-store" },
  );

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "Gagal mengambil data");
  }

  return json.data;
}

const Page = async ({ params }) => {
  const { id } = await params;
  const data = await getDetail(id);

  return <PreviewDetailData data={data} />;
};

export default Page;
