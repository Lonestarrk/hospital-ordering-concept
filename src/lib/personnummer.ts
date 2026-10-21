// Svenska personnummer: ÅÅÅÅMMDD-XXXX (12 siffror) eller ÅÅMMDD-XXXX (10 siffror).

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formaterar inmatade siffror som ÅÅÅÅMMDD-XXXX medan man skriver. */
export function formatPersonnummer(digits: string): string {
  const d = onlyDigits(digits).slice(0, 12);
  if (d.length <= 8) return d;
  return `${d.slice(0, 8)}-${d.slice(8)}`;
}

function luhnOk(tenDigits: string): boolean {
  let sum = 0;
  for (let i = 0; i < tenDigits.length; i++) {
    let n = Number(tenDigits[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
}

function dateOk(year: number, month: number, day: number): boolean {
  // Samordningsnummer har dag + 60.
  const realDay = day > 60 ? day - 60 : day;
  const date = new Date(year, month - 1, realDay);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === realDay
  );
}

export type PersonnummerCheck =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

/** Validerar ett 12-siffrigt personnummer och returnerar det normaliserat (ÅÅÅÅMMDDXXXX). */
export function checkPersonnummer(input: string): PersonnummerCheck {
  const d = onlyDigits(input);
  if (d.length < 12) {
    return { ok: false, reason: "Numret behöver 12 siffror: år, månad, dag och fyra sista siffror." };
  }
  const year = Number(d.slice(0, 4));
  const month = Number(d.slice(4, 6));
  const day = Number(d.slice(6, 8));
  if (!dateOk(year, month, day)) {
    return { ok: false, reason: "Födelsedatumet ser inte rätt ut. Kontrollera de första åtta siffrorna." };
  }
  if (!luhnOk(d.slice(2))) {
    return { ok: false, reason: "Numret stämmer inte riktigt. Kontrollera de fyra sista siffrorna." };
  }
  return { ok: true, normalized: d };
}
