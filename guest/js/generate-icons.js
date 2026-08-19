// Simple icon generator using canvas
function generateIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#c9a86a');
  gradient.addColorStop(1, '#b8943a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Hotel icon
  ctx.fillStyle = '#0b0f16';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏨', size/2, size/2);
  
  return canvas.toDataURL();
}

// Generate all icon sizes
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
sizes.forEach(size => {
  const link = document.createElement('a');
  link.download = `icon-${size}.png`;
  link.href = generateIcon(size);
  link.click();
});
