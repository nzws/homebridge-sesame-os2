# @nzws/homebridge-sesame-os2

> Homebridge Plugin for SESAME OS2 (SESAME3)

## Install

```bash
npm install -g @nzws/homebridge-sesame-os2
```

## Config

```json
{
  "accessory": "SESAMEOS2",
  "name": "Home Key",
  "uuid": "",
  "secret": "",
  "accessToken": "",
  "statusUpdateIntervalSec": 60,
  "displayName": "Homebridge"
}
```

- config
  - `uuid`: アプリの鍵設定画面から取得
  - `secret`: 鍵の共有 QR コードの `sk` パラメータから取得
    - QR コードを生成して読み取って `ssm://UI?t=sk&sk=[secret]&l=...` の部分
  - `accessToken`: https://dash.candyhouse.co/ から取得
  - `statusUpdateIntervalSec`: 鍵の状態の更新秒数 (デフォルト: 60 秒)
  - `displayName`: 履歴の表示名 (デフォルト: Homebridge)

## Contact

- Mastodon: [@nzws@don.nzws.me](https://don.nzws.me/@nzws)
