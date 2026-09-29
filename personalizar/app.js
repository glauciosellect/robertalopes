const formats = {
  story: { label: "STORIES", dimensions: "720 × 1280", width: 720, height: 1280, template: "assets/story-template.jpg", photo: { x: 165, y: 205, width: 390, height: 315, radius: 28 } },
  profile: { label: "PERFIL", dimensions: "1254 × 1254", width: 1254, height: 1254, template: "assets/profile-template.jpg", photo: { x: 260, y: 250, width: 735, height: 735, radius: 368, shape: "circle" }, foregroundY: 850 }
};

const canvas = document.querySelector("#art-canvas");
const ctx = canvas.getContext("2d");
const photoInput = document.querySelector("#photo-input");
const zoomInput = document.querySelector("#zoom");
const zoomValue = document.querySelector("#zoom-value");
const status = document.querySelector("#status");
const fileNote = document.querySelector("#file-note");
const dimensionLabel = document.querySelector("#dimension-label");
const dragHint = document.querySelector("#drag-hint");
const canvasFrame = document.querySelector("#canvas-frame");
const savePreview = document.querySelector("#save-preview");
const savePreviewImage = document.querySelector("#save-preview-image");
let currentFormat = "story";
let uploadedImage = null;
let imageUrl = null;
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let drag = null;
let savePreviewUrl = null;
const textures = {};
const templates = {};

for (const [key, data] of Object.entries(formats)) {
  const image = new Image();
  image.src = data.template;
  image.onload = () => { templates[key] = image; draw(); };
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawCover(image, frame, scale = 1) {
  const imageRatio = image.width / image.height;
  const frameRatio = frame.width / frame.height;
  let drawWidth; let drawHeight;
  if (imageRatio > frameRatio) { drawHeight = frame.height * scale; drawWidth = drawHeight * imageRatio; }
  else { drawWidth = frame.width * scale; drawHeight = drawWidth / imageRatio; }
  const x = frame.x + (frame.width - drawWidth) / 2 + offsetX;
  const y = frame.y + (frame.height - drawHeight) / 2 + offsetY;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function drawPlaceholder(frame) {
  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.fillStyle = "rgba(255,255,255,.19)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.64)";
  ctx.lineWidth = 5;
  ctx.setLineDash([18, 14]);
  ctx.stroke();
  ctx.setLineDash([]);
  const cx = frame.x + frame.width / 2;
  const cy = frame.y + frame.height * .44;
  const head = Math.min(frame.width, frame.height) * .13;
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.beginPath(); ctx.arc(cx, cy, head, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + head * 1.8, head * 2.2, head * 1.35, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.font = "800 28px 'Noto Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SUA FOTO AQUI", cx, frame.y + frame.height * .78);
  ctx.restore();
}

function fitText(text, maxWidth, maxSize, minSize, weight = 900) {
  let size = maxSize;
  while (size > minSize) { ctx.font = `${weight} ${size}px 'Roboto Condensed', sans-serif`; if (ctx.measureText(text).width <= maxWidth) return size; size -= 2; }
  return minSize;
}

function drawBrand(format) {
  ctx.save();
  const pad = format === "profile" ? 84 : 70;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${format === "profile" ? 36 : 42}px 'Roboto Condensed', sans-serif`;
  ctx.letterSpacing = "3px";
  ctx.fillText("ROBERTA", pad, pad);
  ctx.font = `700 ${format === "profile" ? 20 : 24}px 'Noto Sans', sans-serif`;
  ctx.fillStyle = "#ffd21a";
  ctx.fillText("LOPES", pad, pad + (format === "profile" ? 28 : 32));
  ctx.restore();
}

function draw() {
  const format = formats[currentFormat];
  canvas.width = format.width;
  canvas.height = format.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const template = templates[currentFormat];
  if (template) {
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
    const frame = format.photo;
    if (uploadedImage) {
      ctx.save();
      if (frame.shape === "circle") {
        ctx.beginPath();
        ctx.arc(frame.x + frame.width / 2, frame.y + frame.height / 2, frame.width / 2, 0, Math.PI * 2);
        ctx.clip();
      } else {
        roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
        ctx.clip();
      }
      drawCover(uploadedImage, frame, zoom);
      ctx.restore();
    }
    if (format.foregroundY) {
      const sourceY = format.foregroundY * template.height / canvas.height;
      ctx.drawImage(template, 0, sourceY, template.width, template.height - sourceY, 0, format.foregroundY, canvas.width, canvas.height - format.foregroundY);
    }
    return;
  }
  const texture = textures[currentFormat];
  if (texture) ctx.drawImage(texture, 0, 0, canvas.width, canvas.height);
  else { ctx.fillStyle = currentFormat === "profile" ? "#071c54" : "#56b737"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

  drawBrand(currentFormat);
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffd21a";
  const numberSize = currentFormat === "profile" ? 126 : currentFormat === "feed" ? 156 : 188;
  ctx.font = `900 ${numberSize}px 'Roboto Condensed', sans-serif`;
  ctx.shadowColor = "rgba(7,28,84,.38)"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 6;
  ctx.fillText("22032", canvas.width / 2, currentFormat === "profile" ? 1000 : currentFormat === "feed" ? 1265 : 1800);
  ctx.restore();

  const frame = format.photo;
  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.clip();
  if (uploadedImage) drawCover(uploadedImage, frame, zoom);
  else drawPlaceholder(frame);
  ctx.restore();
  ctx.save();
  roundedRect(ctx, frame.x, frame.y, frame.width, frame.height, frame.radius);
  ctx.lineWidth = currentFormat === "profile" ? 18 : 12;
  ctx.strokeStyle = currentFormat === "profile" ? "#ffd21a" : "#ffffff";
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = currentFormat === "profile" ? "#36ddea" : "#071c54";
  const barY = currentFormat === "profile" ? 820 : currentFormat === "feed" ? 1035 : 1320;
  const barH = currentFormat === "profile" ? 90 : 112;
  roundedRect(ctx, 70, barY, canvas.width - 140, barH, 24); ctx.fill();
  ctx.fillStyle = "#ffffff";
  const label = currentFormat === "profile" ? "EU APOIO ROBERTA LOPES" : "ESTE É O NOSSO TIME!";
  const labelSize = fitText(label, canvas.width - 210, currentFormat === "profile" ? 36 : 52, 24);
  ctx.font = `900 ${labelSize}px 'Roboto Condensed', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(label, canvas.width / 2, barY + barH * .66);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(7,28,84,.92)";
  ctx.font = "700 22px 'Noto Sans', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("DEPUTADA ESTADUAL", 72, canvas.height - 58);
  ctx.restore();
}

function setFormat(key) {
  currentFormat = key;
  zoom = 1; offsetX = 0; offsetY = 0; zoomInput.value = "1"; zoomValue.textContent = "100%";
  document.querySelectorAll(".format-button").forEach(button => button.classList.toggle("selected", button.dataset.format === key));
  const format = formats[key];
  dimensionLabel.textContent = `${format.label} · ${format.dimensions}`;
  canvasFrame.dataset.format = key;
  draw();
}

document.querySelectorAll(".format-button").forEach(button => button.addEventListener("click", () => setFormat(button.dataset.format)));
photoInput.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = URL.createObjectURL(file);
  uploadedImage = new Image();
  uploadedImage.onload = () => { zoom = 1; offsetX = 0; offsetY = 0; zoomInput.value = "1"; zoomValue.textContent = "100%"; draw(); status.textContent = "Foto carregada. Arraste no quadro para ajustar."; fileNote.textContent = `${file.name} · pronta para ajustar`; dragHint.classList.remove("hidden"); };
  uploadedImage.src = imageUrl;
});
zoomInput.addEventListener("input", event => { zoom = Number(event.target.value); zoomValue.textContent = `${Math.round(zoom * 100)}%`; draw(); });
document.querySelector("#reset-button").addEventListener("click", () => { zoom = 1; offsetX = 0; offsetY = 0; zoomInput.value = "1"; zoomValue.textContent = "100%"; draw(); });

canvas.addEventListener("pointerdown", event => { drag = { x: event.clientX, y: event.clientY, offsetX, offsetY }; canvas.setPointerCapture(event.pointerId); dragHint.classList.add("hidden"); });
canvas.addEventListener("pointermove", event => {
  if (!drag) return;
  const scale = canvas.clientWidth / canvas.width;
  offsetX = drag.offsetX + (event.clientX - drag.x) / scale;
  offsetY = drag.offsetY + (event.clientY - drag.y) / scale;
  draw();
});
canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("pointercancel", () => { drag = null; });
canvas.addEventListener("wheel", event => { event.preventDefault(); zoom = Math.max(1, Math.min(3, zoom - event.deltaY * .001)); zoomInput.value = String(zoom); zoomValue.textContent = `${Math.round(zoom * 100)}%`; draw(); }, { passive: false });

function canvasToFile(fileName) {
  const dataUrl = canvas.toDataURL("image/png");
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], fileName, { type: "image/png" });
}

document.querySelector("#download-button").addEventListener("click", async () => {
  if (!uploadedImage) { status.textContent = "Envie uma foto antes de baixar."; photoInput.focus(); return; }
  const fileName = `roberta-lopes-${currentFormat}-22032.png`;
  let file;
  try { file = canvasToFile(fileName); } catch (error) { status.textContent = "Não foi possível preparar a imagem. Tente novamente."; return; }
  if (savePreviewUrl) URL.revokeObjectURL(savePreviewUrl);
  savePreviewUrl = URL.createObjectURL(file);
  savePreviewImage.src = savePreviewUrl;
  savePreview.hidden = false;

  const canShareFile = typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
  if (canShareFile) {
    try {
      await navigator.share({ files: [file], title: "Foto de apoio · Roberta Lopes", text: "Minha foto de apoio à Roberta Lopes" });
      status.textContent = "Use “Salvar Imagem” no menu do iPhone para guardar sua arte.";
      return;
    } catch (error) {
      if (error?.name === "AbortError") { status.textContent = "Compartilhamento cancelado. Toque novamente para salvar."; return; }
    }
  }

  const link = document.createElement("a");
  link.download = fileName;
  link.href = savePreviewUrl;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  status.textContent = "Se o arquivo não aparecer, toque e segure a imagem abaixo e escolha “Salvar Imagem”.";
});

document.fonts?.ready?.then(draw);
setFormat("story");
