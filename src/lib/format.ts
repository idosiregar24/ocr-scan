const idrFormatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export function formatIDR(amount: number) {
  return idrFormatter.format(amount);
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return dateFormatter.format(new Date(date));
}
