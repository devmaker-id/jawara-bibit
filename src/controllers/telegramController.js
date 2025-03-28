const axios = require("axios");
const { formatDate } = require("../utils/dateHelper");
const { generateNomorInternet } = require('../utils/ispHelper');
const TelegramBot = require("../utils/telegramBot");
const OnuModel = require("../models/onuModel");
const PaketModels = require("../models/paketModel");
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
          await TelegramBot.sendMessage(chatId, "❌ Format salah. Gunakan\n`/i <nomor_internet>`. \nContoh: `/i 971000213`.");
        }
      } else {
        await TelegramBot.sendMessage(chatId, "❌ Masukkan nomor internet. \nContoh: `/i 971000213`.");
      }
    } else if (command === "/info") {
      let userInfo = `👤 Info Id Telegram\n`;
      userInfo += `ID Chat: ${chatId}`;
      
      await TelegramBot.sendMessage(chatId, userInfo);
    } else if (command === "/paket") {
      return await TelegramController.infoPaketWifi(chatId);
    } else if (command === "/daftar") {
      return await TelegramController.startRegistration(chatId);
    } else if (command === "/batal") {
      return await TelegramController.cancelRegistration(chatId);
    } else if (command === "/auth") {
      if (commandParts.length > 1) {
        const nomorInternet = commandParts[1];
        if (/^\d+$/.test(nomorInternet)) {
          await TelegramBot.sendMessage(chatId, `Tunggu\nProsess aktifasi ${nomorInternet} ...`);
        } else {
          await TelegramBot.sendMessage(chatId, "❌ Format salah. Gunakan\n`/auth <nomor_internet>`. \nContoh: `/auth 971000213`.");
        }
      } else {
        await TelegramBot.sendMessage(chatId, "❌ Aktifasi Modem. \nContoh: `/auth 971000213`.");
      }
    } else if (activeRegistrations[chatId]) {
      return await TelegramController.handleRegistrationStep(chatId, text);
    } else {
      let chatListComm = "Bot Jawara Bibit. \n";
      chatListComm += "`/info` -> info id telegram\n";
      chatListComm += "`/paket` -> list paket wifi\n";
      chatListComm += "`/i <nomor_internet>` -> cek onu pelanggan\n";
      chatListComm += "`/auth <nomor_internet>` -> aktifasi router\n";
      chatListComm += "`/daftar` -> pendaftaran pelanggan\n";
      chatListComm += "`/batal` -> Batal Daftar\n\n";
      chatListComm += "sys Jawara Bibit";
      await TelegramBot.sendMessage(chatId, chatListComm);
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
    activeRegistrations[chatId] = {
      step: 1,
      data: {}
    };
    await TelegramBot.sendMessage(chatId, "📝 Masukkan nama pelanggan:");
  }
  
  static async handleRegistrationStep(chatId, text) {
    const session = activeRegistrations[chatId];
    if (!session) return;
    const paketData = await PaketModels.getAll();
    const paketOptions = {};
    if(paketData) {
      // Membentuk objek paketOptions
      paketData.forEach((paket, index) => {
        paketOptions[index + 1] = `${paket.speed} - Rp ${paket.harga.toLocaleString("id-ID")}/bulan`;
      });
    } else {
      await TelegramController.cancelRegistration(chatId);
    }

    if (session.confirmationStep) {
      if (text.toLowerCase() === "tidak") {
        session.confirmationStep = false;
        await TelegramController.askNextQuestion(chatId, session.step, true);
      } else if (text.toLowerCase() === "ya") {
        session.confirmationStep = false;
        session.step++;
        if (session.step > 6) {
          console.log('SESSION: \n', session);
          await TelegramController.submitRegistration(chatId, session);
          delete activeRegistrations[chatId];
        } else {
          await TelegramController.askNextQuestion(chatId, session.step);
        }
      } else {
        await TelegramBot.sendMessage(chatId, "❌ Jawaban tidak valid. Ketik *ya* untuk lanjut atau *tidak* untuk mengulang.");
      }
      return;
    }

    switch (session.step) {
      case 1:
        const no_inet = generateNomorInternet();
        session.no_internet = no_inet;
        session.data.nama = text;
        break;

      case 2:
        session.data.telepon = text;
        break;
      
      case 3:
        session.data.email = text;
        break;
      
      case 4:
        session.data.lokasi = text;
        break;
      
      case 5:
        session.data.alamat = text;
        break;
      
      case 6:
        const paketNumber = parseInt(text);
        if (paketOptions[paketNumber]) {
          session.data.paket = paketOptions[paketNumber];
        } else {
          await TelegramBot.sendMessage(chatId, "❌ Paket tidak valid. Pilih nomor 1-4 sesuai daftar paket.");
          return;
        }
        break;


      default:
        await TelegramBot.sendMessage(chatId, "❌ Terjadi kesalahan. Silakan mulai ulang pendaftaran.");
        delete activeRegistrations[chatId];
        return;
    }

    session.confirmationStep = true;
    await TelegramBot.sendMessage(chatId, `✅ ${Object.keys(session.data)[session.step - 1]}: *${text}*\nApakah sudah benar? (Ketik *ya* atau *tidak*)`);
  }

  static async askNextQuestion(chatId, step, isRetry = false) {
    
    const paketData = await PaketModels.getAll();
    let paketList = "";
    if(paketData) {
      paketList = "Masukkan paket pelanggan:\n";
      paketData.forEach((paket, index) => {
        paketList += `${index + 1}. ${paket.speed} - Rp ${paket.harga.toLocaleString("id-ID")}/bulan\n`;
      });
      paketList += "\nKetik nomor paket yang diinginkan:";
    } else {
      paketList += "Tidak ditemukan daftar paket\n";
      paketList += "/batal, batalkan pendaftaran\n";
      paketList += "hubungi tim support, untuk bantuan";
    }
  
    const questions = {
      1: "Masukkan nama pelanggan:",
      2: "Masukkan telepon pelanggan:",
      3: "Masukkan e-mail pelanggan:",
      4: "Masukkan pin google map pelanggan:",
      5: "Masukkan alamat lengkap pelanggan:",
      6: paketList
    };

    if (questions[step]) {
      const message = isRetry ? `🔄 Silakan masukkan ulang ${questions[step].split("Masukkan ")[1]}` : questions[step];
      await TelegramBot.sendMessage(chatId, message);
    } else {
      await TelegramBot.sendMessage(chatId, "❌ Tidak ada pertanyaan untuk step ini.");
    }
  }

  static async submitRegistration(chatId, session) {
    const data = session.data;
    const dataBaru = {
      no_internet: session.no_internet,
      nama: data.nama,
      lokasi: data.lokasi,
      epon_port: "0/0",
      onu_id: "0",
      onu_mac: "FF:EE:DD:CC:BB:AA",
      status: "unverifed",
      telepon: data.telepon,
      email: data.email,
      paket: data.paket,
      alamat_lengkap: data.alamat,
    };
    
    try {
      //const result = await OnuModels.tambahOnu(dataBaru);
      console.log("Data ONU:\n", dataBaru);
      
      let message = `✅ *Pendaftaran Berhasil!*\n\n`;
      message += `*No Inet:* \`${dataBaru.no_internet}\`\n`;
      message += `*Nama:* ${dataBaru.nama}\n`;
      message += `*Telepon:* ${dataBaru.telepon}\n`;
      message += `*Email:* ${dataBaru.email}\n`;
      message += `*Paket:* ${dataBaru.paket}\n`;
      message += `*Alamat:* ${dataBaru.alamat_lengkap}\n`;
      message += `*Google map:* ${dataBaru.lokasi}\n\n`;
      message += `Terima kasih telah mendaftar! 🎉\n`;
      message += `Segera lakukan aktifasi router`;
      
      await TelegramBot.sendMessage(chatId, message);
    } catch (error) {
      console.error("Gagal menambah data ONU:", error);
    }
  }

  static async cancelRegistration(chatId) {
    if (activeRegistrations[chatId]) {
      delete activeRegistrations[chatId];
      await TelegramBot.sendMessage(chatId, "❌ Pendaftaran dibatalkan.");
    } else {
      await TelegramBot.sendMessage(chatId, "⚠️ Tidak ada pendaftaran yang sedang berlangsung.");
    }
  }
  
  static async infoPaketWifi(chatId) {
    const paketData = await PaketModels.getAll();
    if(paketData) {
      
      // Membuat format string daftar paket
      let paketList = "Masukkan paket pelanggan:\n";
      paketData.forEach((paket, index) => {
        paketList += `${index + 1}. ${paket.speed} - Rp ${paket.harga.toLocaleString("id-ID")}/bulan\n`;
      });
      
      const paketOptions = {};
      paketData.forEach((paket, index) => {
        paketOptions[index + 1] = `${paket.speed} - Rp ${paket.harga.toLocaleString("id-ID")}/bulan`;
      });
      
      console.log(paketOptions)
      await TelegramBot.sendMessage(chatId, paketList);
    } else {
      await TelegramBot.sendMessage(chatId, "❌ paket list ga ada.");
    }
  }

}

module.exports = TelegramController;
