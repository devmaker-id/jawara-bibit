process.env.TZ = "Asia/Jakarta";

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const oltRoutes = require("./src/routes/oltRoutes");
const userRoutes = require("./src/routes/userRoutes");
const onuRoutes = require("./src/routes/onuRoutes");
const teleRoute = require("./src/routes/telegramRoute");

//telegram routes
app.use(bodyParser.json());
app.use("/api/telegram", teleRoute);

//api routes
app.use("/api/olt", oltRoutes);
app.use("/api/onu", onuRoutes);

app.use("/auth", userRoutes);

app.listen(3000, () => {
  console.log(
    "Timezone sekarang:",
    new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  );
  console.log("Server berjalan di http://localhost:3000");
});
