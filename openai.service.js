const fs = require("fs");
const createAssistant = async (openai) => {
    const assistantFilePath = "assistant.json";
    if (!fs.existsSync(assistantFilePath)) {
        const file = await openai.files.create({
            file: fs.createReadStream("knowledge.docx"),
            purpose: "assistants",
        });
        let vectorStore = await openai.beta.vectorStore.create({
            name: "Chat Demo",
            file_ids: [file.id],
        });
        const assistant = await openai.beta.assistants.create({
            name: "Chat Demo",
            instructions: fs.readFileSync("instructions.txt", "utf-8"),  // Give insructions (system prompt)
            tools: [{ type: "file_search" }],
            tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } }, // Vector store so to use the knowledge base
            model: "gpt-4o",
        });
        fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
        return assistant;
    }else{
        const assistant = JSON.parse(fs.readFileSync(assistantFilePath));
        return assistant;
    }
};

module.exports = { createAssistant };