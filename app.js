const pdfInput = document.getElementById("pdfInput");
const statusEl = document.getElementById("status");
const passwordSection = document.getElementById("passwordSection");
const passwordInput = document.getElementById("pdfPassword");
const passwordSubmit = document.getElementById("passwordSubmit");
const cardTypeSection = document.getElementById("cardTypeSection");
const previewSection = document.getElementById("preview");
const pdfCanvas = document.getElementById("pdfCanvas");
const selectedTypeBadge = document.getElementById("selectedType");
const typeButtons = document.querySelectorAll(".type-button");

let currentPdfData = null;
let currentPdf = null;
let currentPassword = "";

const updateStatus = (message, isError = false) => {
  statusEl.textContent = message;
  statusEl.style.background = isError ? "#fee2e2" : "#f3f4f6";
  statusEl.style.color = isError ? "#b91c1c" : "#374151";
};

const resetState = () => {
  passwordSection.hidden = true;
  cardTypeSection.hidden = true;
  previewSection.hidden = true;
  selectedTypeBadge.textContent = "Card type: --";
  typeButtons.forEach((button) => button.classList.remove("active"));
  currentPdf = null;
  currentPassword = "";
  passwordInput.value = "";
};

const loadPdf = async (password = "") => {
  if (!window.pdfjsLib) {
    updateStatus("PDF.js load nahi hua. Internet connection check karein.", true);
    return;
  }

  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  try {
    const loadingTask = window.pdfjsLib.getDocument({
      data: currentPdfData,
      password,
    });
    const pdf = await loadingTask.promise;
    currentPdf = pdf;
    currentPassword = password;
    passwordSection.hidden = true;
    cardTypeSection.hidden = false;
    updateStatus("PDF open ho gaya. Ab card type select karein.");
    await renderFirstPage(pdf);
  } catch (error) {
    if (error?.name === "PasswordException") {
      passwordSection.hidden = false;
      updateStatus("PDF password protected hai. Password enter karein.");
      return;
    }
    updateStatus("PDF load nahi ho paya. Dusri file try karein.", true);
  }
};

const renderFirstPage = async (pdf) => {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.4 });
  const context = pdfCanvas.getContext("2d");
  pdfCanvas.width = viewport.width;
  pdfCanvas.height = viewport.height;
  await page.render({ canvasContext: context, viewport }).promise;
  previewSection.hidden = false;
};

pdfInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  resetState();

  if (!file) {
    updateStatus("Koi file select nahi hui.");
    return;
  }

  updateStatus(`File selected: ${file.name}. PDF check ho raha hai...`);
  currentPdfData = await file.arrayBuffer();
  await loadPdf();
});

passwordSubmit.addEventListener("click", async () => {
  if (!currentPdfData) {
    return;
  }
  const password = passwordInput.value.trim();
  if (!password) {
    updateStatus("Password blank hai. Please enter karein.", true);
    return;
  }
  updateStatus("Password verify ho raha hai...");
  await loadPdf(password);
});

typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    typeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const selectedType = button.dataset.type;
    selectedTypeBadge.textContent = `Card type: ${selectedType}`;
    updateStatus(`${selectedType} card ke liye print ready hai.`);
  });
});
