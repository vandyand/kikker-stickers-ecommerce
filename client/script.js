let allPrices = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  setupFormValidation();

  // Extract price data from the HTML table
  extractPriceDataFromTable();

  // Change this line to use the form's submit event instead of a specific button
  document.getElementById("orderForm").addEventListener("submit", handleSubmit);

  // Add event listeners for shape, size, and quantity dropdowns
  document.getElementById("shape").addEventListener("change", updateForm);
  document.getElementById("size").addEventListener("change", updateForm);
  document
    .getElementById("quantity")
    .addEventListener("change", updatePriceDisplay);

  // Add event listeners for real-time validation
  document.getElementById("image").addEventListener("change", validateInput);
  document.getElementById("shape").addEventListener("change", validateInput);
  document.getElementById("size").addEventListener("change", validateInput);
  document.getElementById("quantity").addEventListener("change", validateInput);

  // Change the "Checkout" button to "Add to Cart"
  const checkoutButton = document.querySelector('button[type="submit"]');
  checkoutButton.id = "addToCart";
  checkoutButton.addEventListener("click", captureAndUploadSticker);

  // // Add event listener for the upload sticker button
  // const uploadStickerButton = document.getElementById("uploadSticker");

  // if (uploadStickerButton) {
  //   console.log("Upload sticker button found");
  //   uploadStickerButton.addEventListener("click", captureAndUploadSticker);
  // } else {
  //   console.error("Upload sticker button not found");
  // }
});

function formatSize(width, height) {
  return `${width}" x ${height}"`;
}

function updateForm() {
  updateSizeOptions();
  updateQuantityOptions();
  updatePriceDisplay();
}

function updateSizeOptions() {
  const shape = document.getElementById("shape").value;
  const sizeSelect = document.getElementById("size");
  const currentSize = sizeSelect.value; // Store the current size selection
  const quantitySelect = document.getElementById("quantity");

  // Reset size dropdown while preserving the current selection
  const defaultOption = '<option value="">Select a size</option>';
  sizeSelect.innerHTML = defaultOption;
  quantitySelect.innerHTML = '<option value="">Select a quantity</option>';
  document.getElementById("priceDisplay").textContent = "";

  if (shape) {
    const sizes = [
      ...new Set(
        allPrices
          .filter((item) => item.shape === shape)
          .map((item) => formatSize(item.width, item.height))
      ),
    ];
    sizes.forEach((size) => {
      const option = document.createElement("option");
      option.value = size;
      option.textContent = size;
      sizeSelect.appendChild(option);
    });

    // Restore the previous selection if it's still valid
    if (sizes.includes(currentSize)) {
      sizeSelect.value = currentSize;
    }
  }
}

function updateQuantityOptions() {
  const shape = document.getElementById("shape").value;
  const size = document.getElementById("size").value;
  const quantitySelect = document.getElementById("quantity");
  const currentQuantity = quantitySelect.value; // Store the current quantity selection

  // Reset quantity dropdown
  quantitySelect.innerHTML = '<option value="">Select a quantity</option>';
  document.getElementById("priceDisplay").textContent = "";

  if (shape && size) {
    const filteredPrices = allPrices.filter(
      (item) =>
        item.shape === shape && formatSize(item.width, item.height) === size
    );

    filteredPrices.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.quantity;
      option.textContent = item.quantity;
      quantitySelect.appendChild(option);
    });

    // Restore the previous selection if it's still valid
    if (
      filteredPrices.some((item) => item.quantity === parseInt(currentQuantity))
    ) {
      quantitySelect.value = currentQuantity;
    }
  }
}

function updatePriceDisplay() {
  const shape = document.getElementById("shape").value;
  const size = document.getElementById("size").value;
  const quantity = parseInt(document.getElementById("quantity").value);

  if (shape && size && quantity) {
    const priceData = allPrices.find(
      (item) =>
        item.shape === shape &&
        formatSize(item.width, item.height) === size &&
        item.quantity === quantity
    );

    if (priceData) {
      document.getElementById(
        "priceDisplay"
      ).textContent = `Price: $${priceData.price.toFixed(2)}`;
    } else {
      document.getElementById("priceDisplay").textContent =
        "Price not available";
    }
  } else {
    document.getElementById("priceDisplay").textContent = "";
  }
}

function handleSubmit(event) {
  event.preventDefault();

  // Remove any existing error messages
  document.querySelectorAll(".error-message").forEach((el) => el.remove());

  let isValid = true;

  // Validate image
  const imageInput = document.getElementById("image");
  if (!imageInput.files || imageInput.files.length === 0) {
    displayError(imageInput.parentNode, "Please upload an image");
    isValid = false;
  }

  // Validate shape
  const shapeSelect = document.getElementById("shape");
  if (!shapeSelect.value) {
    displayError(shapeSelect, "Please select a shape");
    isValid = false;
  }

  // Validate size
  const sizeSelect = document.getElementById("size");
  if (!sizeSelect.value) {
    displayError(sizeSelect, "Please select a size");
    isValid = false;
  }

  // Validate quantity
  const quantitySelect = document.getElementById("quantity");
  if (!quantitySelect.value) {
    displayError(quantitySelect, "Please select a quantity");
    isValid = false;
  }

  if (isValid) {
    const shape = shapeSelect.value;
    const size = sizeSelect.value;
    const quantity = parseInt(quantitySelect.value);
    const imageFile = imageInput.files[0];

    // Find the corresponding row in the price table
    const tableRow = Array.from(
      document.querySelectorAll("#priceTable tbody tr")
    ).find((row) => {
      const cells = row.querySelectorAll("td");
      return (
        cells[0].textContent.trim() === shape &&
        cells[1].textContent.trim() === size &&
        parseInt(cells[2].textContent.trim()) === quantity
      );
    });

    if (tableRow) {
      const snipcartButton = tableRow.querySelector(".snipcart-add-item");
      const itemId = snipcartButton.getAttribute("data-item-id");
      const itemPrice = parseFloat(
        snipcartButton.getAttribute("data-item-price")
      );

      // Create a data URL from the uploaded image
      const reader = new FileReader();
      reader.onload = function (e) {
        const imageDataUrl = e.target.result;

        // Add the item to the Snipcart cart
        Snipcart.api.cart.items.add({
          id: itemId,
          name: `Custom ${shape} Sticker`,
          price: itemPrice,
          url: window.location.href,
          description: `${size} ${shape} sticker, quantity: ${quantity}`,
          image: imageDataUrl,
          quantity: 1,
          customFields: [
            {
              name: "Shape",
              value: shape,
            },
            {
              name: "Size",
              value: size,
            },
            {
              name: "Quantity",
              value: quantity.toString(),
            },
          ],
        });
      };
      reader.readAsDataURL(imageFile);
    } else {
      console.error("Price data not found for the selected options");
    }
  }
}

function displayError(element, message) {
  // Remove existing error message if any
  const existingError = element.parentNode.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  element.parentNode.appendChild(errorDiv);

  // Apply the animation
  errorDiv.style.animation = "none";
  errorDiv.offsetHeight; // Trigger reflow
  errorDiv.style.animation = null;

  // Remove the animation class after it completes
  setTimeout(() => {
    errorDiv.style.animation = "none";
  }, 500);
}

function validateInput(event) {
  const input = event.target;
  const errorMessage = input.parentNode.querySelector(".error-message");

  if (errorMessage) {
    if (
      (input.type === "file" && input.files && input.files.length > 0) ||
      (input.type === "select-one" && input.value) ||
      (input.type !== "file" &&
        input.type !== "select-one" &&
        input.value.trim())
    ) {
      errorMessage.remove();
    }
  }
}

// Add this function to set up event listeners for all form inputs
function setupFormValidation() {
  const formInputs = document.querySelectorAll(
    "#orderForm input, #orderForm select"
  );
  formInputs.forEach((input) => {
    input.addEventListener("change", validateInput);
    input.addEventListener("input", validateInput);
  });
}

document.addEventListener("snipcart.ready", function () {
  console.log("Snipcart is ready");

  // Ensure Snipcart is fully loaded before accessing its API
  if (window.Snipcart) {
    Snipcart.api.session.setLanguage("en");

    // Check if the settings property exists before trying to access it
    if (Snipcart.api.modal && Snipcart.api.modal.settings) {
      Snipcart.api.modal.settings.set("shipping", {
        enabled: true,
      });
    } else {
      console.warn("Snipcart modal settings not available");
    }
  } else {
    console.error("Snipcart not found");
  }
});

function extractPriceDataFromTable() {
  const tableRows = document.querySelectorAll("#priceTable tbody tr");
  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 4) {
      const shape = cells[0].textContent.trim();
      const size = cells[1].textContent.trim();
      const quantity = parseInt(cells[2].textContent.trim());
      const price = parseFloat(cells[3].textContent.replace("$", "").trim());
      const [width, height] = size.split("x").map((s) => parseFloat(s));

      allPrices.push({ shape, width, height, quantity, price });
    }
  });
}

function captureAndUploadSticker() {
  console.log("Capturing and uploading sticker");

  const stickerDisplay = document.getElementById("stickerDisplay");

  if (!stickerDisplay) {
    console.error("Sticker display element not found");
    return;
  }

  // Add a small delay to ensure all resources are loaded
  setTimeout(() => {
    htmlToImage
      .toPng(stickerDisplay, {
        backgroundColor: null,
        pixelRatio: 2,
        allowTaint: true,
        useCORS: true,
        skipFonts: true, // Add this line
        fontEmbedCSS: "", // Add this line
        imagePlaceholder:
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", // Add this line
      })
      .then(function (dataUrl) {
        // Upload the image
        fetch("/upload-sticker", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageBase64: dataUrl }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Image uploaded successfully:", data);
          })
          .catch((error) => {
            console.error("Error uploading image:", error);
          });
      })
      .catch(function (error) {
        console.error("Error capturing sticker:", error);
      });
  }, 1000); // Increased delay to 1000ms
}
