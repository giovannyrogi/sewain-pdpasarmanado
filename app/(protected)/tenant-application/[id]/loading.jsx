"use client";

import LoadingBackdrop from "@/app/components/loading/Backdrop";

const Loading = () => {
  return (
    <LoadingBackdrop open={true} message="Memuat detail data pemohon..." />
  );
};

export default Loading; 
