// 互動式新增商品：問欄位 → 自動生成 id → 壓縮照片（長邊 1600px、webp）
// → 寫入 products.json。用法：npm run new-product（在專案根目錄執行）
import { createInterface } from 'node:readline/promises';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PRODUCTS_PATH = 'src/data/products.json';
const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
const categories = JSON.parse(fs.readFileSync('src/data/categories.json', 'utf8'));
const masters = JSON.parse(fs.readFileSync('src/data/masters.json', 'utf8'));

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function ask(label, { required = false } = {}) {
  while (true) {
    const ans = (await rl.question(`${label}：`)).trim();
    if (ans || !required) return ans || null;
    console.log('這個欄位必填。');
  }
}

async function pick(list, label, { optional = false } = {}) {
  list.forEach((x, i) => console.log(`  ${i + 1}. ${x.name}`));
  while (true) {
    const ans = (await rl.question(`${label}（輸入編號${optional ? '，可留空' : ''}）：`)).trim();
    if (!ans && optional) return null;
    const item = list[Number(ans) - 1];
    if (item) return item;
    console.log('編號不對，再試一次。');
  }
}

async function askInt(label) {
  while (true) {
    const ans = (await rl.question(`${label}：`)).trim();
    const n = Number(ans);
    if (Number.isInteger(n) && n >= 0) return n;
    console.log('請輸入非負整數。');
  }
}

// 拖曳檔案到終端機會產生「反斜線跳脫」或引號包起來的路徑，這裡都處理
function cleanPath(raw) {
  let s = raw.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1);
  }
  return s.replace(/\\(.)/g, '$1');
}

console.log('=== 新增商品 ===');
const type = await pick(
  [{ id: 'amulet', name: '聖物' }, { id: 'accessory', name: '配件' }],
  '商品類型'
);
const category = await pick(
  categories.filter((c) => c.product_type === type.id).sort((a, b) => a.sort_order - b.sort_order),
  '種類'
);
const name_zh = await ask('中文名（必填）', { required: true });
const name_th = await ask('泰文名（可留空）');
const year = await ask('年份（例如 佛曆2515 或 2515，可留空）');
const master =
  type.id === 'amulet'
    ? await pick(masters.sort((a, b) => a.sort_order - b.sort_order), '師父')
    : await pick(masters.sort((a, b) => a.sort_order - b.sort_order), '師父', { optional: true });
const price = await askInt('價格（新台幣整數）');
const description = await ask('描述（可留空）');

console.log('照片：一行貼一個檔案路徑（可直接拖曳檔案進終端機），輸入空白行結束。第一張會當封面。');
const sources = [];
while (true) {
  const raw = await rl.question(`照片 ${sources.length + 1}：`);
  if (!raw.trim()) {
    if (sources.length > 0) break;
    console.log('至少要一張照片。');
    continue;
  }
  const p = cleanPath(raw);
  if (fs.existsSync(p)) sources.push(p);
  else console.log(`找不到檔案：${p}`);
}
rl.close();

// 自動生成 id：種類-師父-年份數字，重複就加 -2、-3…
const yearDigits = (year ?? '').replace(/\D/g, '');
const base = [category.id, master?.id, yearDigits].filter(Boolean).join('-');
const existing = new Set(products.map((p) => p.id));
let id = base;
for (let n = 2; existing.has(id); n++) id = `${base}-${n}`;

const photoDir = path.join('src/assets/photos', id);
fs.mkdirSync(photoDir, { recursive: true });
const photos = [];
for (const [i, src] of sources.entries()) {
  const name = `${String(i + 1).padStart(2, '0')}.webp`;
  await sharp(src)
    .rotate() // 依 EXIF 轉正
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(photoDir, name));
  photos.push(name);
  console.log(`已壓縮 → ${photoDir}/${name}`);
}

products.push({
  id,
  product_type: type.id,
  category: category.id,
  name_zh,
  name_th,
  year,
  master: master?.id ?? null,
  price,
  description,
  status: 'available',
  photos,
  created_at: new Date().toISOString().slice(0, 10),
});
fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2) + '\n');

console.log(`\n✅ 已新增商品「${name_zh}」（id: ${id}）`);
console.log('接下來：npm run build 確認驗證通過，再 git add / commit / push 部署上線。');
