let imagePosition = { x: 0, y: 0 };
let imageScale = 1;

function initStickerDisplay() {
    const shapeSelect = document.getElementById('shape');
    const sizeSelect = document.getElementById('size');
    const fileInput = document.getElementById('image');
    const moveLeftBtn = document.getElementById('moveLeft');
    const moveRightBtn = document.getElementById('moveRight');
    const moveUpBtn = document.getElementById('moveUp');
    const moveDownBtn = document.getElementById('moveDown');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');

    shapeSelect.addEventListener('change', updateStickerDisplay);
    sizeSelect.addEventListener('change', updateStickerDisplay);
    fileInput.addEventListener('change', updateStickerDisplay);
    moveLeftBtn.addEventListener('click', () => moveImage(10, 0));
    moveRightBtn.addEventListener('click', () => moveImage(-10, 0));
    moveUpBtn.addEventListener('click', () => moveImage(0, 10));
    moveDownBtn.addEventListener('click', () => moveImage(0, -10));
    zoomInBtn.addEventListener('click', () => zoomImage(0.1));
    zoomOutBtn.addEventListener('click', () => zoomImage(-0.1));

    updateStickerDisplay(); // Initial call to set up the display
}

function updateStickerDisplay() {
    const shapeSelect = document.getElementById('shape');
    const sizeSelect = document.getElementById('size');
    const uploadedImage = document.getElementById('uploadedImage');
    const fileInput = document.getElementById('image');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImage.src = e.target.result;
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        uploadedImage.src = 'placeholder.png';
    }

    applyImageTransform();
    updateClipPath(shapeSelect.value, sizeSelect.value);
}

function applyImageTransform() {
    const uploadedImage = document.getElementById('uploadedImage');
    uploadedImage.style.transform = `translate(calc(-50% + ${imagePosition.x}px), calc(-50% + ${imagePosition.y}px)) scale(${imageScale})`;
}

function updateClipPath(shape, size) {
    const stickerDisplay = document.getElementById('stickerDisplay');
    let [width, height] = getSizeDimensions(size);
    
    // If no size is selected, use default 3:2 aspect ratio for oval and rectangle
    if (!size && (shape === 'Oval' || shape === 'Rectangle')) {
        width = 3;
        height = 2;
    }
    
    const aspectRatio = width / height;
    const containerWidth = stickerDisplay.offsetWidth;
    const containerHeight = stickerDisplay.offsetHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    switch(shape) {
        case 'Circle':
            stickerDisplay.style.clipPath = 'circle(50% at center)';
            break;
        case 'Square':
            stickerDisplay.style.clipPath = 'inset(0)';
            break;
        case 'Oval':
            if (aspectRatio > containerAspectRatio) {
                // Wider than container, constrain width
                const widthPercent = 50;
                const heightPercent = (containerAspectRatio / aspectRatio) * 50;
                stickerDisplay.style.clipPath = `ellipse(${widthPercent}% ${heightPercent}% at center)`;
            } else {
                // Taller than container, constrain height
                const widthPercent = (aspectRatio / containerAspectRatio) * 50;
                const heightPercent = 50;
                stickerDisplay.style.clipPath = `ellipse(${widthPercent}% ${heightPercent}% at center)`;
            }
            break;
        case 'Rectangle':
            if (aspectRatio > containerAspectRatio) {
                // Wider than container, constrain width
                const insetY = (1 - (containerAspectRatio / aspectRatio)) * 50;
                stickerDisplay.style.clipPath = `inset(${insetY}% 0)`;
            } else {
                // Taller than container, constrain height
                const insetX = (1 - (aspectRatio / containerAspectRatio)) * 50;
                stickerDisplay.style.clipPath = `inset(0 ${insetX}%)`;
            }
            break;
        default:
            stickerDisplay.style.clipPath = 'none';
    }
}

function getSizeDimensions(size) {
    if (!size) return [0, 0]; // Return [0, 0] if no size is selected
    const dimensions = size.split('x').map(s => parseFloat(s.trim()));
    return dimensions.length === 2 ? dimensions : [1, 1]; // Default to 1x1 if parsing fails
}

function moveImage(dx, dy) {
    imagePosition.x += dx;
    imagePosition.y += dy;
    applyImageTransform();
}

function zoomImage(dScale) {
    imageScale = Math.max(0.1, Math.min(3, imageScale + dScale)); // Limit scale between 0.1 and 3
    applyImageTransform();
}

document.addEventListener('DOMContentLoaded', initStickerDisplay);
