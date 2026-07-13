// 商品資料載入 + build 時驗證。任何頁面 import 這個模組都會先跑驗證，
// 資料改壞（id 重複、category/master 對不上、照片缺檔）build 會直接失敗。
import fs from 'node:fs';
import path from 'node:path';
import products from '../data/products.json';
import rawCategories from '../data/categories.json';
import rawMasters from '../data/masters.json';

// build 時 cwd 是專案根目錄（import.meta.url 在 bundle 後不可靠）
const photosDir = path.resolve('src/assets/photos') + path.sep;
const bySortOrder = (a, b) => a.sort_order - b.sort_order;

export const categories = [...rawCategories].sort(bySortOrder);
export const masters = [...rawMasters].sort(bySortOrder);
export const categoryById = new Map(categories.map((c) => [c.id, c]));
export const masterById = new Map(masters.map((m) => [m.id, m]));

const errors = [];
const seen = new Set();
for (const p of products) {
  if (seen.has(p.id)) errors.push(`重複的商品 id：${p.id}`);
  seen.add(p.id);
  const cat = categoryById.get(p.category);
  if (!cat) {
    errors.push(`${p.id}：找不到 category「${p.category}」`);
  } else if (cat.product_type !== p.product_type) {
    errors.push(`${p.id}：category「${p.category}」屬於 ${cat.product_type}，但商品的 product_type 是 ${p.product_type}`);
  }
  if (p.master != null && !masterById.has(p.master)) errors.push(`${p.id}：找不到 master「${p.master}」`);
  if (p.product_type === 'amulet' && p.master == null) errors.push(`${p.id}：聖物（amulet）必須指定 master`);
  if (!['available', 'sold', 'hidden'].includes(p.status)) errors.push(`${p.id}：status「${p.status}」不合法`);
  if (!Number.isInteger(p.price) || p.price < 0) errors.push(`${p.id}：price 必須是非負整數`);
  if (!Array.isArray(p.photos) || p.photos.length === 0) {
    errors.push(`${p.id}：photos 至少要有一張`);
  } else {
    for (const f of p.photos) {
      if (!fs.existsSync(path.join(photosDir, p.id, f))) {
        errors.push(`${p.id}：找不到照片檔 src/assets/photos/${p.id}/${f}`);
      }
    }
  }
}
if (errors.length) {
  throw new Error('products.json 驗證失敗：\n- ' + errors.join('\n- '));
}

const byNewest = (a, b) => b.created_at.localeCompare(a.created_at);
// hidden 不出現在任何頁面；sold 排在可售商品之後
export const visibleProducts = [
  ...products.filter((p) => p.status === 'available').sort(byNewest),
  ...products.filter((p) => p.status === 'sold').sort(byNewest),
];

export const fmtPrice = (n) => 'NT$ ' + n.toLocaleString('en-US');
export const withBase = (path) => import.meta.env.BASE_URL.replace(/\/$/, '') + path;
