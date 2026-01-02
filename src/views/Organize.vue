<template>
  <div class="pdf-organizer" @dragenter.stop @dragover.stop @drop.stop>
    <div class="p-2">
      <div class="header-actions">
        <div class="element-container ml-2">
          <div class="option-element">
            <input
              type="file"
              id="file"
              ref="fileInput"
              style="display: none"
              @change="handleFileUpload"
            />
            <button
              @click="clickFileInput"
              class="btn ml-4"
              title="Open a PDF file from your device"
            >
              <i class="fa-solid fa-folder-open mr-2"></i>
              Open
            </button>
          </div>
          <div class="option-element" style="position: relative">
            <div class="dropdown" @click.stop>
              <button
                @click="showExportMenu = !showExportMenu"
                class="btn"
                title="Export the organized PDF"
              >
                <i class="fa-solid fa-download mr-2"></i> Export
              </button>
              <div class="dropdown-menu" :class="{ show: showExportMenu }">
                <button class="dropdown-item" @click="handleExport('file')">
                  <i class="fa-solid fa-file-export mr-2"></i> Export File
                </button>
                <button class="dropdown-item" @click="handleExport('selected')">
                  <i class="fa-solid fa-check mr-2"></i> Export Selected
                </button>
              </div>
            </div>
          </div>
          <input
            type="file"
            ref="fileAppend"
            style="display: none"
            accept=".pdf"
            @change="handleAppendFile"
          />
          <button @click="clickAppendFileInput" class="btn">
            <i class="fa-solid fa-file-circle-plus mr-2"></i>
            Add file
          </button>
          <div class="option-element">
            <button @click="scrollToEditor" class="btn btn-xs" title="Focus on the PDF editor area">
              <i class="fa-solid fa-expand"></i>
              Focus
            </button>
          </div>
          <div class="option-element">
            <select v-model="pagesPerRow" class="btn btn-xs" title="Pages per row">
              <option value="3">3 pages</option>
              <option value="4">4 pages</option>
              <option value="5">5 pages</option>
              <option value="6">6 pages</option>
            </select>
          </div>
          <div class="option-element">
            <button @click="openMergeDialog" class="btn" title="Merge multiple PDF files">
              <i class="fa-solid fa-object-group"></i>
              Merge PDF
            </button>
          </div>
          <div class="option-element">
            <button @click="openSplitDialog" class="btn" title="Split PDF">
              <i class="fa-solid fa-scissors"></i>
              Split PDF
            </button>
          </div>
          <div class="option-element">
            <button @click="sendToPDFEditor" class="btn" title="Send PDF to editor">
              <i class="fa-solid fa-share-from-square"></i>
              Send to Editor
            </button>
          </div>
          <div v-if="selectedTool === 'select'" class="option-element" style="position: relative">
            <div class="dropdown" @click.stop>
              <button
                @click="showActionMenu = !showActionMenu"
                class="btn"
                title="Action for selected pages"
              >
                <i class="fa-solid fa-check mr-2"></i> Selected
              </button>
              <div class="dropdown-menu" :class="{ show: showActionMenu }">
                <button
                  class="dropdown-item"
                  @click="
                    toggleSelectAll();
                    selectTool('select');
                  "
                >
                  <i class="fa-solid fa-circle-check mr-2"></i> Select All
                </button>
                <button class="dropdown-item" @click="applyToSelected('Delete')">
                  <i class="fa-solid fa-trash mr-2"></i> Delete
                </button>
                <button class="dropdown-item" @click="applyToSelected('Rotate')">
                  <i class="fa-solid fa-rotate-right mr-2"></i> Rotate
                </button>
                <button class="dropdown-item" @click="applyToSelected('Sort')">
                  <i class="fa-solid fa-sort mr-2"></i> Sort
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="organize-body p-8" :data-tool="selectedTool">
      <!-- Floating Toolbar -->
      <div class="floating-toolbar">
        <div class="tools-section">
          <div
            class="body-tool"
            :class="{ active: selectedTool === 'select' }"
            @click="selectTool('select')"
            title="Select Tool - Click to select pages"
          >
            <i class="fa-solid fa-mouse-pointer"></i>
          </div>
          <div
            class="body-tool"
            :class="{ active: selectedTool === 'swap' }"
            @click="selectTool('swap')"
            title="Swap Tool - Click a page and swap with another"
          >
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
          </div>
          <div
            class="body-tool"
            :class="{ active: selectedTool === 'delete' }"
            @click="selectTool('delete')"
            title="Delete Tool - Click pages to delete them"
          >
            <i class="fa-solid fa-trash"></i>
          </div>

          <div
            class="body-tool"
            :class="{ active: selectedTool === 'rotate' }"
            @click="selectTool('rotate')"
            title="Rotate Tool - Click pages to rotate them 90° clockwise"
          >
            <i class="fa-solid fa-rotate-right"></i>
          </div>

          <div
            class="body-tool"
            :class="{ active: selectedTool === 'duplicate' }"
            @click="selectTool('duplicate')"
            title="Duplicate Tool - Click pages to duplicate them"
          >
            <i class="fa-solid fa-copy"></i>
          </div>
          <div
            class="body-tool"
            :class="{ active: selectedTool === 'sort' }"
            @click="reversePages"
            title="Sort - Reverse page order"
          >
            <i class="fa-solid fa-sort"></i>
          </div>
        </div>
      </div>
      <div
        ref="pdfViewContainer"
        id="body-pdf-view"
        class="body-pdf-view"
        @dragover.prevent="handleDragOver"
      >
        <!-- Placeholder content for when no PDF is loaded -->
        <div v-if="!isLoaded" class="pdf-placeholder">
          <div class="pdf-placeholder-content">
            <i class="fas fa-file-pdf pdf-placeholder-icon"></i>

            <p class="pdf-placeholder-text">Drag and drop a PDF file here to get started</p>
            <p class="pdf-placeholder-text-secondary">
              or use the
              <button @click="clickFileInput" class="btn">
                <i class="fa-solid fa-folder-open mr-2"></i>
                Open
              </button>
              button above to browse for a file
            </p>
            <div class="pdf-placeholder-formats">
              <span class="pdf-placeholder-format">PDF files</span>
              <span class="pdf-placeholder-format ml-3">JSON config files</span>
            </div>
          </div>
        </div>
        <!-- Pages Grid -->
        <div class="pages-grid" :style="{ gridTemplateColumns: `repeat(${pagesPerRow}, 1fr)` }">
          <div v-for="{ page, index } in validPages" :key="page.id" class="page-card-wrapper">
            <div
              :class="[
                'page-card',
                colorPage[(page.fileIndex || 0) % colorPage.length],
                {
                  selected: page.selected,
                  'ring-4': page.selected,
                },
              ]"
              :draggable="selectedTool === 'select'"
              @click="handlePageClick(index, $event)"
              @dragstart="selectedTool === 'select' ? handleDragStart(index) : null"
              @dragend="selectedTool === 'select' ? handleDragEnd : null"
              @dragover.prevent
              @drop.prevent="selectedTool === 'select' ? handlePageDrop(index) : null"
            >
              <div class="page-thumbnail">
                <canvas :ref="(el) => setPageCanvas(page.id, el)" class="page-canvas"></canvas>
                <div
                  :class="[
                    'page-number-badge',
                    (colorPage?.[(page?.fileIndex ?? 0) % (colorPage?.length || 1)] ?? '').split(
                      ' ',
                    )[0],
                  ]"
                >
                  {{ page.pageNumber || index + 1 }}
                </div>
              </div>
              <div class="current-number">{{ index + 1 }}</div>

              <!-- Hover Actions -->
              <div class="page-hover-actions">
                <button @click="previewPage(index)" class="page-action-btn" title="Preview">
                  <i class="fa-solid fa-magnifying-glass"></i>
                </button>
                <button @click.stop="rotatePage(index, 90)" class="page-action-btn" title="Rotate">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button
                  @click.stop="duplicatePage(index)"
                  class="page-action-btn"
                  title="Duplicate"
                >
                  <i class="fa-solid fa-copy"></i>
                </button>
                <button @click.stop="deletePage(index)" class="page-action-btn" title="Delete">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Add Blank Page Button (Right side) -->
            <button
              @click.stop="addBlankPage(index + 1)"
              :class="[
                'add-blank-page-btn',
                (colorPage?.[(page?.fileIndex ?? 0) % (colorPage?.length || 1)] ?? '').split(
                  ' ',
                )[0],
              ]"
              title="Add blank page"
            >
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="previewModal.show" class="preview-modal-overlay" @click.self="closePreview">
    <button class="preview-close-btn" @click="closePreview">
      <i class="fa-solid fa-xmark"></i>
    </button>

    <div class="preview-content">
      <div class="preview-canvas-wrapper" @click.stop>
        <div
          class="preview-image-container"
          @mousemove="zoomEnabled ? handleZoomMove($event) : null"
          @mouseenter="zoomEnabled ? (showZoomLens = true) : null"
          @mouseleave="showZoomLens = false"
        >
          <canvas ref="previewCanvasRef" class="preview-canvas"></canvas>
          <div v-if="showZoomLens" class="zoom-lens" :style="zoomLensStyle"></div>
        </div>
        <div v-if="showZoomLens && zoomEnabled" class="zoom-result" :style="zoomResultStyle"></div>
        <div class="preview-controls">
          <button
            class="preview-control-btn"
            :disabled="previewModal.pageIndex <= 0"
            @click.stop="prevPreviewPage"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="preview-page-info"
            >{{ previewModal.pageIndex + 1 }} / {{ pages.length }}</span
          >
          <button
            class="preview-control-btn"
            :disabled="previewModal.pageIndex >= pages.length - 1"
            @click.stop="nextPreviewPage"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          <div class="preview-divider"></div>
          <button
            class="preview-control-btn"
            @click="handlePreviewAction('toggleZoom')"
            :class="{ active: zoomEnabled }"
            title="Toggle zoom"
          >
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            class="preview-control-btn"
            @click="handlePreviewAction('rotatePage')"
            title="Rotate Page"
          >
            <i class="fa-solid fa-rotate-right"></i>
          </button>
          <button
            class="preview-control-btn"
            @click="handlePreviewAction('deletePage')"
            title="Delete Page"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Split Dialog -->
  <SplitDialog
    :show="showSplitDialog"
    :totalPages="pages.length"
    @close="closeSplitDialog"
    @split="handleSplit"
  />

  <!-- Merge Dialog -->
  <MergeDialog
    :show="showMergeDialog"
    :initialFile="initialFile"
    @close="closeMergeDialog"
    @merge="handleMerge"
  />

  <!-- Dynamic toast -->
  <div
    v-if="toast.show"
    style="
      position: fixed;
      top: 80px;
      right: 20px;
      background: #4ade80;
      color: white;
      padding: 16px;
      border-radius: 8px;
      z-index: 99999;
      min-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    "
    @click="hideToast"
  >
    <div style="display: flex; align-items: center; justify-content: space-between">
      <span>{{ toast.message }}</span>
      <button
        @click.stop="hideToast"
        style="
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          margin-left: 10px;
        "
      >
        ×
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { PDFOrganizer } from "../js/PDFOrganizer.js";
import SplitDialog from "../components/SplitDialog.vue";
import MergeDialog from "../components/MergeDialog.vue";
import { clear } from "console";

export default {
  name: "OrganizerApp",
  setup() {
    const fileInput = ref(null);
    const fileAppend = ref(null);
    const organizer = new PDFOrganizer();
    const pages = ref([]);
    const isLoaded = ref(false);
    // drag and drop state
    const draggedIndex = ref(null);
    const draggedIndices = ref([]);
    const pagesPerRow = ref(5);
    const pageCanvasRefs = ref({});
    // Tool and selection state
    const selectedTool = ref("select");
    const selectedCount = ref(0);
    const allSelected = ref(false);
    const autoScrollInterval = ref(null);
    const swapSourceIndex = ref(null);
    const pdfViewContainer = ref(null);
    const showActionMenu = ref(false);
    const showExportMenu = ref(false);
    // Preview modal state
    const previewModal = ref({ show: false, pageIndex: -1, scale: 2.0 });
    const previewCanvasRef = ref(null);
    const showZoomLens = ref(false);
    const zoomLensStyle = ref({});
    const zoomResultStyle = ref({});
    const zoomEnabled = ref(false);

    // Split and Merge dialog state
    const showSplitDialog = ref(false);
    const showMergeDialog = ref(false);

    const initialFile = ref([]);

    // To track last selected index for shift-click selection
    let lastSelectedIndex = -1;
    const colorPage = [
      "bg-blue-400 border-blue-300 ring-blue-300",
      "bg-red-400 border-red-300 ring-red-300",
      "bg-green-400 border-green-300 ring-green-300",
      "bg-purple-400 border-purple-300 ring-purple-300",
      "bg-orange-400 border-orange-300 ring-orange-300",
      "bg-pink-400 border-pink-300 ring-pink-300",
    ];

    const toast = ref({
      show: false,
      message: "",
      type: "success", // 'success', 'error', 'info', 'warning'
      timeout: null,
    });

    // Computed property to filter valid pages while preserving original indices
    const validPages = computed(() => {
      return pages.value
        .map((page, index) => ({ page, index }))
        .filter(({ page }) => page && page.id !== undefined);
    });

    // Toast functions
    const showToast = (message, type = "success", duration = 2000) => {
      // Clear existing timeout
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
      }

      toast.value.message = message;
      toast.value.type = type;
      toast.value.show = true;

      // Auto-hide after duration
      toast.value.timeout = setTimeout(() => {
        hideToast();
      }, duration);
    };

    const hideToast = () => {
      toast.value.show = false;
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
        toast.value.timeout = null;
      }
    };

    // File handling
    const clickFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileUpload = () => {
      const file = fileInput.value.files[0];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Please select a PDF file.", "warning");
        return;
      }
      if (file) {
        loadPDFFile(file);
        // Reset input to allow re-uploading the same file
        fileInput.value.value = "";
      }
    };

    // Append PDF logic
    const clickAppendFileInput = () => {
      fileAppend.value?.click();
    };

    const handleAppendFile = () => {
      const file = fileAppend.value.files[0];
      if (!file) return;

      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        showToast("Please select a PDF file.", "warning");
        return;
      }

      loadPDFFile(file, false);
      // Reset input to allow re-uploading the same file
      fileAppend.value.value = "";
    };

    // Load PDF file
    const loadPDFFile = async (file, reset = true) => {
      if (file.type !== "application/pdf") {
        return;
      }
      try {
        const result = await organizer.loadPDFFile(file, reset);
        // Update pages with reactivity trigger
        pages.value = [...result.pages];
        isLoaded.value = true;

        // Wait for DOM to update and render
        await nextTick();

        // Render only the newly added pages
        for (let i = result.startId; i < result.endId; i++) {
          const pageIndex = pages.value.findIndex((p) => p.id === i);
          if (pageIndex !== -1) {
            await renderPage(pageIndex);
          }
        }
      } catch (err) {
        showToast("Error loading PDF");
      }
    };

    // Tool selection
    const selectTool = (tool) => {
      selectedTool.value = tool;
      // Reset swap source when switching tools
      if (tool !== "select") {
        pages.value.forEach((page) => {
          page.selected = false;
        });
        updateSelectionCount();
      }
      if (tool !== "swap") {
        swapSourceIndex.value = null;
      }
    };
    const updateSelectionCount = () => {
      selectedCount.value = pages.value.filter((p) => p?.selected).length;
      allSelected.value = pages.value.length > 0 && selectedCount.value === pages.value.length;
    };
    // Page selection handlers
    const handlePageClick = async (index, event) => {
      const tool = selectedTool.value;
      if (tool === "select") return setSelectedPage(index, event);
      if (tool === "delete") return deletePage(index);
      if (tool === "rotate") return rotatePage(index, 90);
      if (tool === "duplicate") return duplicatePage(index);
      if (tool === "swap") {
        if (pages.value[index]) {
          pages.value[index].selected = true;
          await swapPages(index);
        }
      }
    };

    const setSelectedPage = (index, event) => {
      const page = pages.value[index];
      // Use Ctrl/Cmd for single select, Shift for range select
      if (event.ctrlKey || event.metaKey) {
        // Clear other selections
        pages.value.forEach((p, idx) => {
          p.selected = idx === index;
        });
      } else if (event.shiftKey && lastSelectedIndex !== -1) {
        // Select range
        const [start, end] = [lastSelectedIndex, index].sort((a, b) => a - b);
        for (let i = start; i <= end; i++) {
          pages.value[i].selected = pages.value[lastSelectedIndex].selected;
        }
      } else {
        page.selected = !page.selected;
        lastSelectedIndex = index;
      }
      updateSelectionCount();
    };

    // Page operations
    const swapPages = async (index) => {
      if (!pages.value || index < 0 || index >= pages.value.length) return;
      if (swapSourceIndex.value === null) {
        swapSourceIndex.value = index;
      } else if (swapSourceIndex.value === index) {
        // Clicked the same page, reset
        if (pages.value[index]) pages.value[index].selected = false;
        swapSourceIndex.value = null;
        updateSelectionCount();
      } else {
        // Perform swap
        const fromIndex = swapSourceIndex.value;
        const toIndex = index;
        organizer.swapPages(swapSourceIndex.value, index);
        pages.value = [...organizer.getPages()];
        // Clear selected state after swap
        if (pages.value[fromIndex]) pages.value[fromIndex].selected = false;
        if (pages.value[toIndex]) pages.value[toIndex].selected = false;
        swapSourceIndex.value = null;
        updateSelectionCount();
        await nextTick();
        await renderPage(swapSourceIndex.value);
        await renderPage(index);
      }
    };
    const rotatePage = async (index, degrees) => {
      organizer.rotatePage(index, degrees);
      pages.value = [...organizer.getPages()];

      await nextTick();
      await renderPage(index);
    };

    const duplicatePage = async (index) => {
      const newPage = organizer.duplicatePage(index);
      if (!newPage) return;

      pages.value = [...organizer.getPages()];
      await nextTick();
      await renderPage(index + 1);
    };

    const addBlankPage = async (index) => {
      const blankPage = organizer.addBlankPage(index);
      pages.value = [...organizer.getPages()];

      await nextTick();

      const canvas = pageCanvasRefs.value[blankPage.id];
      if (canvas) {
        organizer.renderBlankPage(canvas);
      }
    };

    const deletePage = (index) => {
      const page = pages.value[index];

      // Clean up canvas reference
      if (page && page.id !== undefined) {
        delete pageCanvasRefs.value[page.id];
      }

      organizer.deletePage(index);
      pages.value = [...organizer.getPages()];

      // If all pages deleted, reset to empty state
      if (pages.value.length === 0) {
        isLoaded.value = false;
        // Reset file input to allow re-uploading the same file
        if (fileInput.value) {
          fileInput.value.value = "";
        }
      }
    };

    const reversePages = async () => {
      organizer.reversePages();
      pages.value = [...organizer.getPages()];
      await nextTick();
      await renderAllPages();
    };

    const toggleSelectAll = () => {
      const shouldSelect = !allSelected.value;
      pages.value.forEach((page) => {
        page.selected = shouldSelect;
      });
      updateSelectionCount();
    };

    // Apply action to selected pages
    const applyToSelected = async (actionType) => {
      showActionMenu.value = false;
      const selectedIndices = [];
      pages.value.forEach((page, index) => {
        if (page.selected) selectedIndices.push(index);
      });

      if (selectedIndices.length === 0) {
        showToast("No pages selected", "warning");
        return;
      }

      if (actionType === "Delete") {
        // Delete from highest index to lowest
        for (let i = selectedIndices.length - 1; i >= 0; i--) {
          organizer.deletePage(selectedIndices[i]);
        }
        pages.value = [...organizer.getPages()];
        // If all pages deleted, reset to empty state
        if (pages.value.length === 0) {
          isLoaded.value = false;
          if (fileInput.value) {
            fileInput.value.value = "";
          }
        }
      } else if (actionType === "Rotate") {
        // Rotate all selected pages
        for (const index of selectedIndices) {
          organizer.rotatePage(index, 90);
        }
        pages.value = [...organizer.getPages()];
        await nextTick();
        for (const index of selectedIndices) {
          await renderPage(index);
        }
      } else if (actionType === "Sort") {
        // Sort (reverse) selected pages
        organizer.sortSelectedPages(selectedIndices);
        pages.value = [...organizer.getPages()];
        await nextTick();
        for (const idx of selectedIndices) {
          await renderPage(idx);
        }
      }

      updateSelectionCount();
    };
    // Page rendering
    const renderAllPages = async () => {
      for (let i = 0; i < pages.value.length; i++) {
        await renderPage(i);
      }
    };

    const renderPage = async (index) => {
      const page = pages.value[index];
      if (!page) return;
      let canvas = pageCanvasRefs.value[page.id];
      let attempts = 0;
      const maxAttempts = 20;
      while (!canvas && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        canvas = pageCanvasRefs.value[page.id];
        attempts++;
      }
      if (!canvas) {
        return;
      }
      try {
        if (page.isBlank) {
          organizer.renderBlankPage(canvas);
        } else {
          await organizer.renderPage(index, canvas);
        }
      } catch (err) {
        console.error("Error rendering page:", err);
      }
    };

    const setPageCanvas = (pageId, el) => {
      if (el) {
        pageCanvasRefs.value[pageId] = el;
      }
    };

    // Preview modal methods
    const previewPage = async (index) => {
      previewModal.value.pageIndex = index;
      previewModal.value.show = true;

      await nextTick();
      await renderPreview();
    };

    const renderPreview = async () => {
      const index = previewModal.value.pageIndex;
      const canvas = previewCanvasRef.value;

      if (index >= 0 && canvas) {
        try {
          await organizer.renderPage(index, canvas, previewModal.value.scale);
        } catch (e) {
          console.error("Preview render error", e);
        }
      }
    };

    const closePreview = () => {
      previewModal.value.show = false;
      previewModal.value.pageIndex = -1;
      zoomEnabled.value = false;
      showZoomLens.value = false;
    };

    const navigatePreview = async (direction) => {
      const newIndex = previewModal.value.pageIndex + direction;
      if (newIndex >= 0 && newIndex < pages.value.length) {
        previewModal.value.pageIndex = newIndex;
        await nextTick();
        await renderPreview();
      }
    };

    const nextPreviewPage = () => navigatePreview(1);
    const prevPreviewPage = () => navigatePreview(-1);

    const toggleZoom = () => {
      zoomEnabled.value = !zoomEnabled.value;
      if (!zoomEnabled.value) {
        showZoomLens.value = false;
      }
    };

    const handleZoomMove = (event) => {
      const canvas = previewCanvasRef.value;
      if (!canvas) return;

      const container = event.currentTarget;
      const rect = container.getBoundingClientRect();

      // Zoom lens size
      const lensSize = 100;
      const zoomLevel = 2;
      const zoomResultSize = 200;
      const offset = 20; // Offset from cursor

      // Calculate mouse position relative to container
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      // Prevent lens from going outside the image
      x = Math.max(lensSize / 2, Math.min(x, rect.width - lensSize / 2));
      y = Math.max(lensSize / 2, Math.min(y, rect.height - lensSize / 2));

      // Position the lens
      zoomLensStyle.value = {
        left: `${x - lensSize / 2}px`,
        top: `${y - lensSize / 2}px`,
        width: `${lensSize}px`,
        height: `${lensSize}px`,
      };

      // Position zoom result near cursor (top-right of cursor)
      // Use absolute position relative to viewport
      let zoomResultX = event.clientX + offset;
      let zoomResultY = event.clientY - zoomResultSize - offset;

      // Keep zoom result within viewport bounds
      if (zoomResultX + zoomResultSize > window.innerWidth) {
        zoomResultX = event.clientX - zoomResultSize - offset;
      }
      if (zoomResultY < 0) {
        zoomResultY = event.clientY + offset;
      }

      // Calculate background position for zoomed result
      const bgPosX = -(x * zoomLevel - zoomResultSize / 2);
      const bgPosY = -(y * zoomLevel - zoomResultSize / 2);

      // Create zoom result style
      zoomResultStyle.value = {
        left: `${zoomResultX}px`,
        top: `${zoomResultY}px`,
        backgroundImage: `url(${canvas.toDataURL()})`,
        backgroundSize: `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`,
        backgroundPosition: `${bgPosX}px ${bgPosY}px`,
        backgroundRepeat: "no-repeat",
      };
    };
    const handlePreviewAction = (actionType) => {
      if (actionType === "toggleZoom") {
        toggleZoom();
      } else if (actionType === "deletePage") {
        const pageIndex = previewModal.value.pageIndex;
        deletePage(pageIndex);
        nextPreviewPage();
      } else if (actionType === "rotatePage") {
        const pageIndex = previewModal.value.pageIndex;
        rotatePage(pageIndex, 90);
        renderPreview();
      }
    };
    // Drag and drop
    const clearAutoScroll = () => {
      if (autoScrollInterval.value) {
        cancelAnimationFrame(autoScrollInterval.value);
        autoScrollInterval.value = null;
      }
    };

    const setupAutoScroll = (mouseY, rect) => {
      const scrollThreshold = 100;
      const scrollSpeed = 10;
      const container = pdfViewContainer.value;

      if (mouseY - rect.top < scrollThreshold) {
        const scroll = () => {
          container.scrollTop -= scrollSpeed;
          if (container.scrollTop > 0) autoScrollInterval.value = requestAnimationFrame(scroll);
        };
        autoScrollInterval.value = requestAnimationFrame(scroll);
      } else if (rect.bottom - mouseY < scrollThreshold) {
        const scroll = () => {
          container.scrollTop += scrollSpeed;
          if (container.scrollTop < container.scrollHeight - container.clientHeight) {
            autoScrollInterval.value = requestAnimationFrame(scroll);
          }
        };
        autoScrollInterval.value = requestAnimationFrame(scroll);
      }
    };

    const handleDragStart = (index) => {
      draggedIndex.value = index;

      // If dragging a selected page, drag all selected pages
      const draggedPage = pages.value[index];
      if (draggedPage.selected) {
        draggedIndices.value = [];
        pages.value.forEach((page, idx) => {
          if (page.selected) {
            draggedIndices.value.push(idx);
          }
        });
      } else {
        draggedIndices.value = [];
      }
    };

    const handleDragOver = (event) => {
      scrollToEditor();
      if (draggedIndex.value === null) return;
      const container = pdfViewContainer.value;
      if (!container) return;

      clearAutoScroll();
      const rect = container.getBoundingClientRect();
      setupAutoScroll(event.clientY, rect);
    };

    const handleDragEnd = () => clearAutoScroll();

    const handlePageDrop = (dropIndex) => {
      if (draggedIndex.value === null) return;

      // If dragging multiple selected pages
      if (draggedIndices.value.length > 1) {
        organizer.moveMultiplePages(draggedIndices.value, dropIndex);
      } else {
        // Single page drag
        organizer.movePage(draggedIndex.value, dropIndex);
      }
      // Update pages reference
      pages.value = [...organizer.getPages()];

      // Reset everything after drag and drop
      draggedIndex.value = null;
      draggedIndices.value = [];

      // Clear all selections
      pages.value.forEach((page) => {
        if (page?.selected) page.selected = false;
      });
      updateSelectionCount();

      // Clean up auto scroll
      clearAutoScroll();
    };

    // Scroll to editor area
    const scrollToEditor = () => {
      const pdfOrganizer = document.querySelector(".pdf-organizer");
      if (pdfOrganizer) {
        pdfOrganizer.scrollIntoView({
          block: "start",
          inline: "center",
        });
      }
    };

    // Merge dialog functions
    const openMergeDialog = async () => {
      if (isLoaded.value && pages.value.length > 0) {
        // Export current PDF as initial file for merge
        try {
          const pdfBytes = await organizer.exportPDF();
          const blob = new Blob([pdfBytes], { type: "application/pdf" });
          const currentFile = new File([blob], "current_files.pdf", { type: "application/pdf" });
          initialFile.value = [currentFile];
        } catch (err) {
          console.error("Error preparing current PDF:", err);
          initialFile.value = [];
        }
      } else {
        initialFile.value = [];
      }
      showMergeDialog.value = true;
    };

    const closeMergeDialog = () => {
      showMergeDialog.value = false;
    };

    const handleMerge = async (blob) => {
      try {
        const file = new File([blob], "merged.pdf", { type: "application/pdf" });
        await loadPDFFile(file, true);
        showMergeDialog.value = false;
        showToast("Merged PDF loaded successfully!", "success");
      } catch (err) {
        console.error("Error loading merged PDF:", err);
        showToast("Error loading merged PDF", "error");
      }
    };

    // Split dialog methods
    const openSplitDialog = () => {
      if (!isLoaded.value || pages.value.length === 0) {
        showToast("Please load a PDF first", "error");
        return;
      }
      showSplitDialog.value = true;
    };

    const closeSplitDialog = () => {
      showSplitDialog.value = false;
    };

    // Handle split action
    const handleSplit = async (splitData) => {
      try {
        let result;

        if (splitData.mode === "at-page") {
          result = await organizer.splitAtPage(splitData.splitAtPage);
          // Download two PDFs
          downloadPDFBytes(result[0], "split-part-1.pdf");
          downloadPDFBytes(result[1], "split-part-2.pdf");
        } else if (splitData.mode === "range") {
          result = await organizer.extractPageRange(splitData.rangeFrom, splitData.rangeTo);
          downloadPDFBytes(result, `splited_pdf.pdf`);
        } else if (splitData.mode === "every") {
          result = await organizer.splitEveryNPages(splitData.everyNPages);
          // Download multiple PDFs
          result.forEach((pdfBytes, i) => {
            downloadPDFBytes(pdfBytes, `split-part-${i + 1}.pdf`);
          });
        } else if (splitData.mode === "custom") {
          if (splitData.mergeRanges) {
            const indices = [];
            splitData.customRanges.forEach((range) => {
              for (let i = range.from; i <= range.to; i++) {
                indices.push(i - 1);
              }
            });
            const pdfBytes = await organizer.exportPDF(indices);
            downloadPDFBytes(pdfBytes, "splited_pdf.pdf");
          } else {
            for (let i = 0; i < splitData.customRanges.length; i++) {
              const range = splitData.customRanges[i];
              const pdfBytes = await organizer.extractPageRange(range.from, range.to);
              downloadPDFBytes(pdfBytes, `split-part-${i + 1}.pdf`);
            }
          }
        }
      } catch (err) {
        showToast("Error splitting PDF", "error");
      }
    };

    // Download PDF functions
    const downloadPDFBytes = async (pdfBytes, filename) => {
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      await nextTick();
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    // Download PDF
    const downloadFile = async () => {
      try {
        const pdfBytes = await organizer.exportPDF();

        await downloadPDFBytes(pdfBytes, "organized_pdf.pdf");
      } catch (err) {
        console.error("Error organizing PDF:", err);
      }
    };
    // Export selected pages
    const exportSelected = async () => {
      const selectedIndices = [];
      try {
        pages.value.forEach((page, index) => {
          if (page.selected) selectedIndices.push(index);
        });
        const pdfBytes = await organizer.exportPDF(selectedIndices);
        const filename = `organized_pdf.pdf`;
        downloadPDFBytes(pdfBytes, filename);
      } catch (err) {
        showToast("Error exporting selected pages", "error");
      }
    };
    // Handle export dropdown change
    const handleExport = async (value) => {
      showExportMenu.value = false;
      if (value === "file") await downloadFile();
      else if (value === "selected") {
        if (selectedCount.value === 0) {
          showToast("No pages selected to export", "warning");
          return;
        }
        await exportSelected();
      }
    };

    // Convert and send to PDF Editor
    const sendToPDFEditor = async () => {
      try {
        if (!isLoaded.value || pages.value.length === 0) {
          showToast("Please load a PDF first", "error");
          return;
        }

        const pdfBytes = await organizer.exportPDF();

        // Store in sessionStorage to transfer to PDF Editor
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const reader = new FileReader();

        reader.onload = (e) => {
          sessionStorage.setItem("pdfFileFromOrganizer", e.target.result);

          // Dispatch event to notify PDF Editor
          const event = new CustomEvent("loadPdfFromOrganizer", {
            detail: { pdfData: e.target.result },
          });
          window.dispatchEvent(event);

          // Auto switch to edit tab
          if (typeof window.switchEditorTab === "function") {
            window.switchEditorTab("edit");
          }
        };

        reader.readAsArrayBuffer(blob);
      } catch (err) {
        showToast("Error sending to PDF Editor", "error");
      }
    };

    const handleGlobalClick = () => {
      showActionMenu.value = false;
      showExportMenu.value = false;
    };

    onMounted(() => {
      document.addEventListener("click", handleGlobalClick);
    });

    onUnmounted(() => {
      document.removeEventListener("click", handleGlobalClick);
      clearAutoScroll();
    });

    return {
      fileInput,
      fileAppend,
      pages,
      isLoaded,
      pagesPerRow,
      selectedTool,
      selectedCount,
      allSelected,
      swapSourceIndex,
      pdfViewContainer,
      showActionMenu,
      showExportMenu,
      previewModal,
      previewCanvasRef,
      showZoomLens,
      zoomLensStyle,
      zoomResultStyle,
      zoomEnabled,
      showMergeDialog,
      showSplitDialog,
      initialFile,
      colorPage,
      validPages,
      toast,
      showToast,
      hideToast,
      clickFileInput,
      handleFileUpload,
      clickAppendFileInput,
      handleAppendFile,
      selectTool,
      handlePageClick,
      updateSelectionCount,
      toggleSelectAll,
      applyToSelected,
      rotatePage,
      duplicatePage,
      addBlankPage,
      deletePage,
      reversePages,
      setPageCanvas,
      previewPage,
      closePreview,
      nextPreviewPage,
      prevPreviewPage,
      handleZoomMove,
      toggleZoom,
      handlePreviewAction,
      handleDragStart,
      handleDragOver,
      handleDragEnd,
      handlePageDrop,
      scrollToEditor,
      openMergeDialog,
      closeMergeDialog,
      handleMerge,
      openSplitDialog,
      closeSplitDialog,
      handleSplit,
      downloadFile,
      exportSelected,
      handleExport,
      sendToPDFEditor,
    };
  },
  components: {
    SplitDialog,
    MergeDialog,
  },
};
</script>

<style scoped>
@reference "../css/tailwind.css";
.pdf-organizer {
  @apply bg-transparent;

  .organize-body {
    @apply flex relative w-full p-4 pt-0;
    height: calc(100vh - 60px);
  }

  .pages-grid {
    @apply grid gap-5 w-full;
  }

  .page-card-wrapper {
    @apply relative flex items-center;
  }

  .page-card {
    @apply relative bg-white border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 flex-1;

    &:hover {
      @apply shadow-md;

      .page-hover-actions {
        @apply opacity-100 pointer-events-auto;
      }
    }

    &.selected {
      @apply shadow-lg ring-4;
    }

    .page-thumbnail {
      @apply relative mb-4 bg-gray-50 rounded overflow-hidden flex items-center justify-center aspect-[1/1.414];

      .page-canvas {
        @apply max-w-full max-h-full object-contain;
      }

      .page-number-badge {
        @apply absolute top-2 right-2 text-white px-2 py-1 rounded text-sm font-semibold;
      }
    }

    .current-number {
      @apply absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-700 rounded text-xs font-semibold;
    }

    .page-hover-actions {
      @apply absolute -top-4 right-1 flex opacity-0 pointer-events-none transition-opacity duration-200 ease-in z-10;

      .page-action-btn {
        @apply bg-white text-gray-700 border border-gray-300 rounded-sm w-7 h-7 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm;

        &:hover {
          @apply bg-gray-100 border-gray-400 shadow-md;
        }

        &:active {
          @apply scale-95;
        }

        i {
          @apply text-sm;
        }
      }
    }
  }

  .add-blank-page-btn {
    @apply text-white rounded-full w-7 h-7 ml-4 flex items-center justify-center cursor-pointer transition-all shadow-md opacity-0 pointer-events-none scale-100;
  }

  .add-blank-page-btn i {
    @apply text-base;
  }

  .page-card-wrapper:hover .add-blank-page-btn {
    @apply opacity-100 pointer-events-auto;
  }

  .page-card-wrapper .add-blank-page-btn:hover {
    @apply shadow-lg scale-110;
  }

  .page-card-wrapper .add-blank-page-btn:active {
    @apply scale-95;
  }
}

.preview-modal-overlay {
  @apply fixed inset-0 z-10002 flex items-center justify-center bg-black/85 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out];

  .preview-close-btn {
    @apply absolute top-4 right-6 text-white text-4xl cursor-pointer hover:text-gray-300 transition-colors z-10002 bg-transparent border-none;
  }

  .preview-content {
    @apply flex items-center justify-center w-full h-full p-4 relative;

    .preview-canvas-wrapper {
      @apply relative shadow-2xl max-h-[95vh] max-w-[95vw] rounded-sm overflow-hidden flex flex-col items-center;

      .preview-image-container {
        @apply relative;
      }

      .preview-canvas {
        @apply block object-contain max-h-[85vh] w-auto;
      }
    }
  }

  .zoom-lens {
    @apply absolute border-2 border-white cursor-none z-10 shadow-[0_0_0_2px_rgba(0,0,0,0.3)] pointer-events-none;
  }

  .zoom-result {
    @apply fixed border-2 border-white w-[200px] h-[200px] z-100 rounded shadow-2xl pointer-events-none;
  }

  .preview-controls {
    @apply bg-white px-4 py-2 mt-2 text-center text-sm font-medium flex items-center justify-center gap-2 rounded-xs;

    .preview-control-btn {
      @apply bg-transparent text-black w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all border-none hover:bg-gray-100;

      &:disabled {
        @apply opacity-30 cursor-not-allowed hover:bg-transparent;
      }
      &.active {
        @apply bg-gray-200 hover:bg-gray-300;
      }
    }

    .preview-divider {
      @apply w-px h-6 bg-gray-300 mx-1;
    }
    .preview-page-info {
      @apply text-sm font-medium min-w-[60px] text-center;
    }
  }
}

/* Specific cursor for tool */
.organize-body[data-tool="delete"] .page-card {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'/%3E%3C/svg%3E")
      16 16,
    auto;
}

.organize-body[data-tool="rotate"] .page-card {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z'/%3E%3C/svg%3E")
      16 16,
    auto;
}

.organize-body[data-tool="duplicate"] .page-card {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z'/%3E%3C/svg%3E")
      16 16,
    auto;
}

.organize-body[data-tool="swap"] .page-card {
  cursor:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%236366f1' d='M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V10h-2v7.01h-3L15 21l4-3.99h-3z'/%3E%3C/svg%3E")
      16 16,
    auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .pages-grid {
    @apply grid-cols-[repeat(auto-fill,minmax(150px,1fr))]! gap-3;
  }

  .organize-body {
    @apply p-2;
  }
}
</style>
