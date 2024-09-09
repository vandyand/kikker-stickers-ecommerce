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

  console.log("Form submission started");

  document.querySelectorAll(".error-message").forEach((el) => el.remove());

  let isValid = true;

  const imageInput = document.getElementById("image");
  console.log("Image input files:", imageInput.files);
  if (!imageInput.files || imageInput.files.length === 0) {
    displayError(imageInput, "Please upload an image");
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

  console.log("Form validation result:", isValid);

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
  console.log("Displaying error for element:", element, "Message:", message);
  const container = element.closest('div[id$="Group"]') || element.parentElement;
  if (!container) {
    console.error("Error container not found for element:", element);
    return;
  }
  const existingError = container.querySelector(".error-message");
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message text-red-500 text-sm mt-1";
  errorDiv.textContent = message;
  
  // Insert the error message after the element
  container.appendChild(errorDiv);

  // Apply the shake animation
  errorDiv.classList.add('shake');

  // Remove the shake class after the animation completes
  setTimeout(() => {
    errorDiv.classList.remove('shake');
  }, 500);
}

function validateInput(event) {
  console.log("Validating input:", event.target);
  const input = event.target;
  const container = input.closest('div[id$="Group"]') || input.parentElement;
  if (!container) {
    console.error("Validation container not found for input:", input);
    return;
  }
  const errorMessage = container.querySelector(".error-message");

  if (errorMessage) {
    if (
      (input.type === "file" && input.files && input.files.length > 0) ||
      (input.type === "select-one" && input.value) ||
      (input.type !== "file" &&
        input.type !== "select-one" &&
        input.value.trim())
    ) {
      console.log("Removing error message for:", input);
      errorMessage.style.opacity = '0';
      errorMessage.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        errorMessage.remove();
      }, 300);
    }
  }
}

function setupFormValidation() {
  console.log("Setting up form validation");
  const formInputs = document.querySelectorAll(
    "#orderForm input, #orderForm select"
  );
  formInputs.forEach((input) => {
    input.addEventListener("change", validateInput, { passive: true });
    input.addEventListener("input", validateInput, { passive: true });
  });

  // Add specific handler for file input
  const fileInput = document.getElementById("image");
  fileInput.addEventListener("change", function(event) {
    console.log("File input changed:", event.target.files);
    validateInput(event);
  }, { passive: true });
}

function updateCartSummary() {
  if (window.Snipcart) {
    Snipcart.store.subscribe(() => {
      const state = Snipcart.store.getState();
      const cartSummary = document.getElementById("cart-summary");
      if (cartSummary) {
        cartSummary.innerHTML = `
          <a href="#" class="snipcart-checkout">
            <i id="cart-icon" class="fas fa-shopping-cart"></i>
            <span id="cart-items" class="snipcart-items-count">${state.cart.items.count}</span> items -
            <span id="cart-total" class="snipcart-total-price">${state.cart.total}</span>
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
        .querySelector("[data-item-id]")
        .getAttribute("data-item-id");

      allPrices.push({ shape, width, height, quantity, price, id });
    }
  });
}

function captureAndUploadSticker() {
  const stickerDisplay = document.getElementById('stickerDisplay');

  if (!stickerDisplay) {
    return Promise.reject("Sticker display element not found");
  }

  return new Promise((resolve, reject) => {
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
      reject(error);
    });
  });
}
