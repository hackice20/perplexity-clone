import dotenv from "dotenv";
import express from "express";

import { getAiAnswer } from "./ai.js";
import { env } from "./env.js";
import { search, fetchFromSearchResults } from "./search.js";

dotenv.config();

const app = express();

// cors
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/search", async (req, res) => {
  const userQuery = req.query.q;
  if (typeof userQuery !== "string") {
    res.status(400).json({ error: "No query provided" });
    return;
  }

  const results = await search(userQuery);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // send sources first
  res.write(`data: ${JSON.stringify(results)}\n\n`);

  // fetch text for each source
  const searchResultsWithText = (await fetchFromSearchResults(results)).filter(({ text }) => text);
  const context = searchResultsWithText
    .map(
      (result, i) => `
[${i + 1}] ${result.link}
Title: ${result.title}
${result.text || result.snippet}`
    )
    .join("\n\n");

  console.log("context:", context);

  const answer = await getAiAnswer(userQuery, context);
  if (typeof answer === "string") {
    throw Error("/search: answer is unexpectedly a string");
  }

  // stream response
  answer.pipe(res);
});

app.listen(env.PORT, () => {
  console.log(`🏃‍♂️ Server is running on port ${env.PORT}`);
});
