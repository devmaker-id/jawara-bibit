const net = require("net");
require("dotenv").config();

class TelnetClient {
  constructor() {
    this.socket = new net.Socket();
    this.buffer = "";
    this.isLoggedIn = false;
    this.isUsernameSent = false;
    this.isPasswordSent = false;
    this.commandQueue = [];
    this.isCommandRunning = false;
    this.responseCallback = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket.connect(process.env.OLT_PORT, process.env.OLT_HOST, () => {
        console.log(`TELNET Connected ${process.env.OLT_HOST}`);
      });

      this.socket.setEncoding("ascii");
      this.socket.on("data", (data) => this.handleData(data));
      this.socket.on("error", (err) => reject(`Error: ${err.message}`));
      this.socket.on("close", () => console.log("Koneksi Telnet ditutup"));

      this.loginCallback = resolve;
    });
  }

  handleData(data) {
    this.buffer += data.toString();

    if (!this.isUsernameSent && /Username:/.test(this.buffer)) {
      this.socket.write(process.env.OLT_USER + "\r\n");
      this.isUsernameSent = true;
      this.buffer = "";
    } else if (
      this.isUsernameSent &&
      !this.isPasswordSent &&
      /Password:/.test(this.buffer)
    ) {
      this.socket.write(process.env.OLT_PASS + "\r\n");
      this.isPasswordSent = true;
      this.buffer = "";
    } else if (/OLT_BIBITNET>/.test(this.buffer) && !this.isLoggedIn) {
      console.log("Terminal Telnet Terbuka...");
      this.isLoggedIn = true;
      this.buffer = "";
      if (this.loginCallback) this.loginCallback();
    } else if (/Incorrect passwd!/.test(this.buffer)) {
      console.log("Password salah! Menutup koneksi...");
      this.socket.end();
    } else if (this.isCommandRunning) {
      if (!this.buffer.includes("--- Enter Key To Continue ----")) {
        if (this.responseCallback) {
          this.responseCallback(this.buffer);
          this.responseCallback = null;
          this.isCommandRunning = false;
        }
      }
    }

    if (
      this.isLoggedIn &&
      this.commandQueue.length > 0 &&
      !this.isCommandRunning
    ) {
      this.executeNextCommand();
    }
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      this.commandQueue.push({
        command,
        callback: (response) => {
          resolve(response);
        },
      });

      if (this.isLoggedIn && !this.isCommandRunning) {
        this.executeNextCommand();
      }
    });
  }

  executeNextCommand() {
    if (this.commandQueue.length === 0) return;

    this.isCommandRunning = true;
    const { command, callback } = this.commandQueue.shift();
    console.log(`<- Write Command: ${command}`);
    this.socket.write(command + "\r\n");

    this.responseCallback = callback;

    setTimeout(() => {
      if (this.isCommandRunning) {
        this.isCommandRunning = false;
        if (this.responseCallback) {
          this.responseCallback("TimeOUT Next perintah, OLT Ga respon");
          this.responseCallback = null;
        }
      }
    }, 3000);
  }

  parseNetworkOlt(response) {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);

    let data = {};
    let currentSection = null;

    for (let line of lines) {
      if (line.endsWith("network:")) {
        currentSection = line.replace(" network:", "").toLowerCase();
        data[currentSection] = {};
      } else {
        let match = line.match(/^(.+?)\s+:\s+(.+)$/);
        if (match && currentSection) {
          let key = match[1].trim().replace(/\s+/g, "_").toLowerCase();
          let value = match[2].trim();
          data[currentSection][key] = value;
        }
      }
    }
    return data;
  }

  parseOnuInfo(response) {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    let data = {};

    for (let line of lines) {
      let match = line.match(/^(.+?)\s+:\s+(.+)$/);
      if (match) {
        let key = match[1].trim().replace(/\s+/g, "_").toLowerCase();
        let value = match[2].trim();
        data[key] = value;
      }
    }
    return data;
  }

  parseOpticalInfo(response) {
    const lines = response
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line);
    let opticalData = {};

    for (let line of lines) {
      let match = line.match(/^(.+?)\s+:\s+(.+)$/);
      if (match) {
        let key = match[1].trim().replace(/\s+/g, "_").toLowerCase();
        let value = match[2].trim();
        opticalData[key] = value;
      }
    }

    return {
      temperature: opticalData.temperature,
      voltage: opticalData.voltage,
      txbias: opticalData.txbias,
      txpower: opticalData.txpower,
      rxpower: opticalData.rxpower,
    };
  }

  saveConfigOlt() {
    this.sendCommand("enable");
    this.sendCommand("write");
    setTimeout(() => {
      this.sendCommand("exit");
    }, 5000); // waktu tunggu olt save config 3-5 detik saya set di 5 detik
  }

  disconnect() {
    this.sendCommand("quit");
    this.socket.end();
  }
}

module.exports = TelnetClient;
