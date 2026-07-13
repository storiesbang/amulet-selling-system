# 佛牌販賣展示網站

純靜態的佛牌（泰國聖物）展示網站：無金流、無購物車、無後台。
買家看到商品後透過 Facebook / LINE 私訊購買。
上架、下架、標記已售出都是「改 repo 裡的資料檔 → git push」自動重新部署。

- 技術：Astro + 原生 JavaScript，CSS 手寫
- 部署：GitHub Pages（push 到 `main` 自動 build + 部署）
- 網址：https://storiesbang.github.io/amulet-selling-system/

## 本機預覽

```bash
npm install
npm run dev        # 開發伺服器 http://localhost:4321/amulet-selling-system/
npm run build      # 正式 build（會跑資料驗證）
npm run preview    # 預覽 build 結果
```

## 如何新增商品

### 方法一：互動式腳本（推薦）

```bash
npm run new-product
```

腳本會依序問你：類型、種類、中文名、泰文名、年份、師父、價格、描述、照片。
照片可以直接把檔案拖進終端機（一行一張，第一張是封面，空白行結束）。
腳本會自動：

1. 生成商品 id（例如 `somdej-ajahn-toh-2515`）
2. 建立 `src/assets/photos/{id}/` 目錄
3. 把原始照片壓縮成長邊 1600px 的 webp 放進去
4. 在 `src/data/products.json` 插入該筆商品

之後：

```bash
npm run build      # 確認驗證通過
git add -A && git commit -m "新增商品 xxx" && git push
```

### 方法二：手動

1. 建立 `src/assets/photos/{商品id}/`，放入照片
2. 在 `src/data/products.json` 加一筆（欄位格式見 `CLAUDE.md`）
3. `npm run build` 確認驗證通過，再 push

## 如何標記已售出 / 下架

改 `src/data/products.json` 裡該商品的 `status`，然後 push：

- `"available"`：正常販售
- `"sold"`：照常顯示但蓋「已售出」標籤、排在可售商品之後、購買按鈕變成已售出標示
- `"hidden"`：完全不出現在任何頁面（等於下架，資料保留）

## 改網站名 / 聯絡方式

`src/data/site.json`：網站名、一句介紹、Facebook 連結、LINE 連結。

## 資料驗證

`npm run build` 時會自動檢查 `products.json`：

- 商品 id 重複
- category / master 對不上清單（`categories.json` / `masters.json`）
- 照片檔不存在
- status / price 格式錯誤

有錯 build 直接失敗並列出所有問題，不會把壞資料部署上去。
GitHub Actions build 失敗時網站會維持上一版，不會壞掉。

## GitHub Pages 首次設定

1. 到 GitHub repo → **Settings → Pages**
2. **Source** 選 **GitHub Actions**
3. push 到 `main`，等 Actions 跑完，網站就在
   https://storiesbang.github.io/amulet-selling-system/

之後每次 push 到 `main` 都會自動重新部署（`.github/workflows/deploy.yml`）。

> 如果之後換 repo 名稱或改用自訂網域，記得同步改 `astro.config.mjs`
> 裡的 `site` 與 `base`。
