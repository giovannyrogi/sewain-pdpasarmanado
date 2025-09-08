export const getCookie = (name) => {
  if (typeof document === "undefined") return null; // safe guard SSR
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
};
