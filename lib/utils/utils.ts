import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {string} from "zod";

export function formatNumber(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";

  const num = typeof val === "string" ? Number(val) : val;
  if (isNaN(num)) return "";

  return num.toLocaleString("en-US");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getMainFilePath=(fileId:string):string=> {
  return "http://localhost:3011/files/public/stream/"+fileId;
}
export const getSmallFilePath=(fileId:string):string=> {
  return "http://localhost:3011/files/public/thumbnail/"+fileId;
}

export const normalizePhoneNumber=(phone: string): string=> {
  if(!phone) return phone;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "98" + digits.slice(1);
  }
  if (digits.startsWith("98")) {
    return digits;
  }
  return digits;
}





