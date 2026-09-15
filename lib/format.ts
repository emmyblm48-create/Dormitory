const SUPABASE_PROJECT_ID = "aktyghpazejsihdbvrle";
const BUCKET_NAME = "productImage";

export const formatFullDate = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
};

export const formatCurrency = (value?: number | null) => {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท`;
};

export const formatImageUrl =(url?: string | null, bucket: string = BUCKET_NAME) => {
  if (!url || url.trim() === "") return null;

  let cleanUrl = url.trim();

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    if (cleanUrl.includes("drive.google.com/file/d/")) {
      const fileId = cleanUrl.split("/d/")[1]?.split("/")[0];
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}=s1000`;
      }
    }

    if (cleanUrl.includes("sdltpjvwovgjsldrixxi")) {
      cleanUrl = cleanUrl.replace("sdltpjvwovgjsldrixxi", SUPABASE_PROJECT_ID);
    }

    if (!cleanUrl.includes("supabase.co") || cleanUrl.includes("/storage/v1/object/public/")) {
      return cleanUrl;
    }
  }

  if (cleanUrl.includes("/public/")) {
    cleanUrl = cleanUrl.split("/public/")[1];
  }

  cleanUrl = cleanUrl.replace(/\/+/g, "/");

  const prefixesToRemove = ["public/", "products/", "productimage/", "productImage/", "maintenanceimage/", "maintenanceImage/"];
  prefixesToRemove.forEach((prefix) => {
    if (cleanUrl.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleanUrl = cleanUrl.slice(prefix.length);
    }
  });

  cleanUrl = cleanUrl.replace(/^\/+/, "");

  return `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${bucket}/${cleanUrl}`;
};
