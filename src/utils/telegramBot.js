const axios = require("axios");
require("dotenv").config();

class TelegramBot {
  static async sendMessage(chatId, text) {
    try {
      const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

      const response = await axios.post(
        url,
        {
          chat_id: chatId,
          text: text,
          parse_mode: "Markdown",
        },
        {
          timeout: 5000, // Tambahkan timeout 5 detik
        }
      );

      return response.data;
    } catch (error) {
      console.error(
        "Error sending message:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

module.exports = TelegramBot;
