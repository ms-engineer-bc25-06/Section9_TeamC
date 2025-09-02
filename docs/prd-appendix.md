# 📎 PRD Appendix（付録）

## A. データ・出典（Evidence）

- **EF EPI（英語能力指数・国別順位）**

  - 英語サイト: https://www.ef.com/wwen/epi/
  - 日本語サイト: https://www.efjapan.co.jp/epi/
  - 使い方
    - 最新年を確認 → “Country rankings”で Japan を検索 → 世界順位を取得
    - “Regions > Asia”でアジア内順位も確認
  - スライド用表記例
    - 世界順位：［92 位］（EF EPI［2024 年版］）
    - アジア内順位：［16 位/23 位中］（EF EPI［2024 年版］）
  - 注意: 自己選択サンプルのため母集団に偏りがある旨を注記

- **スピーキングの弱さ（参考データ）**

  - IIBC（TOEIC Program DATA & ANALYSIS 年次レポート）
    - レポート一覧: [IIBC 公式](https://www.iibc-global.org/iibc/press/2025/p283.html)
    - 手順: 最新年度 PDF → 日本の平均スコア（Listening/Reading と Speaking/Writing）を確認
    - スライド表示は相対値で OK（例：L=100, R=95, S=75, W=70）
  - 補足: 国際比較の口頭スキルの一次データは限られるため、定性要因（教育/環境/文化）とあわせて提示

- **子どもの意欲・保護者ニーズ（候補）**

  - ベネッセ教育総合研究所（小学生の英語・学習意識）
    - https://berd.benesse.jp/
    - サイト検索例：「小学生 英語 話す 機会 意識」
  - 内閣府 子供・若者白書
    - https://www8.cao.go.jp/youth/whitepaper/
  - 文部科学省 統計
    - https://www.mext.go.jp/b_menu/toukei/
  - スライド用表記例
    - 「英語を話す機会が必要」：［85％］（出典：［機関名・2024 年］）
  - 代替案: 自社調査（Google フォーム）で簡易アンケートを実施
    - 表記例：「自社調査（n=◯◯、YYYY/MM）」と明記

- **ブランド・ロゴの公式ガイドライン（使用技術スライド）**
  - Next.js: https://nextjs.org/brand
  - TypeScript: https://www.typescriptlang.org/branding/
  - Tailwind CSS: https://tailwindcss.com/brand
  - shadcn/ui: https://ui.shadcn.com/
  - OpenAI: https://openai.com/brand
  - Vercel: https://vercel.com/design/brand
  - Google Cloud: https://cloud.google.com/brand-guidelines
  - Web Speech API: 公式ロゴはないため、Chrome/Edge のロゴ使用（各ベンダー規約に従う）

---

## B. 技術選定（Trade-offs）

- **音声 → 文字起こし（STT）**

  - 採用: Web Speech API
    - 長所: 無料/低レイテンシ/ブラウザ完結
    - 留意: ブラウザ依存（Chrome/Edge 良好、iOS Safari は webkit 前提、Firefox は非対応）
    - フォールバック: 非対応ブラウザでは「録音のみ＋案内」「後でテキスト手入力」
  - 将来検討: Whisper 等の高精度 STT
    - 理由: 精度・一貫性向上、ただし API コスト・鍵管理・レイテンシが課題

- **AI フィードバック**

  - 採用: OpenAI API（テキストベースの改善/代替表現/励まし）
  - コスト抑制: 入力要約、レスポンス短文化、重複キャッシュ、レート制御
  - トーン設計: まず褒める → 具体提案 → 次の一歩（子ども向け優しい文体）
  - 非推奨: 発音の減点・スコア化、過度な文法指摘（MVP では行わない）

- **フロント/バックエンド・デプロイ**
  - Front: Next.js + TS + Tailwind + shadcn、Vercel デプロイ
  - Back（予定）: GCP（Cloud Run or Cloud Functions）＋ Firestore or Cloud SQL
  - Auth: Firebase Authentication（Google）
  - API 仕様: OpenAPI 3.0（Swagger UI 自動生成）
  - ローカル再現: Docker / Docker Compose

---

## C. プライバシー・安全（Privacy & Safety）

- **データ方針（MVP）**

  - 音声ファイルは保存しない。文字起こしテキストとメタデータのみ保存
  - 位置情報・相手の個人情報は収集しない
  - 削除機能: ユーザーが記録をいつでも削除可能

- **保護者同意（初回）**

  - 保存データの種類、利用目的、削除方法、第三者提供なし、問い合わせ先

- **画面内安全ガイド（録音前/中に常時表示）**

  - 保護者同伴、混雑・交通・夜間は避ける
  - 忙しそうな相手には控える
  - 拒否されたら即中止

- **法令・規約の留意**
  - 個人情報保護法（APPI）への配慮、各プラットフォーム規約順守
  - 本資料は法的助言ではない旨を明記

---

## D. 計測設計（Analytics / KPI）

- **主要イベント**

  - recording_started（device, browser）
  - stt_completed（duration_ms, char_count, success）
  - ai_feedback_viewed（alt_phrases_count, length）
  - reflection_saved（has_parent_comment, tags）
  - helper_phrase_shown（context: pre|during）

- **主要指標（KPI）**

  - 月次の録音/保存回数（チャレンジ実行率）
  - STT 成功率・平均レイテンシ
  - フィードバック閲覧率・振り返り実施率
  - NPS/満足度（アンケート）

- **補助指標**
  - 「伝わった！」チェック率
  - ほかの言い方開封率
  - 次の一歩のタップ率／再挑戦までの平均日数（成功・未成功別）

---

## E. QA 計画（Quality Assurance）

- **テストシナリオ**

  - 標準: 録音 →STT→AI→ 保存 → 履歴参照
  - 非対応ブラウザ: 縮退動作（録音のみ）＋案内表示
  - 環境差: 騒音/小声/屋外での STT 挙動確認
  - 失敗時の UX: タイムアウト・通信エラー時の再試行導線

- **端末・ブラウザ**

  - iOS Safari（webkit 前提）/ Android Chrome / Desktop Chrome・Edge

- **セキュリティ**
  - API キーはサーバ側のみ管理、フロント露出なし
  - 削除操作の確認ダイアログ、誤操作防止

---

## F. ロードマップ（発表に合わせて更新）

- **近々**

  - お助けフレーズ最適化（状況別の一言）
  - 振り返り UI のごほうび（スタンプ/バッジ）
  - 簡易チュートリアル（初回オンボーディング）

- **中期**

  - 音声ベース評価（発音/流暢さの簡易指標）
  - 家族内共有（限定共有、SNS は対象外）
  - バックエンド基盤整備（GCP、認証/保存/集計）

- **将来**
  - 高精度 STT（Whisper 等）＋プレミアム（決済）
  - 教育機関連携（学校/地域イベント）

---

## G. スライド・データ反映手順（S5/S6/S7）

- **S5（日本の英語力）**: EF EPI で Japan の世界/アジア順位を確認 → 数字を差し替え
- **S6（スキル別傾向）**: IIBC の最新 PDF で L/R/S/W 平均を確認 → 相対棒グラフに反映
- **S7（子どもの意欲）**: ベネッセ/内閣府の割合データを 1 つ選ぶ → 円グラフに反映
- 全て右下に「出典：◯◯（YYYY）」表記

---

## H. ビジュアル・ブランド（参考）

- **カラーパレット**（Zoom 背景の雰囲気を参考）

  - Primary Green: #6FAE6B
  - Deep Green: #2F6B3A
  - Light Mint: #EAF4E4
  - Charcoal: #2E2E2E
  - Gray-500: #8B8B8B
  - Accent Pink（任意）: #F4C7C3

- **フォント**

  - 見出し/本文: Noto Sans JP（Bold/Medium/Regular）
  - 数字強調で英数を Inter に切替も可

- **画像・アイコン**
  - ロイヤリティフリー素材（例：Storyset/Undraw/Flaticon/Freepik）
  - QR コードは QR Code Generator 等で作成

---

## I. リポジトリ docs 構成

- docs/
  - PRD.md（本編）
  - PRD_Appendix.md（本ファイル）
  - SLIDES_OUTLINE.md（見出し＋各枚の意図）
  - TALK_SCRIPT.md（10 分台本）
  - ANALYTICS_PLAN.md（イベント設計詳細）
  - SAFETY_GUIDE.md（保護者向け安全ガイド）
  - TECH_CHOICES.md（選定理由と比較）
  - CHANGELOG.md（更新履歴）

---

## J. 免責・注記

- 本 Appendix は一次情報のリンクと取得手順を示すものであり、掲載データは各公式出典の最新年に合わせて都度更新してください。
- 法的助言ではありません。必要に応じて専門家の確認を推奨。
