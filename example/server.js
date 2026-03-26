import express from "express";
import fetch from "node-fetch";
import path from "path";

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.use("/framework", express.static(path.resolve("../framework/dist")));

app.get("/api/weather", async (req, res) => {
  const city = req.query.city || "johvi";
  const url = `https://ilm.ee/sisu/2015/json_reaal_linn.php3?linn=L*${city}*0`; //?linn=L*johvi*0
  const r = await fetch(url);
  const text = await r.text();
  res.send(text);
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));