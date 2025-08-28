const fs = require("fs");
const instructions = fs.readFileSync("instructions.txt", "utf8");
const { removeImage, downloadImage } = require("./utilities.service");
const knowledgeBaseFilePath = "knowledge_base.pdf";
const productsFilePath = "products.xlsx";

const createAssistant = async (openai) => {
  // Assistant file path
  const assistantFilePath = "assistant.json";
  // check if file exists
  if (!fs.existsSync(assistantFilePath)) {
    // Create a file
    const knowledgeFile = await openai.files.create({
      file: fs.createReadStream(knowledgeBaseFilePath),
      purpose: "assistants",
    });

    // Create a vector store including our file
    let vectorStore1 = await openai.beta.vectorStores.create({
      name: "Beauty store consultant vector store",
      file_ids: [knowledgeFile.id],
    });

    const productsFile = await openai.files.create({
      file: fs.createReadStream(productsFilePath),
      purpose: "assistants",
    });

    // Create assistant
    const assistant = await openai.beta.assistants.create({
      name: "Beauty store consultant",
      instructions,
      tools: [{ type: "file_search" }, { type: "code_interpreter" }],
      tool_resources: {
        file_search: { vector_store_ids: [vectorStore1.id] },
        code_interpreter: { file_ids: [productsFile.id] },
      },
      model: "gpt-4o",
    });

    // Write assistant to file
    fs.writeFileSync(assistantFilePath, JSON.stringify(assistant));
    return assistant;
  } else {
    // Read assistant from file
    const assistant = JSON.parse(fs.readFileSync(assistantFilePath));
    return assistant;
  }
};

const uploadImage = async (openai, url) => {
  const fp = await downloadImage(url);
  // console.log("create file");
  const file = await openai.files.create({
    file: fs.createReadStream(fp),
    purpose: "vision",
  });
  await removeImage(fp);
  return file.id;
};

module.exports = { createAssistant, uploadImage };