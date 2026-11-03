# 今日の錠前 Webサイト

毎日1問の暗証番号推理パズル「今日の錠前」のサイトです。サーバーは不要で、毎日0時すぎに自動でページを作り直して公開します。

## 中身

| ファイル | 役割 |
| --- | --- |
| `config.json` | サイトのURL・運営者名・連絡先・広告・本のリンクなどの設定 |
| `build.js` | ページを `dist/` に書き出す |
| `src/core.js` | 問題を作る・解く仕組み（インスタ投稿や本と同じ問題になります） |
| `src/game.js` / `src/style.css` | 遊ぶ画面と見た目 |
| `static/` | アイコン、ホーム画面に追加するための設定、オフライン対応 |
| `.github/workflows/deploy.yml` | 毎日の自動公開 |

## できるページ

- `/` 今日の問題（日付はブラウザの時計で決まります）
- `/puzzle/2026-11-02/` 日付ごとの問題（その日の0時に追加）
- `/puzzle/2026-11-02/answer/` 解き方（翌日に公開）
- `/archive/` 過去問、`/practice/` 練習問題、`/guide/` 遊び方とコツ
- `/about/` 運営者情報、`/privacy/` プライバシーポリシー、`/contact/` お問い合わせ

## 手元で確かめる

Node.js 20 以上で動きます。

```
node build.js --today=2026-11-03
npx serve dist
```

## 公開する（GitHub Pages）

1. GitHubで新しいリポジトリを作り、このフォルダの中身をすべて入れる
2. リポジトリの Settings → Pages → Build and deployment の Source を「GitHub Actions」にする
3. Actions タブで daily-build を一度手動で実行する（Run workflow）
4. 表示されたURLで公開されます。以後は毎日0時すぎに自動で更新されます

独自ドメインを使う場合は、Settings → Pages → Custom domain に入力し、ドメイン側でDNSを設定します。

## 公開前に config.json を埋める

| 項目 | 内容 |
| --- | --- |
| `siteUrl` | 公開URL（例 `https://example.com`）。共有文・検索用の設定・サイトマップに使います |
| `operator` | 運営者名（ペンネーム可） |
| `contactEmail` | 問い合わせ先メールアドレス |
| `instagram` | インスタのURL |
| `bookUrl` / `bookTitle` | 本の販売ページ。入れると結果画面に本の案内が出ます |
| `adsenseClient` / `adsenseSlot` | Google アドセンスの審査に通ったら入れます。空のあいだは広告を出しません |
| `analyticsToken` | Cloudflare Web Analytics のトークン（任意） |

空欄の項目は、ページ上に【運営者名】のような仮の表示が出ます。

## 注意

- GitHubの定時実行は、混雑時に数分〜数十分遅れることがあります。トップページは日付をブラウザで決めるので、遅れても今日の問題は遊べます
- 答えはページのプログラムから計算できてしまいます。遊びのパズルなので割り切っていますが、ランキングなど不正を防ぎたい機能を足すときは見直してください
- 通知（プッシュ通知）には送信用のサーバーが必要なため、まだ入っていません。ホーム画面への追加とオフラインでの表示には対応しています
