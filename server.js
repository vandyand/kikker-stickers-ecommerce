const express = require("express");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function generatePriceTable(prices) {
  if (!Array.isArray(prices) || prices.length === 0) {
    return "<p class='text-gray-600'>No price data available</p>";
  }

  let tableHtml = `
    <div class="overflow-x-auto">
      <table class="min-w-full bg-white">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shape</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
            <th class="sr-only">Snipcart Data</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
  `;

  prices.forEach((item, index) => {
    try {
      const rowClass = index % 2 === 0 ? "bg-white" : "bg-gray-50";
      tableHtml += `
        <tr class="${rowClass}">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
            item.shape
          }</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
            item.width
          }" x ${item.height}"</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${
            item.quantity
          }</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${item.price.toFixed(
            2
          )}</td>
          <td class="sr-only">
            <button
              class="snipcart-add-item"
              data-item-id="${item.id}"
              data-item-price="${item.price.toFixed(2)}"
              data-item-url="https://kikker-stickers.github.io/kikker-stickers-ecommerce"
              data-item-description="${item.width} x ${item.height} ${
        item.shape
      } sticker, quantity: ${item.quantity}"
              data-item-image="placeholder.png"
              data-item-name="Custom ${item.shape} Sticker"
              data-item-custom1-name="Shape"
              data-item-custom1-options="${item.shape}"
              data-item-custom2-name="Size"
              data-item-custom2-value="${item.width} x ${item.height}"
              data-item-custom3-name="Quantity"
              data-item-custom3-value="${item.quantity}"
            >
              Placholder
            </button>
          </td>
        </tr>
      `;
    } catch (error) {
      console.error("Error generating price table row:", error);
    }
  });

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  return tableHtml;
}

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const indexPath = path.join(__dirname, "client", "index.html");
  const pricesPath = path.join(__dirname, "client", "prices.json");

  fs.readFile(indexPath, "utf8", (err, html) => {
    if (err) {
      console.error("Error reading index file:", err);
      return res.status(500).send("Error reading index file");
    }

    fs.readFile(pricesPath, "utf8", (err, pricesJson) => {
      if (err) {
        console.error("Error reading prices file:", err);
        return res.status(500).send("Error reading prices file");
      }

      let prices;
      try {
        prices = JSON.parse(pricesJson);
      } catch (parseError) {
        console.error("Error parsing prices JSON:", parseError);
        return res.status(500).send("Error parsing prices JSON");
      }

      const priceTable = generatePriceTable(prices);

      const priceTableRegex = /<div id="priceTable"[^>]*>[\s\S]*?<\/div>/;
      const priceTableMatch = html.match(priceTableRegex);

      if (!priceTableMatch) {
        console.error("Price table placeholder not found in HTML");
        return res.status(500).send("Error updating price table");
      }

      const updatedHtml = html.replace(
        priceTableRegex,
        `<div id="priceTable" class="mt-4">${priceTable}</div>`
      );

      if (updatedHtml === html) {
        console.error("Price table was not updated in HTML");
        return res.status(500).send("Error updating price table");
      }

      res.send(updatedHtml);
    });
  });
});

app.get("/landing", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "landing.html"));
});

app.post("/upload-sticker", async (req, res) => {
  console.log("Received sticker upload request");
  try {
    console.log("Uploading sticker to Cloudinary");
    const result = await cloudinary.uploader.upload(req.body.imageBase64, {
      upload_preset: "ml_default",
      folder: "kikker_stickers",
    });

    console.log("Sticker uploaded successfully:", result.secure_url);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).send("Error uploading to Cloudinary");
  }
});

app.use(express.static(path.join(__dirname, "client")));

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
