require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

app.post("/api/roast", async (req, res) => {
  const { input, emoji } = req.body;

  try {
    const result = await axios.post("https://api.shapes.inc/v1/chat/completions", {
      model: process.env.SHAPE_MODEL,
      messages: [
        {
          role: "user",
          content: `Roast me with the mood "${emoji}" based on: ${input}`,
        },
      ],
    }, {
      headers: {
        Authorization: `Bearer ${process.env.SHAPES_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    res.json({ roast: result.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Roast API failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3018;
app.listen(PORT, () => {
  console.log(`🔥 Roast.SaaS running at http://localhost:${PORT}`);
});
