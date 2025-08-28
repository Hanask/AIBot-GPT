const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const { uploadImage } = require("./openai.service");
app.use(cors());
app.use(bodyParser.json());

const fs = require("fs");

(async () => {
  app.get("/start", async (req, res) => {
    const thread = await openai.beta.threads.create();
    return res.json({ thread_id: thread.id });
  });

  app.post("/chat", async (req, res) => {
    try {
      const assistantId = "asst_jwDP9hXJU8Q5FEsazycoO5b9";
      const threadId = req.body.thread_id;
      const message = req.body.message;
      if (!threadId) {
        return res.status(400).json({ error: "Missing thread_id" });
      }
      // const response = fs.readFileSync("response.txt", "utf8");
      console.log("Message received: ", message.text, message.image_url || "");
      const newMessage = {
        role: "user",
        content: [],
      };
      if (message.text) {
        newMessage.content.push({ type: "text", text: message.text });
      }
      if (message.image_url) {
        // const { data, mimeType } = await downloadImage(message.image_url);
        const fileId = await uploadImage(openai, message.image_url);
        // console.log("File ID: ", fileId);
        newMessage.content.push({
          type: "image_file",
          image_file: {
            file_id: fileId,
          },
        });
      }
      console.log("Question: ", message.text);
      await openai.beta.threads.messages.create(threadId, newMessage);
      console.log("=RUN=");
      const run = await openai.beta.threads.runs.createAndPoll(threadId, {
        assistant_id: assistantId,
      });
      console.log("=Get Messages=");
      const messages = await openai.beta.threads.messages.list(run.thread_id);
      // console.log(JSON.stringify(messages.data));
      console.log("=Cleaning the response=");
      let response = messages.data[0].content[0].text.value;
      const pattern = /【.*?】/g;
      const matches = response.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          response = response.replace(match, "");
        });
      }
      console.log("Answer: ", response);
      return res.json({ response: response });
    } catch (error) {
      console.log("Error: ", error);
      return res.json({
        response:
          "Sorry. I'm having a problem answering this. Please ask something different",
      });
    }
  });

  app.listen(8080, () => {
    console.log("Server running on port 8080");
  });
})();