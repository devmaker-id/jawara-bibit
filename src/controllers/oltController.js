const TelnetClient = require("../utils/telnetClient");
const OnuModel = require("../models/onuModel");
const TelegramBot = require("../utils/telegramBot");

class OltController {
  static async oltInfo(req, res) {
    const olt = new TelnetClient();
    try {
      await olt.connect();
      await olt.sendCommand("enable");
      const systemInfoRaw = await olt.sendCommand("show system");
      const systemInfo = olt.parseOnuInfo(systemInfoRaw);

      return res.json({
        success: true,
        data: systemInfo,
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    } finally {
      olt.disconnect();
    }
  }

  static async intNetwork(req, res) {
    const olt = new TelnetClient();
    try {
      await olt.connect();
      await olt.sendCommand("enable");
      const networkOltRaw = await olt.sendCommand("show network");
      const networkOlt = olt.parseNetworkOlt(networkOltRaw);

      res.json({
        success: true,
        data: networkOlt,
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Terjadi kesalahan", error });
    } finally {
      olt.disconnect();
    }
  }

  static async sysLogServer(req, res) {
    try {
      const logData = req.body.log;
      if (!logData) {
        return res.status(400).json({ message: "Log data is required" });
      }

      const regex =/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] ONU (\d+\/\d+:\d+)\s+\[\s*([0-9A-F:]+)\s*\] \[(.*?)\] (linkup|linkdown)/;
      const match = logData.match(regex);
      
      console.log(match);

      if (match) {
        const parsedLog = {
          epon_port: match[1].split(":")[0],
          onu_id: match[1].split(":")[1],
          mac_onu: match[2].toUpperCase(),
          name: match[3].trim(),
          status: match[4],
        };

      // Cek apakah ONU sudah terdaftar
      const registeredOnu = await OnuModel.findOnuByMac(parsedLog.mac_onu);
      const teleId = process.env.CHAT_ID_GROUP;

      if (registeredOnu) {
      // ONU terdaftar dan mengalami perubahan status (linkup atau linkdown)
        const statusEmoji = parsedLog.status === "linkup" ? "🟢 Online" : "🔴 Offline";
        const msg =
          `📡 *Perubahan Status ONU*\n\n` +
          `🔹 *Nama Pelanggan:* ${registeredOnu.nama || "Tidak Diketahui"}\n` +
          `🔹 *Nomor Internet:* ${registeredOnu.no_internet || "-"}\n` +
          `🔹 *Lokasi:* ${registeredOnu.lokasi || "-"}\n` +
          `🔹 *Info ONU:* ${match[1]}\n` +
          `🔹 *MAC Address:* \`${parsedLog.mac_onu}\`\n` +
          `🔹 *Status:* ${statusEmoji}\n\n` +
          `📌 *Periksa koneksi jika diperlukan.*`;

        await TelegramBot.sendMessage(teleId, msg);
      } else if (parsedLog.name === "NA" && parsedLog.status === "linkup") {
      // Jika ONU belum terdaftar dan terjadi linkup
        const msg =
          `🚨 *ONU Baru Terdeteksi!*\n\n` +
          `🔹 *Info ONU:* ${match[1]}\n` +
          `🔹 *MAC Address:* \`${parsedLog.mac_onu}\`\n` +
          `🔹 *Nama:* ${parsedLog.name}\n` +
          `🔹 *Status:* ${parsedLog.status}\n\n` +
          `⚠️ *Segera lakukan registrasi*\n\n` +
          `⚠️ \`/auth ${parsedLog.mac_onu} <no_internet>\`\n` +
          `⚠️ Ketuk pin di atas kirimkan balik`;

        await OnuModel.saveUnregisteredOnu(
          parsedLog.mac_onu,
          parsedLog.epon_port,
          parsedLog.onu_id
        );
      await TelegramBot.sendMessage(teleId, msg);
      }

      return res.status(200).json({
        message: "Log diterima",
        data: parsedLog,
      });
    }
    return res.status(422).json({ message: "Log format tidak dikenali" });
    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
  }

}

module.exports = OltController;
