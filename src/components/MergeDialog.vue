<template>
  <div
    v-if="show"
    class="dialog-overlay"
    @click="handleOverlayClick"
    @dragenter.stop
    @dragover.stop
    @drop.stop
  >
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h3>Merge PDF Files</h3>
        <button @click="closeDialog" class="dialog-close-btn">&times;</button>
      </div>

      <div class="dialog-content">
        <!-- Upload Section -->
        <div class="image-upload-section">
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
        <div v-if="progress > 0" class="progress">
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
        <div v-if="pdfFiles.length > 0" class="files-list">
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
                <i class="fa-solid fa-file-pdf"></i>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
              <button @click="removeFile(index)" class="dialog-close-btn">&times;</button>
            </div>
          </div>
          <p class="reorder-hint">
            <i class="fa-solid fa-info-circle"></i>
            Drag and drop to reorder files
          </p>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="closeDialog" class="btn-secondary" :disabled="merging">Cancel</button>
        <button v-if="mergedPdfBytes" @click="downloadPDF" class="btn-success">
          <i class="fa-solid fa-download"></i>
        </button>
        <button v-if="mergedPdfBytes" @click="mergeOrganizer" class="btn-primary">
          <i class="fa-solid fa-file-import mr-0.5"></i>
          Add to Organizer
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
  emits: ["close", "merge"],
  setup(props, { emit }) {
    const pdfFiles = ref([]);
    const fileInput = ref(null);
    const error = ref("");
    const merging = ref(false);
    const progress = ref(0);
    const draggedIndex = ref(null);
    const mergedPdfBytes = ref(null);
    const mergedFileName = ref("");

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
    watch(
      () => props.show,
      (newValue) => {
        if (newValue) {
          resetState();
          pdfFiles.value = [...props.initialFile];
        }
      },
    );

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
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
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
    };

    const mergePDFs = async () => {
      if (pdfFiles.value.length < 2) {
        setError("Please select at least 2 PDF files to merge.");
        return;
      }

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
      } catch (err) {
        console.error("Error merging PDFs:", err);
        setError("Failed to merge PDFs. Please make sure all files are valid PDF documents.");
        merging.value = false;
        progress.value = 0;
      }
    };

    const mergeOrganizer = () => {
      emit("merge", new Blob([mergedPdfBytes.value], { type: "application/pdf" }));
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
      mergeOrganizer,
      setError,
    };
  },
};
</script>

<style>
@reference "../css/tailwind.css";
</style>
