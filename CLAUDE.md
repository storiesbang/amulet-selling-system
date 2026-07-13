# 佛牌販賣展示網站 — 架構筆記

純靜態展示站：無金流、無後台，買家透過 FB/LINE 私訊購買。
維護流程 = 改資料檔 → git push → GitHub Actions 自動部署到 GitHub Pages。
全站繁體中文。

## 技術決策

- **Astro（static output）+ 原生 JS**，不用任何前端框架。
- **樣式**：單一 `src/styles/global.css`，深色金色調（CSS 變數在 `:root`）。
- **導覽下拉選單**：原生 `<details>/<summary>`，少量 JS 只做「一次開一個、
  點外面收合」；手機版用 checkbox hack 收進漢堡選單。內容由 JSON 產生。
- **商品牆篩選**：build 時把 category/master/year/price/status 塞進卡片的
  `data-*` 屬性，客戶端 JS 過濾顯示/隱藏並用 `history.replaceState` 同步到
  query string（`?category=&master=&year=&min=&max=`）。下拉選單就是連到
  `/products/?category=xxx` 這種預篩選連結。
- **圖片**：`src/assets/photos/{product_id}/` + Astro `<Image />` 自動壓縮。
  `src/lib/photos.mjs` 用 `import.meta.glob` 建索引供動態查圖。
- **OG meta**：商品頁用 `getImage()` 產 1200px jpeg，組成絕對網址給
  `og:image`；`og:title` 含名稱與價格，FB/LINE 分享會有預覽卡。
- **資料驗證**：`src/lib/data.mjs` 在 module 載入時（= build 時）驗證，
  有錯直接 throw 讓 build 失敗。所有頁面都經由它拿商品資料。
  注意：照片存在檢查用 `process.cwd()` 相對路徑（`import.meta.url` 在
  prerender bundle 後會指到 dist，不可靠）。
- **排序**：商品牆與首頁一律 available 在前、sold 在後，各自依
  `created_at` 新到舊；`hidden` 在 `visibleProducts` 就被濾掉，
  不會出現在任何頁面（含詳細頁）。
- **base path**：部署在 `/amulet-selling-system/` 子路徑，站內連結一律用
  `withBase()`（`src/lib/data.mjs`）。換 repo 名/網域要改 `astro.config.mjs`。

## 資料格式

### `src/data/products.json`（陣列）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一，當網址 slug，例 `somdej-ajahn-toh-2515` |
| product_type | `"amulet"` \| `"accessory"` | 須與 category 的 product_type 一致 |
| category | string | 對應 categories.json 的 id |
| name_zh | string | 中文名，必填 |
| name_th | string \| null | 泰文名，配件可 null |
| year | string | 保持彈性，可填「佛曆2515」或「2515」 |
| master | string \| null | 對應 masters.json；amulet 必填，配件可 null |
| price | int | 新台幣 |
| description | string \| null | |
| status | `"available"` \| `"sold"` \| `"hidden"` | |
| photos | string[] | 檔名（相對 `src/assets/photos/{id}/`），第一張是封面 |
| created_at | `"YYYY-MM-DD"` | 決定「最新上架」排序 |

### `src/data/categories.json`
`{ id, name, product_type, sort_order }`

### `src/data/masters.json`
`{ id, name, sort_order }`

### `src/data/site.json`
`{ name, tagline, facebook, line }` — 網站名與聯絡連結集中在這裡改。

### 文章
`src/content/articles/*.md`（content collection `articles`），frontmatter：
`title`（必填）、`description`、`order`（導覽選單排序）。網址 `/about/{檔名}/`。

## 頁面

- `/` 首頁：hero + 最新上架 8 筆
- `/products/` 商品牆（篩選）
- `/products/{id}/` 商品詳細頁（getStaticPaths，含相簿切換與 OG meta）
- `/about/{slug}/` 文章頁

## 常用指令

- `npm run dev` / `npm run build` / `npm run preview`
- `npm run new-product` — 互動式新增商品（自動生成 id、壓縮照片成
  長邊 1600px webp、寫入 products.json）
