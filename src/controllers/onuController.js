const TelnetClient = require("../utils/telnetClient");
const OnuModel = require("../models/onuModel");

class OnuController {
  static async getAllOnu(req, res) {
    try {
      const data = await OnuModel.getAll();
      res.json(data);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Terjadi kesalahan", error: error.message });
    }
  }

  static async getOnuByInet(req, res) {
    const inet = req.body.no_internet || null;
    const olt = new TelnetClient();
    try {
      if (!inet) {
        return res.json({
          success: false,
          data: "Nomor Internet diperlukan",
        });
      }

      let onu = null;
      onu = await OnuModel.getByNoInternet(inet);
      if (!onu) {
        return res.json({
          success: false,
          data: "Data ONU tidak ditemukan",
        });
      }

      if (onu.status === "unverifed") {
        return res.json({
          success: true,
          no_auth: true,
          data: {
            ...onu,
            message: "ROUTER INI BELUM DI AKTIFASI DENGAN PELANGGAN",
          },
        });
      }

      await olt.connect();
      await olt.sendCommand("enable");

      let router = null;

      const onuInfoRaw = await olt.sendCommand(
        `show onu info epon ${onu.epon_port} ${onu.onu_id}`
      );
      router = olt.parseOnuInfo(onuInfoRaw);

      let optical_info = null;

      if (router.online_status === "Up") {
        const opticalInfoRaw = await olt.sendCommand(
          `show onu optical-ddm epon ${onu.epon_port} ${onu.onu_id}`
        );
        optical_info = olt.parseOpticalInfo(opticalInfoRaw);
      }

      return res.json({
        success: true,
        data: { ...onu, router, optical_info },
      });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    } finally {
      olt.disconnect();
    }
  }

  static async rebootOnu(req, res) {
    const inet = req.body.no_internet || null;
    const olt = new TelnetClient();
    try {
      if (!inet) {
        return res.status(400).json({ message: "Nomor Internet diperlukan" });
      }

      let onu = null;
      onu = await OnuModel.getByNoInternet(inet);
      if (!onu) {
        return res.status(404).json({ message: "Data ONU tidak ditemukan" });
      }

      await olt.connect();
      await olt.sendCommand("enable");

      const response = await olt.sendCommand(
        `show onu info epon ${onu.epon_port} ${onu.onu_id}`
      );
      const onuInfo = olt.parseOnuInfo(response);

      if (onuInfo.online_status !== "Up") {
        return {
          success: false,
          message: `ONU ${onu.epon_port}:${onu.onu_id} tidak online. Reboot dibatalkan.`,
        };
      }

      await olt.sendCommand("configure terminal");
      await olt.sendCommand(`interface epon ${onu.epon_port}`);
      await olt.sendCommand(`onu ${onu.onu_id} reboot`);
      await olt.sendCommand("exit");
      await olt.sendCommand("exit");

      res.json({
        success: true,
        message: `ONU Router ${onuInfo.onu_name} berhasil direboot`,
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

module.exports = OnuController;
