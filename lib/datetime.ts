import { datetime } from "https://deno.land/x/ptera@v1.0.2/mod.ts";

export const nowInUnixTimestampSec = () => {
  return parseInt(datetime().format("X"));
};

export const convertUnixTimestampSec = (
  timestamp: number,
  format = "YYYY-M-d www HH:mm",
) => {
  return datetime(timestamp * 1000).format(format);
};
