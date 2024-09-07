let imagePosition = { x: 0, y: 0 };
let imageScale = 1;

let moveInterval;
let zoomInterval;
const moveStep = 5;
const zoomStep = 0.05;

function initStickerDisplay() {
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

  updateStickerDisplay();
}

function setupContinuousMovement(button, dx, dy) {
  button.addEventListener("mousedown", () => {
    moveInterval = setInterval(() => moveImage(dx, dy), 50);
  });
  button.addEventListener("mouseup", stopContinuousAction);
  button.addEventListener("mouseleave", stopContinuousAction);
}

function setupContinuousZoom(button, dScale) {
  button.addEventListener("mousedown", () => {
    zoomInterval = setInterval(() => zoomImage(dScale), 50);
  });
  button.addEventListener("mouseup", stopContinuousAction);
  button.addEventListener("mouseleave", stopContinuousAction);
}

function stopContinuousAction() {
  clearInterval(moveInterval);
  clearInterval(zoomInterval);
}

function updateStickerDisplay() {
  const shapeSelect = document.getElementById("shape");
  const sizeSelect = document.getElementById("size");
  const uploadedImage = document.getElementById("uploadedImage");
  const fileInput = document.getElementById("image");

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    uploadedImage.src = "placeholder.png";
  }

  updateClipPath(shapeSelect.value, sizeSelect.value);
  applyImageTransform();
}

function applyImageTransform() {
  const uploadedImage = document.getElementById("uploadedImage");

  uploadedImage.style.transform = `translate(-50%, -50%) scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`;
}

function updateClipPath(shape, size) {
  const stickerDisplay = document.getElementById("stickerDisplay");
  let [width, height] = getSizeDimensions(size);

  if (!size && (shape === "Oval" || shape === "Rectangle")) {
    width = 3;
    height = 2;
  }

  const aspectRatio = width / height;
  const containerWidth = stickerDisplay.offsetWidth;
  const containerHeight = stickerDisplay.offsetHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  const currentTransform = stickerDisplay.style.transform;
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

  stickerDisplay.style.clipPath = clipPath;

  stickerDisplay.style.transform = currentTransform;

  applyImageTransform();
}

function getSizeDimensions(size) {
  if (!size) {
    return [0, 0];
  }
  const dimensions = size.split("x").map((s) => parseFloat(s.trim()));
  const result = dimensions.length === 2 ? dimensions : [1, 1];
  return result;
}

function moveImage(dx, dy) {
  imagePosition.x += dx;
  imagePosition.y += dy;

  applyImageTransform();
}

function zoomImage(dScale) {
  const oldScale = imageScale;
  imageScale = Math.max(0.1, Math.min(3, imageScale + dScale));

  const scaleRatio = imageScale / oldScale;
  imagePosition.x *= scaleRatio;
  imagePosition.y *= scaleRatio;

  applyImageTransform();
}

function handleResize() {
  applyImageTransform();
}

document.addEventListener("DOMContentLoaded", () => {
  initStickerDisplay();
});
