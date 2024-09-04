let allPrices = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded and parsed");
  loadPrices();
  setupFormValidation();

  // Change this line to use the form's submit event instead of a specific button
  document.getElementById("orderForm").addEventListener("submit", handleSubmit);

  // Add event listeners for shape, size, and quantity dropdowns
  document.getElementById("shape").addEventListener("change", updateForm);
  document.getElementById("size").addEventListener("change", updateForm);
  document.getElementById("quantity").addEventListener("change", updatePriceDisplay);

  // Add event listeners for real-time validation
  document.getElementById("image").addEventListener("change", validateInput);
  document.getElementById("shape").addEventListener("change", validateInput);
  document.getElementById("size").addEventListener("change", validateInput);
  document.getElementById("quantity").addEventListener("change", validateInput);

  // Change the "Checkout" button to "Add to Cart"
  const checkoutButton = document.querySelector('button[type="submit"]');
  checkoutButton.textContent = "Add to Cart";
  checkoutButton.id = "addToCart";
});

function loadPrices() {
  console.log("Loading prices...");
  fetch("prices.json")
    .then((response) => {
      console.log("Received response from fetch");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((prices) => {
      console.log("Prices loaded successfully", prices);
      allPrices = prices;
      localStorage.setItem("prices", JSON.stringify(prices));
      updateForm();
    })
    .catch((error) => {
      console.error("Error loading prices:", error);
      document.getElementById("priceTable").innerHTML =
        "Error loading prices. Please try refreshing the page.";
    });
}

function updateForm() {
  updateSizeOptions();
  updateQuantityOptions();
  updatePriceDisplay();
  updatePriceTable();
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
          .map((item) => item.size)
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
        item.shape === shape &&
        item.size.replace(/['"]/g, "") === size.replace(/['"]/g, "")
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
        item.size.replace(/['"]/g, "") === size.replace(/['"]/g, "") &&
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
    const shape = document.getElementById("shape").value;
    const size = document.getElementById("size").value;
    const quantity = parseInt(quantitySelect.value);
    const imageFile = document.getElementById("image").files[0];

    // Find the price for the selected options
    const priceData = allPrices.find(
      (item) => item.shape === shape && 
                item.size.replace(/['"]/g, "") === size.replace(/['"]/g, "") && 
                item.quantity === quantity
    );

    if (priceData) {
      // Create a unique ID for the product
      const productId = `${shape}-${size}-${quantity}`;

      // Create a data URL from the uploaded image
      const reader = new FileReader();
      reader.onload = function(e) {
        const imageDataUrl = e.target.result;

        // Add the item to Snipcart
        Snipcart.api.cart.items.add({
          id: productId,
          name: `Custom ${shape} Sticker`,
          price: priceData.price,
          quantity: 1,
          url: window.location.href, // Required for Snipcart
          description: `${size} ${shape} sticker, quantity: ${quantity}`,
          image: imageDataUrl,
          customFields: [
            {
              name: "Shape",
              value: shape,
              options: ["Circle", "Square", "Oval", "Rectangle"]
            },
            {
              name: "Size",
              value: size
            },
            {
              name: "Quantity",
              value: quantity
            }
          ]
        }).then(() => {
          console.log('Item added to cart');
        }).catch((error) => {
          console.error('Error adding item to cart:', error);
        });
      };
      reader.readAsDataURL(imageFile);
    } else {
      console.error('Price data not found for the selected options');
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

function updatePriceTable() {
  const shape = document.getElementById("shape").value;
  const size = document.getElementById("size").value;
  const quantity = document.getElementById("quantity").value;

  let filteredPrices = allPrices;

  if (shape) {
    filteredPrices = filteredPrices.filter((item) => item.shape === shape);
  }
  if (size) {
    filteredPrices = filteredPrices.filter(
      (item) => item.size.replace(/['"]/g, "") === size.replace(/['"]/g, "")
    );
  }
  if (quantity) {
    filteredPrices = filteredPrices.filter(
      (item) => item.quantity === parseInt(quantity)
    );
  }

  displayPriceTable(filteredPrices);
}

function displayPriceTable(prices) {
  console.log("Displaying price table");
  const tableContainer = document.getElementById("priceTable");
  tableContainer.innerHTML = ""; // Clear any existing content

  const table = document.createElement("table");
  table.className = "min-w-full divide-y divide-gray-200";

  const thead = document.createElement("thead");
  thead.className = "bg-gray-50";
  thead.innerHTML = `
        <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shape</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
        </tr>
    `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.className = "bg-white divide-y divide-gray-200";

  prices.forEach((item, index) => {
    const row = document.createElement("tr");
    row.className = index % 2 === 0 ? "bg-white" : "bg-gray-50";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${
              item.shape
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              item.size
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
              item.quantity
            }</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">$${item.price.toFixed(
              2
            )}</td>
        `;
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  tableContainer.appendChild(table);

  console.log("Price table displayed");
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

document.addEventListener('snipcart.ready', function() {
  Snipcart.api.session.setLanguage('en');
  Snipcart.api.modal.settings.set('shipping', {
    enabled: true
  });
});
