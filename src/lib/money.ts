export function parseWeightMilli(value: string) {
  const match = /^(0|[1-9]\d{0,6})(?:\.(\d{1,3}))?$/.exec(value.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fractional = Number((match[2] ?? "").padEnd(3, "0"));
  const milli = whole * 1000 + fractional;
  return Number.isSafeInteger(milli) && milli > 0 ? milli : null;
}

export function formatWeightMilli(milli: number) {
  const whole = Math.floor(milli / 1000);
  const fraction = String(milli % 1000).padStart(3, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : String(whole);
}

export function calculateDepositValue(weightMilli: number, pricePerKg: number) {
  if (!Number.isSafeInteger(weightMilli) || !Number.isSafeInteger(pricePerKg)) {
    throw new Error("Nilai setoran di luar batas yang didukung.");
  }
  const product = weightMilli * pricePerKg;
  if (!Number.isSafeInteger(product) || product > 2_147_483_647_000 + 500) {
    throw new Error("Nilai setoran di luar batas yang didukung.");
  }
  const rupiah = Math.floor((product + 500) / 1000);
  if (!Number.isSafeInteger(rupiah) || rupiah < 1 || rupiah > 2_147_483_647) {
    throw new Error("Nilai setoran harus minimal Rp1 dan tidak melebihi batas Rupiah.");
  }
  return rupiah;
}

export function rupiah(value: number | string | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}
