const TelnetClient = require("../utils/telnetClient");
const OnuModel = require("../models/onuModel");

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
}

module.exports = OltController;
