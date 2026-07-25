# RASA 線上拍貼機

這是一個純前端的手機拍照網站：

- 可開啟前鏡頭或後鏡頭
- 可切換 3 款 RASA 套框
- 拍攝後會在手機瀏覽器內合成照片
- 可呼叫手機原生分享選單
- 可按「下載照片」保存
- 不使用 Supabase
- 不含資料庫、會員系統或雲端照片儲存
- 照片不會上傳到 GitHub 或其他伺服器

---

## 專案結構

```text
rasa-photo-booth/
├── index.html
├── styles.css
├── app.js
├── .nojekyll
└── assets/
    ├── frame-red.png
    ├── frame-green.png
    ├── frame-orange.png
    ├── rasa-logo.png
    └── wenyi-logo.png
```

---

## GitHub Pages 上架流程

### 1. 建立 GitHub Repository

1. 登入 GitHub。
2. 點右上角 `＋`。
3. 選擇 `New repository`。
4. Repository name 建議輸入：

```text
rasa-photo-booth
```

5. Visibility 選擇 `Public`。
6. 點 `Create repository`。

### 2. 上傳專案檔

1. 進入剛建立的 repository。
2. 點 `Add file` → `Upload files`。
3. 解壓縮下載的 ZIP。
4. 將 `rasa-photo-booth` 資料夾「裡面的所有內容」拖進上傳區：

```text
index.html
styles.css
app.js
.nojekyll
assets 資料夾
```

請勿再多包一層資料夾，`index.html` 必須直接位於 repository 最外層。

5. 等待檔案上傳完成。
6. 在下方按 `Commit changes`。

### 3. 開啟 GitHub Pages

1. 進入 repository 的 `Settings`。
2. 左側選單點 `Pages`。
3. 在 `Build and deployment`：
   - Source：`Deploy from a branch`
   - Branch：`main`
   - Folder：`/(root)`
4. 點 `Save`。
5. 等待約 1～5 分鐘後重新整理頁面。

完成後會得到類似網址：

```text
https://你的GitHub帳號.github.io/rasa-photo-booth/
```

### 4. 製作現場 QR Code

將 GitHub Pages 網址貼進你使用的 QR Code 產生工具，即可放進活動現場設計。

QR Code 必須連到完整的 HTTPS 網址，例如：

```text
https://你的GitHub帳號.github.io/rasa-photo-booth/
```

---

## 現場測試重點

1. 使用實體手機測試，不要只用電腦預覽。
2. 建議使用 Safari 或 Chrome。
3. 第一次進入時，要選擇「允許使用相機」。
4. 手機保持直式拍攝。
5. 前鏡頭畫面與輸出照片會維持自拍鏡像效果。
6. 若從 LINE、Instagram 等 App 內建瀏覽器開啟後無法使用相機，請改選「使用外部瀏覽器開啟」。
7. iPhone 若點擊「下載照片」後只看到圖片預覽，可長按圖片並選擇「儲存到照片」；支援的裝置也會顯示「分享／儲存照片」按鈕。

---

## 更換套框

日後若要更換圖片，只要維持檔名不變，直接替換：

```text
assets/frame-red.png
assets/frame-green.png
assets/frame-orange.png
```

建議套框規格：

- PNG
- 透明背景
- 尺寸：1633 × 2048 px
- 中央拍照區域需保持透明

替換後重新上傳並 Commit，GitHub Pages 會自動更新。

---

## 更改介面文字

可直接開啟 `index.html` 編輯，例如：

- 線上拍貼機
- 選框拍一張
- 開啟拍貼機
- 下載照片
- 隱私提醒

---

## 隱私與儲存方式

拍照時，網站會使用瀏覽器的 Canvas 將：

1. 相機畫面
2. 選定的透明 PNG 套框

合成為一張 JPG。

合成工作只發生在使用者自己的裝置內。這個專案沒有任何照片上傳程式，也沒有連接 Supabase、Google Drive 或其他後端服務。

---

## 常見問題

### 相機完全沒有跳出來

確認：

- 網址是 `https://` 開頭
- 網站相機權限不是「封鎖」
- 沒有其他 App 正在占用相機
- 改用 Safari 或 Chrome
- 重新整理頁面再試一次

### 更新後仍看到舊版本

GitHub Pages 與手機瀏覽器可能有短暫快取。可等待數分鐘後：

- 重新整理
- 開無痕視窗測試
- 在網址最後暫時加上 `?v=2`

例如：

```text
https://你的GitHub帳號.github.io/rasa-photo-booth/?v=2
```
