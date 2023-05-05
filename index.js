const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();
const path = require("path");
const api = express.Router();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

api.post("/scores", async (req, res) => {
  const { username, score } = req.body;

  const result = await prisma.score.create({
    data: {
      username,
      score,
    },
  });

  res.json(result);
});

api.get("/scores", async (req, res) => {
  const scores = await prisma.score.findMany({
    orderBy: {
      score: "desc",
    },
  });

  res.json(scores);
});

api.get("/scores/top10", async (req, res) => {
  const top10Scores = await prisma.score.findMany({
    orderBy: {
      score: "desc",
    },
    take: 10,
  });

  res.json(top10Scores);
});

app.use("/api", api);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
