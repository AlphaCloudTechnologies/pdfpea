<template>
  <div v-if="show">
    <BaseDialog :show="show" title="Add watermark" @close="closeDialog">
      <div class="watermark-content">
        <div class="form-group">
          <label class="form-label">Text</label>
          <div class="input-wrapper">
            <textarea
              v-model="watermarkData.text"
              class="form-input"
              placeholder="Enter watermark text"
              rows="3"
            ></textarea>
            <button
              v-if="watermarkData.text"
              @click="watermarkData.text = ''"
              class="clear-btn"
              style="top: 10px; transform: none"
            >
              ×
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Apply to</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="watermarkData.applyTo" type="radio" value="all" class="radio-input" />
              <span class="radio-text">All</span>
            </label>
            <label class="radio-label">
              <input
                v-model="watermarkData.applyTo"
                type="radio"
                value="range"
                class="radio-input"
              />
              <span class="radio-text">Page Range</span>
            </label>
          </div>
          <input
            v-if="watermarkData.applyTo === 'range'"
            v-model="watermarkData.pageRange"
            type="text"
            class="form-input mt-2"
            placeholder="e.g., 1-3, 5, 7-9"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Font Style & Alignment</label>
          <div class="font-style-buttons">
            <button
              :class="['font-style-btn', { active: watermarkData.bold }]"
              @click="watermarkData.bold = !watermarkData.bold"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              :class="['font-style-btn', { active: watermarkData.italic }]"
              @click="watermarkData.italic = !watermarkData.italic"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              :class="['font-style-btn', { active: watermarkData.underline }]"
              @click="watermarkData.underline = !watermarkData.underline"
              title="Underline"
            >
              <u>U</u>
            </button>

            <div class="w-px h-12 bg-gray-300 mx-1"></div>

            <label class="font-style-btn color-picker-btn" title="Color Picker">
              <i class="fa-solid fa-fill" :style="{ color: watermarkData.color }"></i>
              <input v-model="watermarkData.color" type="color" class="color-input-hidden" />
            </label>

            <div class="w-px h-12 bg-gray-300 mx-1"></div>

            <button
              v-for="align in ['left', 'center', 'right']"
              :key="align"
              :class="['font-style-btn', { active: watermarkData.alignment === align }]"
              @click="watermarkData.alignment = align"
              :title="'Align ' + align"
            >
              <i :class="`fa-solid fa-align-${align}`"></i>
            </button>
          </div>
        </div>

        <div class="form-group">
          <div class="dual-select-row">
            <div class="select-wrapper">
              <label class="form-label">Font</label>
              <select v-model="watermarkData.fontFamily" class="form-select">
                <option v-for="font in fontOptions" :key="font.value" :value="font.value">
                  {{ font.label }}
                </option>
              </select>
            </div>
            <div class="select-wrapper">
              <label class="form-label">Rotation</label>
              <select v-model="watermarkData.rotation" class="form-select">
                <option v-for="rot in rotationOptions" :key="rot.value" :value="rot.value">
                  {{ rot.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <div
          class="form-group"
          v-for="(setting, key) in {
            size: { min: 8, max: 200, unit: 'pt' },
            opacity: { min: 0, max: 100, unit: '%' },
          }"
          :key="key"
        >
          <label class="form-label capitalized">{{ key }}</label>
          <div class="slider-group">
            <input
              v-model.number="watermarkData[key]"
              type="range"
              :min="setting.min"
              :max="setting.max"
              class="slider"
            />
            <input
              v-model.number="watermarkData[key]"
              type="number"
              :min="setting.min"
              :max="setting.max"
              class="value-input"
            />
            <span class="unit">{{ setting.unit }}</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Position</label>
          <div class="position-grid-container">
            <div class="position-grid">
              <button
                v-for="pos in positions"
                :key="pos.value"
                :class="['position-cell', { active: watermarkData.position === pos.value }]"
                @click="watermarkData.position = pos.value"
                :title="pos.label"
              >
                <div class="position-dot"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <button v-if="editData" @click="deleteWatermark" class="btn-danger mr-auto">Delete</button>
        <button @click="closeDialog" class="btn-secondary">Cancel</button>
        <button @click="confirmWatermark" class="btn-primary">
          {{ editData ? "Update" : "Add" }} Watermark
        </button>
      </template>
    </BaseDialog>

    <div v-if="previewImage" class="preview-pane-wrapper">
      <div class="preview-container" :style="previewContainerStyle">
        <img :src="previewImage" alt="Page Preview" class="preview-image" />
        <div class="watermark-overlay" v-if="watermarkData.text">
          <div class="watermark-text-instance" :style="[watermarkStyles, watermarkPositionStyle]">
            {{ watermarkData.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import BaseDialog from "./BaseDialog.vue";

const CONSTANTS = {
  FONTS: [
    { value: "Helvetica", label: "Helvetica" },
    { value: "Helvetica-Bold", label: "Helvetica Bold" },
    { value: "Times-Roman", label: "Times Roman" },
    { value: "Times-Bold", label: "Times Bold" },
    { value: "Courier", label: "Courier" },
    { value: "Courier-Bold", label: "Courier Bold" },
  ],
  ROTATIONS: [
    { value: 0, label: "Do not rotate" },
    { value: 45, label: "45 degrees" },
    { value: 90, label: "90 degrees" },
    { value: 315, label: "135 degrees" },
    { value: 180, label: "180 degrees" },
    { value: 270, label: "270 degrees" },
  ],
  POSITIONS: [
    { value: "top-left", label: "Top Left" },
    { value: "top-center", label: "Top Center" },
    { value: "top-right", label: "Top Right" },
    { value: "middle-left", label: "Middle Left" },
    { value: "center", label: "Center" },
    { value: "middle-right", label: "Middle Right" },
    { value: "bottom-left", label: "Bottom Left" },
    { value: "bottom-center", label: "Bottom Center" },
    { value: "bottom-right", label: "Bottom Right" },
  ],
  DEFAULT_DATA: {
    text: "",
    fontFamily: "Helvetica",
    rotation: 0,
    size: 70,
    opacity: 50,
    color: "#1E1E1E",
    bold: false,
    italic: false,
    underline: false,
    alignment: "center",
    position: "center",
    applyTo: "all",
    pageRange: "",
  },
};

export default {
  name: "WatermarkDialog",
  components: { BaseDialog },
  props: {
    show: Boolean,
    previewImage: String,
    pageWidth: Number,
    pageHeight: Number,
    editData: Object,
  },
  emits: ["close", "confirm", "delete"],
  data() {
    return {
      watermarkData: { ...CONSTANTS.DEFAULT_DATA },
      fontOptions: CONSTANTS.FONTS,
      rotationOptions: CONSTANTS.ROTATIONS,
      positions: CONSTANTS.POSITIONS,
    };
  },
  computed: {
    previewScale() {
      if (!this.pageWidth || !this.pageHeight) return 0.3;
      const scaleX = 350 / this.pageWidth;
      const scaleY = window.innerHeight / this.pageHeight;
      return Math.min(scaleX, scaleY, 1);
    },
    previewContainerStyle() {
      return {
        width: `${this.pageWidth * this.previewScale}px`,
        height: `${this.pageHeight * this.previewScale}px`,
      };
    },
    watermarkStyles() {
      return {
        fontSize: `${this.watermarkData.size * this.previewScale - 10}pt`,
        color: this.watermarkData.color,
        opacity: this.watermarkData.opacity / 100,
        fontFamily: this.watermarkData.fontFamily,
        fontWeight: this.watermarkData.bold ? "bold" : "normal",
        fontStyle: this.watermarkData.italic ? "italic" : "normal",
        textDecoration: this.watermarkData.underline ? "underline" : "none",
        whiteSpace: "pre",
        textAlign: this.watermarkData.alignment,
      };
    },
    watermarkPositionStyle() {
      const pos = this.watermarkData.position || "center";
      const style = { transform: `rotate(${this.watermarkData.rotation}deg)` };
      const [v, h] = pos.includes("-")
        ? pos.split("-")
        : pos === "center"
          ? ["middle", "center"]
          : ["middle", "center"];

      // Vertical
      if (v === "top") style.top = "0";
      else if (v === "bottom") style.bottom = "0";
      else {
        style.top = "50%";
        style.transform = `translateY(-50%) ${style.transform}`;
      } // middle/center

      // Horizontal
      if (h === "left") style.left = "0";
      else if (h === "right") style.right = "0";
      else {
        // center/middle
        style.left = "50%";
        // Combine transforms carefully
        if (style.transform.includes("translateY"))
          style.transform = `translate(-50%, -50%) rotate(${this.watermarkData.rotation}deg)`;
        else style.transform = `translateX(-50%) ${style.transform}`;
      }
      return style;
    },
  },
  watch: {
    show(val) {
      if (val)
        this.watermarkData = this.editData
          ? { ...CONSTANTS.DEFAULT_DATA, ...this.editData }
          : { ...CONSTANTS.DEFAULT_DATA };
    },
  },
  methods: {
    closeDialog() {
      this.$emit("close");
    },
    deleteWatermark() {
      if (confirm("Are you sure?")) this.$emit("delete");
    },
    confirmWatermark() {
      if (!this.watermarkData.text.trim()) return alert("Please enter watermark text");

      let pages = "all";
      if (this.watermarkData.applyTo === "range") {
        pages = this.parsePageRange(this.watermarkData.pageRange);
        if (!pages.length) return alert("Please enter a valid page range");
      }
      this.$emit("confirm", { ...this.watermarkData, pages });
      this.watermarkData = { ...CONSTANTS.DEFAULT_DATA };
    },
    parsePageRange(rangeStr) {
      const pages = new Set();
      if (!rangeStr || typeof rangeStr !== "string") {
        return [];
      }
      rangeStr.split(",").forEach((part) => {
        const trimmed = part.trim();
        if (!trimmed) return;
        if (trimmed.includes("-")) {
          const [rawStart, rawEnd] = trimmed.split("-");
          const start = parseInt(rawStart.trim(), 10);
          const end = parseInt(rawEnd.trim(), 10);
          if (Number.isNaN(start) || Number.isNaN(end)) {
            return;
          }
          const min = Math.min(start, end);
          const max = Math.max(start, end);
          const rangeStart = Math.max(1, min);
          const rangeEnd = this.totalPages ? Math.min(this.totalPages, max) : max;
          if (rangeStart > rangeEnd) {
            return;
          }
          for (let i = rangeStart; i <= rangeEnd; i++) {
            pages.add(i);
          }
        } else {
          const page = parseInt(trimmed, 10);
          if (Number.isNaN(page)) return;
          if (page < 1) return;
          if (this.totalPages && page > this.totalPages) return;
          pages.add(page);
        }
      });
      return Array.from(pages).sort((a, b) => a - b);
    },
  },
};
</script>

<style scoped>
@reference "../css/tailwind.css";

.preview-pane-wrapper {
  @apply fixed top-1/2 right-32 -translate-y-1/2 z-10001 bg-none flex flex-col max-xl:hidden;
}

.preview-container {
  @apply relative m-4 overflow-hidden bg-gray-100 self-center;
}

.preview-image {
  @apply absolute top-0 left-0 w-full h-full;
}

.watermark-overlay {
  @apply absolute inset-0 pointer-events-none;
}

.watermark-text-instance {
  @apply absolute;
}

.watermark-content {
  @apply space-y-5;
}

.form-group {
  @apply flex flex-col gap-2;
}

.form-label {
  @apply text-sm font-medium text-gray-700;

  &.capitalized {
    @apply capitalize;
  }
}

.input-wrapper {
  @apply relative;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.clear-btn {
  @apply absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl leading-none;
}

.slider-group {
  @apply flex items-center gap-3;

  .slider {
    @apply flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer;

    &::-webkit-slider-thumb {
      @apply appearance-none w-5 h-5 bg-blue-500 rounded-full cursor-pointer;
    }

    &::-moz-range-thumb {
      @apply w-5 h-5 bg-blue-500 rounded-full cursor-pointer border-0;
    }
  }
}

.value-input {
  @apply w-16 px-2 py-1 border border-gray-300 rounded text-center;
}

.unit {
  @apply text-sm text-gray-600 w-6;
}

.radio-group {
  @apply flex gap-4;
}

.radio-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.radio-input {
  @apply w-5 h-5 text-blue-500 focus:ring-2 focus:ring-blue-500;
}

.radio-text {
  @apply text-sm text-gray-700;
}

.font-style-buttons {
  @apply flex gap-2;
}

.font-style-btn {
  @apply w-12 h-12 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all text-lg font-bold;

  &.active {
    @apply border-blue-500 bg-blue-50 text-blue-600;
  }
}

.color-picker-btn {
  @apply cursor-pointer relative;

  i {
    @apply text-xl transition-colors;
  }
}

.color-input-hidden {
  @apply absolute inset-0 w-full h-full opacity-0 cursor-pointer;
}

.dual-select-row {
  @apply flex gap-4;
}

.select-wrapper {
  @apply flex-1 flex flex-col gap-2;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer;
}

.position-grid-container {
  @apply flex items-center gap-4;
}

.position-grid {
  @apply grid grid-cols-3 w-[120px] h-[120px] gap-1 p-2 border-2 border-gray-300 rounded-lg bg-gray-50;
}

.position-cell {
  @apply flex items-center justify-center border border-gray-300 rounded bg-white hover:bg-blue-50 transition-colors cursor-pointer;

  &.active {
    @apply bg-blue-500 border-blue-600;

    .position-dot {
      @apply bg-white;
    }
  }

  .position-dot {
    @apply w-3 h-3 rounded-full bg-blue-500;
  }
}
</style>
