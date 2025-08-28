const fs = require("fs");
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image`);
  }
  // get the file name from the content-disposition header
  const contentDisposition = response.headers.get("content-disposition");
  const fileName = contentDisposition.split("filename=")[1].replace(/"/g, "");
  // Get the binary data as an array buffer
  const arrayBuffer = await response.arrayBuffer();
  // Convert the array buffer to a buffer
  const buffer = Buffer.from(arrayBuffer);
  // if files directory does not exist, create it
  const dir = __dirname + "/files";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const fp = `${dir}/${fileName}`;
  fs.writeFileSync(fp, buffer);
  return fp;
}

async function removeImage(fp) {
  fs.unlinkSync(fp);
}

module.exports = { downloadImage, removeImage };