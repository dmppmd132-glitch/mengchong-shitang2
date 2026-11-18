# 萌寵食堂

可愛療癒的繁體中文行動裝置優先電子寵物養成 PWA 遊戲。  
支援 **粉紅小豬 / 棉花糖小兔 / 奶油小狗** 三種萌寵造型與專屬叫聲、喜好料理加成、**開心農場食材種植與廚房合成（布丁、水果盒等）**、**蘋果 / 薯條接接樂賺金幣小遊戲**；預設支援本機 `localStorage` 離線遊玩，亦可選配 **Supabase 帳號登入與雲端存檔**、**兩人共養與 6 碼邀請碼即時同步**，以及 **萌寵留言板與原創貼圖**。

## 專案架構

```text
public/
  manifest.json               # Web App Manifest 設定（萌寵食堂、standalone、粉紅/奶油色主題）
  icon.svg                    # SVG 可愛小豬圖示
  apple-touch-icon.png        # iOS 主畫面圖示 (180x180)
  pwa-192x192.png             # PWA 圖示 (192x192)
  pwa-512x512.png             # PWA 圖示 (512x512)
  pwa-maskable-512x512.png    # Android Maskable 圖示 (512x512)
supabase/
  schema.sql                  # pet_saves、shared_pets、pet_messages 資料表、RLS 安全規則與 RPC 函式
src/
  types/index.ts              # Pet、PetSpecies、Food、IngredientId、CropPlot、KitchenRecipe、CatchGameMode 等型別
  lib/
    supabase.ts               # Supabase 用戶端初始化與環境變數檢查
  services/
    cloudSync.ts              # Supabase Email 登入/註冊與 pet_saves 雲端同步服務
    sharedPet.ts              # 兩人共養、6 碼邀請碼建立/加入/退出與 Realtime 即時同步服務
    messageBoard.ts           # 共養留言板與貼圖讀寫及 Realtime 訂閱服務
  data/
    species.ts                # 小豬、小兔、小狗外觀、台詞與喜好食物定義
    foods.ts                  # 正餐、零食（含布丁與水果盒）、速食資料與初始庫存
    kitchen.ts                # 紅蘿蔔、玉米、草莓食材種植參數與廚房合成食譜
    accessories.ts            # 頭部、臉部、脖子、身體配件資料
    growth.ts                 # 成長階段與圓滾滾體態等級邏輯
    quests.ts                 # 每日任務定義
    stickers.ts               # 8 款可愛原創小豬貼圖定義
  utils/
    storage.ts                # localStorage 讀寫、時間衰減、農田與食材正規化、每日任務重設
    sound.ts                  # Web Audio API 輕量化可愛音效與三種寵物叫聲
  hooks/
    usePWAInstall.ts          # PWA 安裝偵測與 iOS Safari 判斷
    useOnlineStatus.ts        # 離線狀態偵測
  components/
    IntroHatching.tsx         # 開場寵物蛋選擇、點擊孵化與命名畫面（含登入與邀請碼加入入口）
    AuthSyncModal.tsx         # Supabase 登入/註冊、同步狀態管理與存檔衝突選擇彈窗
    SharedPetModal.tsx        # 兩人共養與 6 碼邀請碼建立、複製、加入與退出彈窗
    MessageBoardModal.tsx     # 萌寵留言板與原創貼圖互動視窗
    CatchMinigameModal.tsx    # 蘋果接接樂 / 薯條接接樂 2D 賺金幣小遊戲彈窗
    PiggySticker.tsx          # 8 款原創粉紅小豬 SVG 貼圖元件
    PiggyCharacter.tsx        # 小豬 / 小兔 / 小狗動態 SVG 角色與即時配件穿戴層
    AccessoryPreview.tsx      # 衣櫃配件 SVG 預覽圖示
    HomeView.tsx              # 主畫面：狀態條、摸摸、餵食動畫、照護按鈕、小遊戲與留言板入口
    CanteenView.tsx           # 食堂頁面：點餐商店、開心農場（種紅蘿蔔/玉米/草莓）與萌寵廚房（合成布丁/水果盒）
    WardrobeView.tsx          # 衣櫃頁面：穿戴配件、解鎖造型與切換小豬/小兔/小狗外觀
    JournalView.tsx           # 成長手帳：7/30 天體重折線圖、手動輸入體重、留言板、共養與重置管理
    QuestsView.tsx            # 每日任務：進度條與領取金幣/食材獎勵
    BottomTabBar.tsx          # 固定底部五分頁導覽列
    LevelUpModal.tsx          # 成長升級彈窗
    ResetConfirmModal.tsx     # 重置遊戲二次確認彈窗
    PWAInstallButton.tsx      # 非強制式安裝提示按鈕與 iOS 加到主畫面引導彈窗
    OfflineIndicator.tsx      # 離線模式提示條
```

## 本機開發執行

請先確認已安裝 Node.js 18 以上版本，於專案根目錄執行：

```bash
npm install
npm run dev
```

啟動後於瀏覽器開啟 `http://localhost:3000`（建議使用瀏覽器開發者工具切換至 iPhone 尺寸預覽）。

## 啟用 Supabase 登入、雲端存檔與兩人共養（選配）

1. 前往 [Supabase](https://supabase.com) 建立專案。
2. 在 Supabase Dashboard 左側選單打開 **SQL Editor**，貼上並執行本專案的 `supabase/schema.sql`（會建立 `public.pet_saves`、`public.shared_pets` 資料表、RLS 安全規則、Realtime 同步及邀請碼 RPC 函式）。
3. 在專案根目錄建立 `.env`（或於 Vercel 專案 **Settings -> Environment Variables**）加入以下兩個環境變數：
   ```env
   VITE_SUPABASE_URL="https://你的專案ID.supabase.co"
   VITE_SUPABASE_ANON_KEY="你的 Supabase anon public key"
   ```
4. 若未設定環境變數，遊戲會自動以本機 `localStorage` 離線模式執行，完全不影響遊玩。

## 建置與預覽

```bash
npm run lint
npm run build
npm run preview
```

- `npm run lint` 會執行 TypeScript 型別檢查（`tsc --noEmit`）。
- `npm run build` 會於 `dist/` 產生最佳化後的靜態檔案，並透過 `vite-plugin-pwa` 自動生成 Service Worker (`sw.js`)。
- Service Worker 僅快取靜態資源（JS、CSS、HTML、圖示、字型），`/api/*` 與 `*.supabase.co` 請求皆設定為 `NetworkOnly`，且 `localStorage` 存檔資料不會被 Service Worker 快取。

## 部署到 Vercel

### 方法一：透過 GitHub 連線部署（推薦）

1. 將本專案推送至您的 GitHub 儲存庫。
2. 前往 [Vercel](https://vercel.com) 並登入帳號，點擊 **Add New Project**。
3. 匯入該 GitHub 儲存庫，Vercel 會自動偵測為 **Vite** 專案：
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. 若有使用雲端存檔與兩人共養，請在 **Environment Variables** 填入 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`。
5. 點擊 **Deploy**，數十秒內即可取得 HTTPS 線上網址。

### 方法二：使用 Vercel CLI 部署

```bash
npm i -g vercel
vercel --prod
```

## iPhone Safari 如何加到主畫面

1. 使用 iPhone 的 **Safari** 開啟《萌寵食堂》的 HTTPS 網址（請勿使用 LINE 或 IG 內建瀏覽器）。
2. 點擊 Safari 下方工具列的 **「分享」** 圖示（方形加上向上箭頭），或點擊遊戲右上角的 **「加到主畫面」** 按鈕查看操作步驟。
3. 往下滑動選單並選擇 **「加入主畫面」**。
4. 確認名稱為 **「萌寵食堂」** 後點擊右上角 **「新增」**。
5. 回到 iPhone 桌面即可看到粉紅小豬圖示，點擊即可全螢幕（`standalone`）啟動並在離線時繼續遊玩！
