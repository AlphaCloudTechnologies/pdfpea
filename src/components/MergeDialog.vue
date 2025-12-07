<template>
  <div v-if="show" class="merge-dialog-overlay" @click="handleOverlayClick"
    @dragenter.stop
    @dragover.stop
    @drop.stop
  >
    <div class="merge-dialog" @click.stop>
      <div class="merge-dialog-header">
        <h3>Merge PDF Files</h3>
        <button @click="closeDialog" class="dialog-close-btn">&times;</button>
      </div>

      <div class="merge-dialog-content">
        <!-- Upload Section -->
        <div class="merge-upload-section">
          <div
            class="upload-area"
            @click="triggerFileInput"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              ref="fileInput"
              accept="application/pdf"
              multiple
              @change="handleFileUpload"
              style="display: none"
            />
            <i class="fa-solid fa-cloud-upload-alt upload-icon"></i>
            <p>Click to upload or drag and drop PDF files</p>
            <p class="upload-hint">You can select multiple PDF files</p>
          </div>
        </div>
        <!-- Progress -->
        <div v-if="progress > 0" class="merge-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p>Merging PDFs... {{ progress }}%</p>
        </div>
        <!-- Error -->
        <div v-if="error" class="merge-error">
          <i class="fa-solid fa-exclamation-circle"></i>
          <p>{{ error }}</p>
        </div>
        <!-- Files List -->
        <div v-if="pdfFiles.length > 0"
          class="files-list"
        >
          <h4>Files to Merge ({{ pdfFiles.length }}):</h4>
          <div class="files-container">
            <div
              v-for="(file, index) in pdfFiles"
              :key="index"
              class="file-item"
              draggable="true"
              @dragstart="handleDragStart(index)"
              @dragover.prevent
              @drop.prevent="handleDropReorder(index)"
            >
              <div class="file-drag-handle">
                <i class="fa-solid fa-grip-vertical"></i>
              </div>
              <div class="file-info">
                <i class="fa-solid fa-file-pdf file-icon"></i>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <button @click="removeFile(index)" class="remove-btn" title="Remove">
                <i class="fa-solid fa-times"></i>
              </button>
            </div>
          </div>
          <p class="reorder-hint">
            <i class="fa-solid fa-info-circle"></i>
            Drag and drop to reorder files
          </p>
        </div>

      </div>

      <div class="merge-dialog-footer">
        <button @click="closeDialog" class="btn-secondary" :disabled="merging">Cancel</button>
        <button
          v-if="mergedPdfBytes"
          @click="downloadPDF"
          class="download-btn"
        >
          <i class="fa-solid fa-download"></i>
          Download PDF
        </button>
        <button
          v-else
          @click="mergePDFs"
          :disabled="pdfFiles.length < 2 || merging"
          class="btn-primary"
        >
          <i class="fa-solid fa-object-group"></i>
          Merge {{ pdfFiles.length }} Files
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, watch } from "vue";

export default {
  name: "MergeDialog",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    showToast: {
      type: Function,
      default: null,
    },
    initialFile: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["close"],
  setup(props, { emit }) {
    const pdfFiles = ref([]);
    const fileInput = ref(null);
    const error = ref("");
    const merging = ref(false);
    const progress = ref(0);
    const draggedIndex = ref(null);
    const mergedPdfBytes = ref(null);
    const mergedFileName = ref("");
    const dragOverIndex = ref(null);

    // Set error message with auto-clear
    const setError = (msg) => {
      error.value = msg;
      if (msg) {
        setTimeout(() => {
          error.value = "";
        }, 3000);
      }
    };
    // Reset state when dialog is opened
    watch(() => props.show, (newValue) => {
      if (newValue) {
        resetState();
        pdfFiles.value = [...props.initialFile];
      }
    },);

    const resetState = () => {
      pdfFiles.value = [];
      error.value = "";
      merging.value = false;
      progress.value = 0;
      draggedIndex.value = null;
      mergedPdfBytes.value = null;
      mergedFileName.value = "";
    };

    const handleOverlayClick = () => {
      if (!merging.value) {
        closeDialog();
      }
    };

    const closeDialog = () => {
      if (!merging.value) {
        emit("close");
      }
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileUpload = (event) => {
      const files = Array.from(event.target.files);
      addFiles(files);
      // Reset input so same file can be selected again
      event.target.value = "";
    };

    const handleDrop = (event) => {
      const files = Array.from(event.dataTransfer.files);
      const pdfFilesOnly = files.filter((file) => file.type === "application/pdf");

      if (pdfFilesOnly.length === 0) {
        setError("Please select only PDF files.");
        return;
      }

      addFiles(pdfFilesOnly);
    };

    const addFiles = (files) => {
      error.value = "";

      for (const file of files) {
        // Check if file is PDF
        if (file.type !== "application/pdf") {
          setError(`${file.name} is not a PDF file and was skipped.`);
          continue;
        }

        // Check file size (limit to 50MB per file)
        if (file.size > 50 * 1024 * 1024) {
          setError(`${file.name} exceeds 50MB and was skipped.`);
          continue;
        }

        pdfFiles.value.push(file);
      }
    };

    const removeFile = (index) => {
      pdfFiles.value.splice(index, 1);
      error.value = "";
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
    };

    // Drag and drop reordering
    const handleDragStart = (index) => {
      draggedIndex.value = index;
    };

    const handleDropReorder = (dropIndex) => {
      if (draggedIndex.value === null) return;
      const draggedFile = pdfFiles.value[draggedIndex.value];
      pdfFiles.value.splice(draggedIndex.value, 1);
      pdfFiles.value.splice(dropIndex, 0, draggedFile);
      draggedIndex.value = null;
      dragOverIndex.value = null;
    };

    const mergePDFs = async () => {
      if (pdfFiles.value.length < 2) {
        setError("Please select at least 2 PDF files to merge.");
        return;
      }

      error.value = "";
      merging.value = true;
      progress.value = 0;

      try {
        // Load pdf-lib
        const { PDFDocument } = window.PDFLib;

        // Create a new PDF document
        const mergedPdf = await PDFDocument.create();
        progress.value = 10;

        // Process each file
        const totalFiles = pdfFiles.value.length;
        const progressPerFile = 80 / totalFiles;

        for (let i = 0; i < totalFiles; i++) {
          const file = pdfFiles.value[i];

          // Read file as array buffer
          const arrayBuffer = await file.arrayBuffer();

          // Load the PDF
          const pdf = await PDFDocument.load(arrayBuffer);

          // Copy all pages from this PDF
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });

          progress.value = 10 + Math.round((i + 1) * progressPerFile);
        }

        progress.value = 90;

        // Save the merged PDF
        const bytes = await mergedPdf.save();
        progress.value = 100;
        mergedPdfBytes.value = bytes;
        mergedFileName.value = `merged_${pdfFiles.value.length}_files.pdf`;

        if (mergedPdfBytes.value) {
          merging.value = false;
        }
      }
      catch (err) {
        console.error("Error merging PDFs:", err);
        setError("Failed to merge PDFs. Please make sure all files are valid PDF documents.");
        if (props.showToast) props.showToast(error.value, "error");
        merging.value = false;
        progress.value = 0;
      }
    };

    const downloadPDF = () => {
      if (!mergedPdfBytes.value) return;
      const blob = new Blob([mergedPdfBytes.value], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mergedFileName.value;
      document.body.appendChild(a);
      a.click();
      let downloadHandled = false;

      const onFocus = () => {
        if (!downloadHandled) {
          downloadHandled = true;
          merging.value = false;
          progress.value = 0;
          closeDialog();
          window.removeEventListener("focus", onFocus);
        }
      };

      window.addEventListener("focus", onFocus);
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    };

    return {
      pdfFiles,
      fileInput,
      error,
      merging,
      progress,
      mergedPdfBytes,
      handleOverlayClick,
      closeDialog,
      triggerFileInput,
      handleFileUpload,
      handleDrop,
      removeFile,
      formatFileSize,
      handleDragStart,
      handleDropReorder,
      mergePDFs,
      downloadPDF,
      setError,
    };
  },
};
</script>

<style scoped>
.merge-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.merge-dialog {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.merge-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.merge-dialog-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.dialog-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.dialog-close-btn:hover {
  background: white;
}

.merge-dialog-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 16px;
}

.upload-area p {
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.upload-hint {
  color: #999 !important;
  font-size: 12px !important;
}

.files-list {
  margin-top: 24px;
}

.files-list h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.files-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  cursor: move;
  transition: background 0.2s;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item:hover {
  background: #f8f9fa;
}

.file-drag-handle {
  color: #999;
  margin-right: 12px;
  font-size: 16px;
}

.file-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
  color: #dc3545;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: #ffe5e5;
}

.reorder-hint {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.merge-progress {
  margin-top: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
}

.merge-progress p {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0;
}

.merge-error {
  margin-top: 16px;
  padding: 12px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.merge-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background:#007bca;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.download-btn {
  padding: 10px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
}

.download-btn:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.download-btn i {
  font-size: 16px;
}

.btn-primary,
.btn-secondary,
.remove-btn,
.dialog-close-btn,
.download-btn {
  border-radius: 90px;
}
</style>
