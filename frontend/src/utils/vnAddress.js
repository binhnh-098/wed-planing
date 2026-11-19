// Fetches Vietnam province/ward data from the public provinces.open-api.vn
// directory so address forms can offer a real dropdown of wards per province.
const API_BASE = 'https://provinces.open-api.vn/api/v2';

let provincesCache = null;
const wardsCache = new Map(); // provinceCode -> ward name[]

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/^(thành phố|tỉnh)\s+/u, '')
    .trim();
}

async function getProvinces() {
  if (provincesCache) return provincesCache;
  const res = await fetch(`${API_BASE}/p/`);
  if (!res.ok) throw new Error('Failed to fetch provinces');
  provincesCache = await res.json();
  return provincesCache;
}

export async function findProvinceCode(provinceName) {
  if (!provinceName) return null;
  const provinces = await getProvinces();
  const target = normalize(provinceName);
  const match = provinces.find((p) => normalize(p.name) === target);
  return match ? match.code : null;
}

export async function fetchWardsForProvince(provinceName) {
  const code = await findProvinceCode(provinceName);
  if (!code) return [];
  if (wardsCache.has(code)) return wardsCache.get(code);
  const res = await fetch(`${API_BASE}/p/${code}?depth=2`);
  if (!res.ok) throw new Error('Failed to fetch wards');
  const data = await res.json();
  const names = (data.wards || []).map((w) => w.name).sort((a, b) => a.localeCompare(b, 'vi'));
  wardsCache.set(code, names);
  return names;
}
