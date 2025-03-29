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

      const regex =
        /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] ONU (\d+\/\d+:\d+)\s+\[\s*([0-9A-F:]+)\s*\] \[(.*?)\] (linkup|linkdown)/;
      const match = logData.match(regex);

      if (match) {
        const parsedLog = {
          epon_port: match[1].split(":")[0],
          onu_id: match[1].split(":")[1],
          mac_onu: match[2].toUpperCase(),
          name: match[3].trim(),
          status: match[4],
        };

        //console.log("DATA ONU: \n", parsedLog);

        if (parsedLog.name === "NA" && parsedLog.status === "linkup") {
          const registeredOnu = await OnuModel.findOnuByMac(parsedLog.mac_onu);

          if (!registeredOnu) {
            const teleId = process.env.CHAT_ID_ADMIN;
            const msg =
              `🚨 *ONU Baru Terdeteksi!*\n\n` +
              `🔹 *Info Onu:* ${match[1]}\n` +
              `🔹 *MAC Address:* \`${parsedLog.mac_onu}\`\n` +
              `🔹 *Nama:* ${parsedLog.name}\n` +
              `🔹 *Status:* ${parsedLog.status}\n\n` +
              `⚠️ *Segera lakukan /auth*\n\n` +
              `⚠️ \`/auth ${parsedLog.mac_onu} <no_internet>\`\n` +
              `⚠️ ketuk pin di atas kirimkan balik`;

            await OnuModel.saveUnregisteredOnu(
              parsedLog.mac_onu,
              parsedLog.epon_port,
              parsedLog.onu_id
            );
            await TelegramBot.sendMessage(teleId, msg);
          }
        }

        return res.status(200).json({
          message: "Log diterima",
          data: parsedLog,
        });
      }
      console.log("❌ LOG FORMAT TIDAK DIKENALI:", logData);
      return res.status(422).json({ message: "Log format tidak dikenali" });
    } catch (error) {
      console.error("❌ ERROR:", error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = OltController;
