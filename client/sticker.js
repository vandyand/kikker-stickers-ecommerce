let imagePosition = { x: 0, y: 0 };
let imageScale = 1;

let moveInterval;
let zoomInterval;
const moveStep = 5;
const zoomStep = 0.05;

function initStickerDisplay() {
  console.log("Initializing sticker display");
  const shapeSelect = document.getElementById("shape");
  const sizeSelect = document.getElementById("size");
  const fileInput = document.getElementById("image");
  const moveLeftBtn = document.getElementById("moveLeft");
  const moveRightBtn = document.getElementById("moveRight");
  const moveUpBtn = document.getElementById("moveUp");
  const moveDownBtn = document.getElementById("moveDown");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");

  shapeSelect.addEventListener("change", updateStickerDisplay);
  sizeSelect.addEventListener("change", updateStickerDisplay);
  fileInput.addEventListener("change", updateStickerDisplay);

  moveLeftBtn.addEventListener("click", () => moveImage(10, 0));
  moveRightBtn.addEventListener("click", () => moveImage(-10, 0));
  moveUpBtn.addEventListener("click", () => moveImage(0, 10));
  moveDownBtn.addEventListener("click", () => moveImage(0, -10));
  zoomInBtn.addEventListener("click", () => zoomImage(0.1));
  zoomOutBtn.addEventListener("click", () => zoomImage(-0.1));

  setupContinuousMovement(moveLeftBtn, moveStep, 0);
  setupContinuousMovement(moveRightBtn, -moveStep, 0);
  setupContinuousMovement(moveUpBtn, 0, moveStep);
  setupContinuousMovement(moveDownBtn, 0, -moveStep);
  setupContinuousZoom(zoomInBtn, zoomStep);
  setupContinuousZoom(zoomOutBtn, -zoomStep);

  window.addEventListener("resize", handleResize);

  updateStickerDisplay(); // Initial call to set up the display
  console.log("Sticker display initialized");
}

function setupContinuousMovement(button, dx, dy) {
  console.log(`Setting up continuous movement: dx=${dx}, dy=${dy}`);
  button.addEventListener("mousedown", () => {
    moveInterval = setInterval(() => moveImage(dx, dy), 50);
  });
  button.addEventListener("mouseup", stopContinuousAction);
  button.addEventListener("mouseleave", stopContinuousAction);
}

function setupContinuousZoom(button, dScale) {
  console.log(`Setting up continuous zoom: dScale=${dScale}`);
  button.addEventListener("mousedown", () => {
    zoomInterval = setInterval(() => zoomImage(dScale), 50);
  });
  button.addEventListener("mouseup", stopContinuousAction);
  button.addEventListener("mouseleave", stopContinuousAction);
}

function stopContinuousAction() {
  console.log("Stopping continuous action");
  clearInterval(moveInterval);
  clearInterval(zoomInterval);
}

function updateStickerDisplay() {
  console.log("Updating sticker display");
  const shapeSelect = document.getElementById("shape");
  const sizeSelect = document.getElementById("size");
  const uploadedImage = document.getElementById("uploadedImage");
  const fileInput = document.getElementById("image");

  console.log(`Selected shape: ${shapeSelect.value}`);
  console.log(`Selected size: ${sizeSelect.value}`);

  if (fileInput.files && fileInput.files[0]) {
    console.log("New file selected, updating image");
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImage.src = e.target.result;
      console.log("Image updated");
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    console.log("No file selected, using placeholder");
    uploadedImage.src = "placeholder.png";
  }

  updateClipPath(shapeSelect.value, sizeSelect.value);
  applyImageTransform();
  console.log("Sticker display updated");
}

function applyImageTransform() {
  console.log("Applying image transform");
  const uploadedImage = document.getElementById("uploadedImage");

  console.log(`Current image scale: ${imageScale}`);
  console.log(`Current image position: x=${imagePosition.x}, y=${imagePosition.y}`);

  uploadedImage.style.transform = `translate(-50%, -50%) scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`;
  console.log(`Applied transform: ${uploadedImage.style.transform}`);
}

function updateClipPath(shape, size) {
  console.log(`Updating clip path: shape=${shape}, size=${size}`);
  const stickerDisplay = document.getElementById("stickerDisplay");
  let [width, height] = getSizeDimensions(size);

  console.log(`Size dimensions: width=${width}, height=${height}`);

  // If no size is selected, use default 3:2 aspect ratio for oval and rectangle
  if (!size && (shape === "Oval" || shape === "Rectangle")) {
    width = 3;
    height = 2;
    console.log("Using default 3:2 aspect ratio");
  }

  const aspectRatio = width / height;
  const containerWidth = stickerDisplay.offsetWidth;
  const containerHeight = stickerDisplay.offsetHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  console.log(`Aspect ratio: ${aspectRatio}`);
  console.log(`Container dimensions: ${containerWidth}x${containerHeight}`);
  console.log(`Container aspect ratio: ${containerAspectRatio}`);

  // Store the current transform
  const currentTransform = stickerDisplay.style.transform;
  console.log(`Current transform: ${currentTransform}`);

  let clipPath;
  switch (shape) {
    case "Circle":
      clipPath = "circle(50% at center)";
      break;
    case "Square":
      clipPath = "inset(0)";
      break;
    case "Oval":
      if (aspectRatio > containerAspectRatio) {
        const widthPercent = 50;
        const heightPercent = (containerAspectRatio / aspectRatio) * 50;
        clipPath = `ellipse(${widthPercent}% ${heightPercent}% at center)`;
      } else {
        const widthPercent = (aspectRatio / containerAspectRatio) * 50;
        const heightPercent = 50;
        clipPath = `ellipse(${widthPercent}% ${heightPercent}% at center)`;
      }
      break;
    case "Rectangle":
      if (aspectRatio > containerAspectRatio) {
        const insetY = (1 - containerAspectRatio / aspectRatio) * 50;
        clipPath = `inset(${insetY}% 0)`;
      } else {
        const insetX = (1 - aspectRatio / containerAspectRatio) * 50;
        clipPath = `inset(0 ${insetX}%)`;
      }
      break;
    default:
      clipPath = "none";
  }

  console.log(`Applied clip path: ${clipPath}`);
  stickerDisplay.style.clipPath = clipPath;

  // Reapply the current transform
  stickerDisplay.style.transform = currentTransform;
  console.log(`Reapplied transform: ${currentTransform}`);

  // Reapply the image transform
  applyImageTransform();
}

function getSizeDimensions(size) {
  console.log(`Getting size dimensions for: ${size}`);
  if (!size) {
    console.log("No size selected, returning [0, 0]");
    return [0, 0]; // Return [0, 0] if no size is selected
  }
  const dimensions = size.split("x").map((s) => parseFloat(s.trim()));
  const result = dimensions.length === 2 ? dimensions : [1, 1]; // Default to 1x1 if parsing fails
  console.log(`Parsed dimensions: ${result}`);
  return result;
}

function moveImage(dx, dy) {
  console.log(`Moving image: dx=${dx}, dy=${dy}`);

  // Update the position directly
  imagePosition.x += dx;
  imagePosition.y += dy;

  console.log(`New image position: x=${imagePosition.x}, y=${imagePosition.y}`);

  applyImageTransform();
}

function zoomImage(dScale) {
  console.log(`Zooming image: dScale=${dScale}`);
  const oldScale = imageScale;
  imageScale = Math.max(0.1, Math.min(3, imageScale + dScale));

  console.log(`Old scale: ${oldScale}, New scale: ${imageScale}`);

  // Adjust position to keep the current view center stable
  const scaleRatio = imageScale / oldScale;
  imagePosition.x *= scaleRatio;
  imagePosition.y *= scaleRatio;

  console.log(`Adjusted position: x=${imagePosition.x}, y=${imagePosition.y}`);

  applyImageTransform();
}

function handleResize() {
  console.log("Handling window resize");
  applyImageTransform();
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded");
  initStickerDisplay();
});
