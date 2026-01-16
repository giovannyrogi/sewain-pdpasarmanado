import moment from "moment";

const getDurationInYears = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = moment(startDate);
  const end = moment(endDate);

  let years = end.diff(start, "years");
  const remainderMonths = end.diff(start.add(years, "years"), "months");

  // jika masih ada sisa bulan, bulatkan ke atas
  if (remainderMonths > 0) {
    years += 1;
  }

  return years;
};


export default getDurationInYears;