# Jawara Bibit v1 (Beta)

Jawara Bibit adalah aplikasi berbasis Node.js yang digunakan untuk mengelola data ONU dan melakukan pengecekan status ONU melalui OLT. Aplikasi ini menggunakan database MariaDB dan memiliki sistem autentikasi berbasis API Key.

## bahan pendukung

```
1. termux         -> buat jalankan nodjs
2. api client     -> app android, rest api
3. acode          -> app android, coding
4. ngrok          -> run in termux, debug tele
```

## Fitur

- **Manajemen Data ONU**: Menyimpan informasi ONU, termasuk nomor internet, lokasi, EPON port, dan statusnya.
- **Pengecekan Status ONU**: Menghubungkan ke OLT melalui Telnet untuk mendapatkan status ONU secara real-time.
- **Autentikasi API Key**: Setiap request harus menyertakan API Key untuk keamanan.
- **Endpoint REST API**: Mendukung berbagai metode seperti `GET`, `POST`, dan lainnya.

## Perangkat yang Digunakan

- **Debian 11**: Sebagai server unit
- **Olt Hisfocus 4p**: unit olt yg saya gunakan

```
Current configuration:
 MAC          : xx:xx:xx:xx:xx:xx
 Name         : OLT_JAWARA_BIBIT
 Description  : Jawara Bibit
 Location     : jawara-bibit.local
 Model        : OLT -> (4P1GM)
 Software     : V2.2.67
 RevisionDate : 20240513
 Hardware     : V6.0
 SN           : SN2023-xx-xxxx
 UpTime       : 725 days 2 hours 56 minites 24 seconds
```

## aturan pada olt hisfocus 4P1GM

- tag name di onu saya gunakan sebagai no internet
  diguanakan untuk kecocokan data olt dan data dari database

jika anda kecocokan dalam OLT yang digunakan, jangan ragukan lagi, app ini pasti jalan.

## Teknologi yang Digunakan

- **Node.js**: Sebagai backend utama
- **Express.js**: Framework untuk membuat API
- **MariaDB**: Database penyimpanan data ONU
- **Telnet Client (net)**: Untuk komunikasi dengan OLT

## aksess awal default

untuk aksess api key default

```
username  : admin
password  : admin123
api_key   : d643b321fe51c359d6b1d045407a2de2916d1c9db0f0c2c8f43c59d5c0b1558a
```

## url /auth (jalankan saat debug saja)

```
/register -> buat akun serta api-key
/login    -> cek login -> butuh x-api-key
/me       -> lihat profile -> butuh x-api-key
```

## url /api/onu

```
/           -> melihat semua onu -> jangan di live
/get-onu    -> lihat onu dengan nomor internet -> butuh x-api-key
/reboot-onu -> reboot onu dengan nomor internet -> butuh x-api-key
```

## url /api/olt

```
/int-network  -> lihat ip network -> butuh x-api-key
/system-info  -> lihst system info -> butuh x-api-key
```

## Instalasi

Pastikan Anda memiliki Node.js dan MariaDB terinstal. Kemudian ikuti langkah-langkah berikut:

```sh
git clone https://github.com/devmaker-id/jawara-bibit.git
cd jawara-bibit
npm install
cp env.example .env
```

## Panduan Pembuatan Database

Buatlah database contoh : `db_isp`

## 1. Persiapan

Pastikan Anda memiliki:

- MySQL atau MariaDB sudah terinstal di server
- Akses ke phpMyAdmin, MySQL CLI, atau aplikasi database lainnya

## 2. Membuat Database

Jalankan perintah berikut di MySQL CLI atau phpMyAdmin:

```sql
CREATE DATABASE db_isp;
USE db_isp;
```

## membuat table ONU

```
CREATE TABLE `tbl_onu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no_internet` varchar(50) NOT NULL,
  `nama` varchar(255) NOT NULL,
  `lokasi` varchar(255) NOT NULL,
  `epon_port` varchar(10) NOT NULL,
  `onu_id` int(11) NOT NULL,
  `onu_mac` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## membuat table users

```
CREATE TABLE `tbl_users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `api_key` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

## update 26 Maret 2025

- configurasi .env update
- menambah axios module
- menambah telegram bot
- format tanggal waktu

## env.example -> .env

```
#set time zone
TZ=Asia/Jakarta

#database
DB_HOST=
DB_USER=
DB_PASS=
DB_NAME=db_isp
DB_PORT=3306

#telnet
OLT_HOST=
OLT_PORT=23
OLT_USER=
OLT_PASS=
OLT_ENCOD=ascii

# Telegram Bot Data
TELEGRAM_BOT_TOKEN=
DOMAIN=https://0653-140-213-30-156.ngrok-free.app

```

## folder map

```
jawara-bibit
|-src/
| |-utils/
| | |-> telegramBot.js
| | |-> dateHelper.js
```

## url /api/telegram

```
/webhook        -> handler webhook
/set-webhook    -> POST   -> [url_web] butuh x-api-key
/info-webhook   -> GET    -> butuh x-api-key
/delete-webhook -> DELETE -> butuh x-api-key
```

## UPDATE 28/03/2025

```
1. Memperbaiki dialog pendaftaran
perintah telegram /daftar

2. menampilkan perintah Bot
a. /i <no_internet>     -> cek detail onu, pelanggan
b. /info                -> info id tele, dan username
c. /daftar              -> masuk dialog daftar
d. /batal               -> batalkan pendaftaran
kasus ini masih jauh dari sempurna
```

## update 29/03/2025

```
menambah route baru untuk keperluan baca log dari olt
/api/olt/log      -> POST method, relatip saat ini ga pake apiKey

```

## masuk ke rsyslog

ini untuk menangkap log dari olt, untuk kepentingan singkronisasi ONU
buat file bash, saya akan gunakan curl aja, dan diterima oleh nodjs kembali dengan post

```
buat file baru di server linux
jawara-bibit@root# nano nodejs_log.sh

#!/bin/bash

# Baca log dari rsyslog (STDIN)
while read log; do
    curl -X POST "http://localhost:5000/api/olt/log" \
        -H "Content-Type: application/json" \
        -d "{\"log\": \"$log\"}"
done

ctrl + x
jawara-bibit@root# chmod +x nodejs_log.sh

buat file baru di /etc/rsyslog.d/(disini).conf
jawara-bibit@root# nano /etc/rsyslog.d/olt.conf
#dari sini
#192.168.1.254 -> ip olt kalian
module(load="omprog")   # Pastikan omprog dimuat

if $fromhost-ip == '192.168.1.254' then {
    action(
        type="omprog"
        binary="/home/olt/send_log.sh"
    )
}
#sampai sini

ctrl + x
jawara-bibit@root# systemctl restart rsyslog
jawara-bibit@root# systemctl status rsyslog

```

## buat table baru di database tb_onu_unauth

ini untuk menyimpan onu yang baru dengan nama = NA, untuk kemudian di auth dengan nomor internet, kami sebut aktifasi

```
CREATE TABLE tb_onu_unauth (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) DEFAULT 'NA',
    mac_onu VARCHAR(17) NOT NULL UNIQUE,
    epon_port VARCHAR(50) NOT NULL,
    onu_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

```

## memperbaiki perintah /auth

memperbaiki perintah /auth telgram untuk aktifasi onu baru dengan pelanggan baru

```
perintah lama
/auth <mac_onu> <pon_port>

perintah update
/auth <mac_onu> <no_internet>

topologinya,
1. pendaftaran pelanggan dengan perintah /daftar. salin nomor internet
2. hubungkan onu ke olt, sampai terdeteksi mac nya akan tampil.
3. gunakan perintah di atas, untuk menghubungnkan onu dan data pelanggan

4. jiak anda mencari /i <no_internet> akan menampilkan detail onu dan info pelanggan
```

#minal aidzin walfaidzin mohon maaf lahir dan batin 30 Maret 2025
