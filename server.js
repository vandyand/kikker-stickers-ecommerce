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
    return "<p>No price data available</p>";
  }

  let tableHtml = `
    <table class="price-table">
      <thead>
        <tr>
          <th>Shape</th>
          <th>Size</th>
          <th>Quantity</th>
          <th>Price</th>
          <th style="display: none">Snipcart Data</th>
        </tr>
      </thead>
      <tbody>
  `;

  prices.forEach((item, index) => {
    try {
      const rowClass = index % 2 === 0 ? "row-even" : "row-odd";
      tableHtml += `
        <tr class="${rowClass}">
          <td>${item.shape}</td>
          <td>${item.width}" x ${item.height}"</td>
          <td>${item.quantity}</td>
          <td>$${item.price.toFixed(2)}</td>
          <td style="display: none">
            <div class="snipcart-item">
              <button class="snipcart-add-item"
                data-item-id="${item.id}"
                data-item-price="${item.price.toFixed(2)}"
                data-item-url="https://kikker-stickers.github.io/kikker-stickers-ecommerce"
                data-item-description="${item.width} x ${item.height} ${item.shape} sticker, quantity: ${item.quantity}"
                data-item-image="placeholder.png"
                data-item-name="Custom ${item.shape} Sticker"
                data-item-custom1-name="Shape"
                data-item-custom1-options="${item.shape}"
                data-item-custom2-name="Size"
                data-item-custom2-value="${item.width} x ${item.height}"
                data-item-custom3-name="Quantity"
                data-item-custom3-value="${item.quantity}"
              >
                Add to cart
              </button>
            </div>
          </td>
        </tr>
      `;
    } catch (error) {
      // Silently handle errors
    }
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  return tableHtml;
}

app.get("/", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const indexPath = path.join(__dirname, "client", "index.html");
  const pricesPath = path.join(__dirname, "client", "prices.json");

  fs.readFile(indexPath, "utf8", (err, html) => {
    if (err) {
      return res.status(500).send("Error reading index file");
    }

    fs.readFile(pricesPath, "utf8", (err, pricesJson) => {
      if (err) {
        return res.status(500).send("Error reading prices file");
      }

      let prices;
      try {
        prices = JSON.parse(pricesJson);
      } catch (parseError) {
        return res.status(500).send("Error parsing prices JSON");
      }

      const priceTable = generatePriceTable(prices);

      const oldTableRegex = /<div id="priceTable">[\s\S]*?<\/div>/;
      const oldTableMatch = html.match(oldTableRegex);

      if (!oldTableMatch) {
        return res.status(500).send("Error updating price table");
      }

      const updatedHtml = html.replace(
        oldTableRegex,
        `<div id="priceTable">${priceTable}</div>`
      );

      if (updatedHtml.length === html.length) {
        return res.status(500).send("Error updating price table");
      }

      res.send(updatedHtml);
    });
  });
});

app.post("/upload-sticker", async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.body.imageBase64, {
      upload_preset: "ml_default",
      folder: "kikker_stickers",
    });

    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    res.status(500).send("Error uploading to Cloudinary");
  }
});

app.use(express.static(path.join(__dirname, "client")));

const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
