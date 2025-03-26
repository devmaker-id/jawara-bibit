const axios = require("axios");
const { formatDate } = require("../utils/dateHelper");
const TelegramBot = require("../utils/telegramBot");
const OnuModel = require("../models/onuModel");
const activeRegistrations = {};

class TelegramController {
  static async handleUpdate(req, res) {
    try {
      const update = req.body;
      //console.log("Update:", update);

      if (update.message) {
        const chatId = update.message.chat.id;
        
        if (!update.message.text) {
          await TelegramBot.sendMessage(chatId, "❌ Maaf, saya hanya bisa memproses pesan teks.");
          return res.sendStatus(200);
        }
            
        const text = update.message.text;
        await TelegramController.processCommand(chatId, text);
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.sendStatus(500);
    }
  }
  
  static async processCommand(chatId, text) {
    const commandParts = text.split(" ");
    const command = commandParts[0].toLowerCase();

    if (command === "/i") {
      if (commandParts.length > 1) {
        const nomorInternet = commandParts[1];
        if (/^\d+$/.test(nomorInternet)) {
          await TelegramBot.sendMessage(chatId, `🔍 Mencari data ${nomorInternet} ...`);
          return await TelegramController.sendRouterInfo(chatId, nomorInternet);
        } else {
          await TelegramBot.sendMessage(chatId, "❌ Format salah. Gunakan `/i <nomor_internet>`. Contoh: `/i 971000213`.");
        }
      } else {
        await TelegramBot.sendMessage(chatId, "❌ Masukkan nomor internet. Contoh: `/i 971000213`.");
      }
    } else if (command === "/info") {
      const userInfo = `👤 Info Pengguna:\nNama: ${chatId}\nID Chat: ${chatId}`;
      await TelegramBot.sendMessage(chatId, userInfo);
    } else if (command === "/daftar") {
      return await TelegramController.startRegistration(chatId);
    } else if (command === "/batal") {
      return await TelegramController.cancelRegistration(chatId);
    } else if (activeRegistrations[chatId]) {
      return await TelegramController.handleRegistrationStep(chatId, text);
    } else {
      await TelegramBot.sendMessage(chatId, "❌ Perintah tidak dikenali. Coba `/info` atau `/i <nomor_internet>`.");
    }
  }
  
  static async setWebhook(req, res) {
    try {
      const url_web = req.body.url_web;
      if (!url_web) {
        return res.status(400).json({ message: "URL webhook diperlukan" });
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const apiUrl = `https://api.telegram.org/bot${botToken}/setWebhook?url=${url_web}/api/telegram/webhook`;

      const response = await fetch(apiUrl);
      const result = await response.json();

      if (result.ok) {
        return res.status(200).json({
          message: "Webhook berhasil diatur",
          result
        });
      } else {
        return res.status(500).json({ message: "Gagal mengatur webhook", error: result });
      }
    } catch (error) {
        console.error("Error setting webhook:", error);
        return res.status(500).json({ message: "Terjadi kesalahan saat mengatur webhook", error: error.message });
    }
  }

  static async getWebhookInfo(req, res) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const apiUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
  
      const response = await fetch(apiUrl);
      const result = await response.json();
  
      if (result.ok) {
        return res.status(200).json({ message: "Info webhook berhasil diambil", result });
      } else {
        return res.status(500).json({ message: "Gagal mengambil info webhook", error: result });
      }
    } catch (error) {
      console.error("Error getting webhook info:", error);
      return res.status(500).json({ message: "Terjadi kesalahan saat mengambil info webhook", error: error.message });
    }
  }

  static async deleteWebhook(req, res) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const apiUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  
      const response = await fetch(apiUrl, { method: "POST" });
      const result = await response.json();
  
      if (result.ok) {
        return res.status(200).json({ message: "Webhook berhasil dihapus", result });
      } else {
        return res.status(500).json({ message: "Gagal menghapus webhook", error: result });
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
      return res.status(500).json({ message: "Terjadi kesalahan saat menghapus webhook", error: error.message });
    }
  }
  
  static async sendRouterInfo(chatId, inet) {
    try {
      // Panggil API dengan POST request
      const apiUrl = "http://localhost:3000/api/onu/get-onu";
      const apiKey = "d643b321fe51c359d6b1d045407a2de2916d1c9db0f0c2c8f43c59d5c0b1558a"; // apikey dari tbl_users

      const response = await axios.post(
        apiUrl,
          { no_internet: inet },
          {
            headers: {
              "x-api-key": apiKey,
              "Content-Type": "application/json"
            }
          }
        );

      if (!response.data.success || !response.data.data) {
        return TelegramBot.sendMessage(chatId, `⚠️ Data tidak ditemukan untuk nomor internet ${inet}.`);
      }
      
      const onu = response.data;
      const { id, no_internet, nama, lokasi, status, telepon, email, paket, alamat_lengkap, created_at, router, optical_info } = onu.data;

      // Cek status router
      const isOnline = router.online_status === "Up";
      
      const infoOpm = (rxpower) => {
        if (!rxpower) return "";
        const rxValue = parseFloat(rxpower);
        if (rxValue > -8.00) {
          return "*🚨 REDAMAN TERLALU KECIL!*";
        } else if (rxValue < -23.00) {
          return "*⚠️ REDAMAN TERLALU BESAR!*";
        }
        return "";
      };

      // Format pesan dengan Markdown
      let message = `🚀 *Jawara BiBiT Monitor* 🚀\n`;
      message += `===================\n`;
      message += `📢 *Informasi Pelanggan* \n`;
      message += `📶 No. Inet: \`${no_internet}\`\n`;
      message += `⚠️ Status: *${status}*\n`;
      message += `👤 Nama: *${nama}*\n`;
      message += `📅 Registred: *${formatDate(created_at, false)}*\n`;
      message += `🔗 Paket: *${paket}*\n`;
      message += `📞 Telepon: *${telepon}*\n`;
      message += `✉️ E-mail: *${email}*\n`;
      message += `📍 Lokasi: *${lokasi}*\n`;
      message += `🏠 Alamat: *${alamat_lengkap}*\n\n`;

      // Tambahkan informasi Router
      message += `🖥 *Informasi Router*\n`;
      message += `===================\n`;
      message += `🖥 Model:  ${router.model_string}\n`;
      message += `🔌 ONU ID: \`${router.onu_id}\`\n`;
      message += `📡 Status Online: *${router.online_status}*\n`;
      message += `✅ Aktivasi: *${router.activate_status}*\n`;
      message += `📅 Uptime Awal: *${router["first-uptime"]}*\n`;
      message += `⏳ Terakhir Online: *${router["last-uptime"]}*\n`;
      message += `📉 Terakhir Offline: *${router["last-offtime"]}*\n`;
      message += `⏱️ Online Time: *${router.onlinetime}*\n\n`;

      // Tambahkan Optical Info jika router online
      if (isOnline && optical_info) {
        message += `💡 *Optical Information*\n`;
        message += `===================\n`;
        message += `🌡️ Temperatur: *${optical_info.temperature}*\n`;
        message += `🔋 Voltage: *${optical_info.voltage}*\n`;
        message += `⚡ TX Bias: *${optical_info.txbias}*\n`;
        message += `📡 TX Power: *${optical_info.txpower}*\n`;
        message += `📥 RX Power: *${optical_info.rxpower}*\n`;
        message += `${infoOpm(optical_info.rxpower)}`;
      } else {
        message += `===================\n`;
        message += `*🚨 ROUTER TERPUTUS, SEGERA PERBAIKI*\n`;
      }

      // Kirim pesan ke Telegram dengan format Markdown
      await TelegramBot.sendMessage(chatId, message);

    } catch (error) {
      console.error("Error fetching router info:", error);
      await TelegramBot.sendMessage(chatId, "❌ Terjadi kesalahan saat mengambil data.");
    }
  }

  static async startRegistration(chatId) {
    activeRegistrations[chatId] = { step: 1, data: {} };
    await TelegramBot.sendMessage(chatId, "📝 Masukkan nama pelanggan:");
  }
  
  static async handleRegistrationStep(chatId, text) {
    const session = activeRegistrations[chatId];
    
    console.log("SESSION:\n", JSON.stringify(activeRegistrations, null, 2)); // Log sesi
  
    if (!session) return;

    if (session.confirmationStep) {
        if (text.toLowerCase() === "tidak") {
            session.step--;
            session.confirmationStep = false;
            await TelegramController.askNextQuestion(chatId, session.step, true);
        } else if (text.toLowerCase() === "ya") {
            session.confirmationStep = false;
            session.step++;
            await TelegramController.askNextQuestion(chatId, session.step);
        } else {
            await TelegramBot.sendMessage(chatId, "❌ Jawaban tidak valid. Ketik *ya* untuk lanjut atau *tidak* untuk mengulang.");
        }
        return;
    }

    switch (session.step) {
        case 1:
            session.data.nama = text;
            session.confirmationStep = true;
            await TelegramBot.sendMessage(chatId, `📍 Nama pelanggan: *${text}*\nApakah sudah benar? (Ketik *ya* atau *tidak*)`);
            break;

        case 2:
            session.data.lokasi = text;
            session.confirmationStep = true;
            await TelegramBot.sendMessage(chatId, `📍 Lokasi pelanggan: *${text}*\nApakah sudah benar? (Ketik *ya* atau *tidak*)`);
            break;

        case 3:
            session.data.paket = text;
            session.confirmationStep = true;
            await TelegramBot.sendMessage(chatId, `🔗 Paket pelanggan: *${text}*\nApakah sudah benar? (Ketik *ya* atau *tidak*)`);
            break;

        case 4:
            await TelegramController.submitRegistration(chatId, session.data);
            delete activeRegistrations[chatId]; // Hapus sesi hanya jika registrasi selesai
            break;
    }
  }

  static async askNextQuestion(chatId, step, isRetry = false) {
    const questions = {
        1: "📍 Masukkan nama pelanggan:",
        2: "📍 Masukkan lokasi pelanggan:",
        3: "🔗 Masukkan paket pelanggan:"
    };

    if (questions[step]) {
        const message = isRetry ? `🔄 Silakan masukkan ulang ${questions[step].split("Masukkan ")[1]}` : questions[step];
        await TelegramBot.sendMessage(chatId, message);
    }
  }

  static async submitRegistration(chatId, data) {
    console.log('Registrasi: \n', data);
    await TelegramBot.sendMessage(chatId, "🚨 Data Sementara, Cek terminal NodJS!");
  }

  static async cancelRegistration(chatId) {
    if (activeRegistrations[chatId]) {
      delete activeRegistrations[chatId];
      await TelegramBot.sendMessage(chatId, "❌ Pendaftaran dibatalkan.");
    } else {
      await TelegramBot.sendMessage(chatId, "⚠️ Tidak ada pendaftaran yang sedang berlangsung.");
    }
  }
    
}

module.exports = TelegramController;
