import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: string = "INR",
  symbol?: string
): string {
  if (currency === "INR" || symbol === "₹") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatTimeAgo(dateStringOrDate: string | Date): string {
  const date = new Date(dateStringOrDate);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function getStatusDetails(status: string) {
  switch (status) {
    case "PENDING":
      return {
        label: "Pending Approval",
        color: "bg-amber-100 text-amber-800 border-amber-300",
        badgeBg: "#FEF3C7",
        badgeColor: "#92400E",
        step: 1,
        description: "Sent to the kitchen. Waiting for barista or chef acceptance.",
      };
    case "ACCEPTED":
      return {
        label: "Accepted",
        color: "bg-blue-100 text-blue-800 border-blue-300",
        badgeBg: "#DBEAFE",
        badgeColor: "#1E40AF",
        step: 2,
        description: "Order accepted by staff. Queued for prep.",
      };
    case "PREPARING":
      return {
        label: "Preparing",
        color: "bg-purple-100 text-purple-800 border-purple-300",
        badgeBg: "#EDE9FE",
        badgeColor: "#5B21B6",
        step: 3,
        description: "Your artisanal drink or dish is being freshly handcrafted.",
      };
    case "READY":
      return {
        label: "Ready for Pickup",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
        badgeBg: "#D1FAE5",
        badgeColor: "#065F46",
        step: 4,
        description: "Order is plated and ready! Server is bringing it to your table.",
      };
    case "SERVED":
      return {
        label: "Served",
        color: "bg-stone-100 text-stone-800 border-stone-300",
        badgeBg: "#F5F5F4",
        badgeColor: "#292524",
        step: 5,
        description: "Delivered to table. Hope you enjoyed every sip and bite!",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        color: "bg-rose-100 text-rose-800 border-rose-300",
        badgeBg: "#FFE4E6",
        badgeColor: "#9F1239",
        step: 0,
        description: "This order was cancelled.",
      };
    default:
      return {
        label: status,
        color: "bg-stone-100 text-stone-700 border-stone-300",
        badgeBg: "#F5F5F4",
        badgeColor: "#44403C",
        step: 1,
        description: "",
      };
  }
}
