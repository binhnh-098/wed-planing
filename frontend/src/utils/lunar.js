/**
 * Vietnamese Lunar Calendar converter algorithm
 * Adapted from Ho Ngoc Duc's astronomical algorithm for Vietnam timezone (UTC+7).
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd) {
  let a, b, c, d, e, m;
  if (jd > 2299160) {
    const a1 = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + a1 - Math.floor(a1 / 4);
  } else {
    a = jd;
  }
  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e);
  m = e < 14 ? e - 1 : e - 13;
  const year = m > 2 ? c - 4716 : c - 4715;
  return [day, m, year];
}

function getNewMoonDay(k, timeZone) {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * dr * Mpr);
  C1 -= 0.0004 * Math.sin(3 * dr * Mpr);
  C1 += 0.0104 * Math.sin(2 * dr * F) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 -= 0.0074 * Math.sin((M - Mpr) * dr) + 0.0004 * Math.sin((2 * F + M) * dr);
  C1 -= 0.0004 * Math.sin((2 * F - M) * dr) - 0.0006 * Math.sin((2 * F + Mpr) * dr);
  C1 += 0.001 * Math.sin((2 * F - Mpr) * dr) + 0.0005 * Math.sin((2 * Mpr + M) * dr);
  const Jd = Jd1 + C1;
  return Math.floor(Jd + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
  const T = (jdn - 2451545.0 + 0.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function getLunarMonth11(yy, timeZone) {
  let off = jdFromDate(31, 12, yy) - 2415021;
  let k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

function getLeapMonthOffset(a11, timeZone) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function convertSolar2Lunar(dd, mm, yy, timeZone = 7) {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (diff >= leapOff) {
      lunarMonth = diff + 10;
      if (diff === leapOff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    isLeap: lunarLeap === 1,
  };
}

export function getCanChiYear(lunarYear) {
  const can = CAN[(lunarYear + 6) % 10];
  const chi = CHI[(lunarYear + 8) % 12];
  return `${can} ${chi}`;
}

export function getCanChiDay(dd, mm, yy) {
  const jd = jdFromDate(dd, mm, yy);
  const can = CAN[(jd + 9) % 10];
  const chi = CHI[(jd + 1) % 12];
  return `${can} ${chi}`;
}

/**
 * Format string e.g. "Ngày 22/10 Âm lịch (Năm Bính Ngọ - Ngày Giáp Tý)"
 */
export function getLunarDateString(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yy = d.getFullYear();

  const lunar = convertSolar2Lunar(dd, mm, yy, 7);
  const yearName = getCanChiYear(lunar.year);
  const dayName = getCanChiDay(dd, mm, yy);

  const leapStr = lunar.isLeap ? ' (Nhuận)' : '';
  return `Ngày ${lunar.day}/${lunar.month}${leapStr} Âm lịch (Năm ${yearName} • Ngày ${dayName})`;
}

export function getShortLunarDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const dd = d.getDate();
  const mm = d.getMonth() + 1;
  const yy = d.getFullYear();

  const lunar = convertSolar2Lunar(dd, mm, yy, 7);
  const leapStr = lunar.isLeap ? 'N' : '';
  return `${lunar.day}/${lunar.month}${leapStr} ÂL`;
}
