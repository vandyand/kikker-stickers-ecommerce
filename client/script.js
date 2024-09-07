let allPrices = [];

document.addEventListener("DOMContentLoaded", function () {
  setupFormValidation();
  extractPriceDataFromTable();
  document.getElementById("orderForm").addEventListener("submit", handleSubmit);
  document.getElementById("shape").addEventListener("change", updateForm);
  document.getElementById("size").addEventListener("change", updateForm);
  document.getElementById("quantity").addEventListener("change", updatePriceDisplay);
  document.getElementById("image").addEventListener("change", validateInput);
  document.getElementById("shape").addEventListener("change", validateInput);
  document.getElementById("size").addEventListener("change", validateInput);
  document.getElementById("quantity").addEventListener("change", validateInput);

  const checkoutButton = document.querySelector('button[type="submit"]');
  checkoutButton.id = "addToCart";

  window.showSpinner = function () {
    const spinner = document.getElementById("processing-spinner");
    if (spinner) {
      spinner.style.display = "flex";
    }
  };

  window.hideSpinner = function () {
    const spinner = document.getElementById("processing-spinner");
    if (spinner) {
      spinner.style.display = "none";
    }
  };
});

document.addEventListener("snipcart.ready", function () {
  Snipcart.api.session.setLanguage("en");
  Snipcart.api.theme.customization.registerPaymentFormCustomization({
    shipping: {
      enabled: true,
    },
  });
  updateCartSummary();
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
  const currentSize = sizeSelect.value;
  const quantitySelect = document.getElementById("quantity");

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

    if (sizes.includes(currentSize)) {
      sizeSelect.value = currentSize;
    }
  }
}

function updateQuantityOptions() {
  const shape = document.getElementById("shape").value;
  const size = document.getElementById("size").value;
  const quantitySelect = document.getElementById("quantity");
  const currentQuantity = quantitySelect.value;

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

function showSpinner() {
  const spinner = document.getElementById("processing-spinner");
  if (spinner) {
    spinner.style.display = "flex";
  }
}

function hideSpinner() {
  const spinner = document.getElementById("processing-spinner");
  if (spinner) {
    spinner.style.display = "none";
  }
}

function handleSubmit(event) {
  event.preventDefault();

  document.querySelectorAll(".error-message").forEach((el) => el.remove());

  let isValid = true;

  const imageInput = document.getElementById("image");
  if (!imageInput.files || imageInput.files.length === 0) {
    displayError(imageInput.parentNode, "Please upload an image");
    isValid = false;
  }

  const shapeSelect = document.getElementById("shape");
  if (!shapeSelect.value) {
    displayError(shapeSelect, "Please select a shape");
    isValid = false;
  }

  const sizeSelect = document.getElementById("size");
  if (!sizeSelect.value) {
    displayError(sizeSelect, "Please select a size");
    isValid = false;
  }

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

    const priceData = allPrices.find(
      (item) =>
        item.shape === shape &&
        formatSize(item.width, item.height) === size &&
        item.quantity === quantity
    );

    if (priceData) {
      window.showSpinner();
      captureAndUploadSticker()
        .then((cloudinaryUrl) => {
          return Snipcart.api.cart.items.add({
            id: priceData.id,
            name: `Custom ${shape} Sticker`,
            price: priceData.price,
            url: window.location.href,
            description: `${size} ${shape} sticker, quantity: ${quantity}`,
            image: cloudinaryUrl,
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
            metadata: {
              stickerImageUrl: cloudinaryUrl,
            },
          });
        })
        .then(() => {
          updateCartSummary();
        })
        .catch((error) => {
          console.error("Error adding item to cart:", error);
        })
        .finally(() => {
          window.hideSpinner();
        });
    } else {
      console.error("Price data not found for the selected options");
    }
  }
}

function displayError(element, message) {
  const existingError = element.parentNode.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  element.parentNode.appendChild(errorDiv);

  errorDiv.style.animation = "none";
  errorDiv.offsetHeight;
  errorDiv.style.animation = null;

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

function setupFormValidation() {
  const formInputs = document.querySelectorAll(
    "#orderForm input, #orderForm select"
  );
  formInputs.forEach((input) => {
    input.addEventListener("change", validateInput);
    input.addEventListener("input", validateInput);
  });
}

function updateCartSummary() {
  if (window.Snipcart) {
    Snipcart.store.subscribe(() => {
      const state = Snipcart.store.getState();
      const cartSummary = document.querySelector(".snipcart-summary");
      if (cartSummary) {
        cartSummary.innerHTML = `
          <a href="#" class="snipcart-checkout">
            <i class="fas fa-shopping-cart"></i>
            <span class="snipcart-items-count">${state.cart.items.count}</span> items -
            <span class="snipcart-total-price">${state.cart.total}</span>
          </a>
        `;
      }
    });
  }
}

function extractPriceDataFromTable() {
  const tableRows = document.querySelectorAll("#priceTable tbody tr");
  allPrices = [];

  tableRows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    if (cells.length >= 4) {
      const shape = cells[0].textContent.trim();
      const size = cells[1].textContent.trim();
      const quantity = parseInt(cells[2].textContent.trim());
      const price = parseFloat(cells[3].textContent.replace("$", "").trim());
      const [width, height] = size.split("x").map((s) => parseFloat(s));
      const id = row
        .querySelector(".snipcart-add-item")
        .getAttribute("data-item-id");

      allPrices.push({ shape, width, height, quantity, price, id });
    }
  });
}

function captureAndUploadSticker() {
  const stickerDisplay = document.getElementById('stickerDisplay');

  if (!stickerDisplay) {
    console.error("Sticker display element not found");
    return Promise.reject("Sticker display element not found");
  }

  return new Promise((resolve, reject) => {
    // Capture the sticker display as-is
    htmlToImage.toPng(stickerDisplay, {
      backgroundColor: null,
      pixelRatio: 2,
      allowTaint: true,
      useCORS: true,
      skipFonts: true,
      fontEmbedCSS: "",
      imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    })
    .then(function (dataUrl) {
      // Continue with upload process
      fetch("/upload-sticker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: dataUrl }),
      })
        .then((response) => response.json())
        .then((data) => {
          resolve(data.imageUrl);
        })
        .catch((error) => {
          reject(error);
        });
    })
    .catch(function (error) {
      console.error("Error capturing sticker:", error);
      reject(error);
    });
  });
}
