<template>
  <BaseDialog :show="show" @close="closeDialog">
    <template #title>
      <div class="dialog-title">
        <i class="fa-solid fa-scissors"></i>
        Split PDF
      </div>
    </template>

    <div class="info-box">
      <i class="fa-solid fa-info-circle"></i>
      <span>Total pages: {{ totalPages }}</span>
    </div>

    <div class="split-mode-section">
      <label class="input-label">
        <i class="fa-solid fa-scissors"></i>
        Split mode:
      </label>
      <select v-model="splitMode" class="form-select">
        <option value="range">Extract page range</option>
        <option value="at-page">Split at page</option>
        <option value="every">Split every N pages</option>
        <option value="custom">Custom ranges</option>
      </select>
      <p class="mode-description">{{ modeDescription }}</p>
    </div>

    <!-- Split at page input -->
    <div v-if="splitMode === 'at-page'" class="input-section">
      <label class="input-label">Split after page:</label>
      <input
        type="number"
        v-model.number="splitAtPage"
        :min="1"
        :max="totalPages - 1"
        class="input-field"
        placeholder="Enter page number"
      />
      <p class="input-hint">
        This will create two PDFs: pages 1-{{ splitAtPage }} and pages {{ splitAtPage + 1 }}-{{
          totalPages
        }}
      </p>
    </div>

    <!-- Range input -->
    <div v-if="splitMode === 'range'" class="input-section">
      <div class="range-inputs">
        <div class="input-group">
          <label class="input-label">From page:</label>
          <input
            type="number"
            v-model.number="rangeFrom"
            :min="1"
            :max="totalPages"
            class="input-field"
          />
        </div>
        <div class="input-group">
          <label class="input-label">To page:</label>
          <input
            type="number"
            v-model.number="rangeTo"
            :min="rangeFrom"
            :max="totalPages"
            class="input-field"
          />
        </div>
      </div>
      <p class="input-hint">
        Extract pages {{ rangeFrom }} to {{ rangeTo }} ({{ rangeTo - rangeFrom + 1 }} pages)
      </p>
    </div>

    <!-- Every N pages input -->
    <div v-if="splitMode === 'every'" class="input-section">
      <label class="input-label">Pages per split:</label>
      <input
        type="number"
        v-model.number="everyNPages"
        :min="1"
        :max="totalPages"
        class="input-field"
        placeholder="Enter number of pages"
      />
      <p class="input-hint">This will create {{ Math.ceil(totalPages / everyNPages) }} PDF files</p>
    </div>

    <!-- Custom ranges input -->
    <div v-if="splitMode === 'custom'" class="input-section">
      <div class="merge-checkbox-container">
        <input type="checkbox" id="mergeRanges" v-model="mergeRanges" class="merge-checkbox" />
        <label for="mergeRanges" class="merge-checkbox-label">Merge all ranges into one file</label>
      </div>
      <div class="mb-4">
        <div v-for="(range, index) in customRanges" :key="index" class="custom-range-item">
          <div class="custom-range-header">
            <label class="input-label">Range {{ index + 1 }}:</label>
            <button
              @click="removeRange(index)"
              class="remove-range-btn"
              :disabled="customRanges.length === 1"
              title="Remove range"
            >
              <i class="fa-solid fa-trash-alt"></i>
            </button>
          </div>
          <div class="range-inputs">
            <div class="input-group">
              <label class="input-label">From page:</label>
              <input
                type="number"
                v-model.number="range.from"
                :min="1"
                :max="totalPages"
                class="input-field"
              />
            </div>
            <div class="input-group">
              <label class="input-label">To page:</label>
              <input
                type="number"
                v-model.number="range.to"
                :min="range.from"
                :max="totalPages"
                class="input-field"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button @click="addRange" class="btn-primary"><i class="fa-solid fa-plus"></i> Add</button>
      </div>
    </div>

    <template #footer>
      <button @click="closeDialog" class="btn-secondary">Cancel</button>
      <button @click="handleSplit" class="btn-primary" :disabled="!isValid">
        <i class="fa-solid fa-scissors"></i>
        Split PDF
      </button>
    </template>
  </BaseDialog>
</template>

<script lang="ts">
import BaseDialog from "./BaseDialog.vue";

export default {
  name: "SplitDialog",
  components: {
    BaseDialog,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    totalPages: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      splitMode: "range",
      splitAtPage: Math.floor(this.totalPages / 2),
      rangeFrom: 1,
      rangeTo: Math.min(2, this.totalPages),
      everyNPages: 1,
      customRanges: [{ from: 1, to: 1 }],
      mergeRanges: false,
    };
  },
  computed: {
    modeDescription() {
      const descriptions = {
        range: "Extract a specific range of pages",
        "at-page": "Split the PDF into two parts at a specific page",
        every: "Split the PDF into multiple files with equal page counts",
        custom: "Extract multiple specific page ranges",
      };
      return descriptions[this.splitMode] || "";
    },
    isValid() {
      if (this.splitMode === "at-page") {
        return this.splitAtPage >= 1 && this.splitAtPage < this.totalPages;
      } else if (this.splitMode === "range") {
        return (
          this.rangeFrom >= 1 && this.rangeTo <= this.totalPages && this.rangeFrom <= this.rangeTo
        );
      } else if (this.splitMode === "every") {
        return this.everyNPages >= 1 && this.everyNPages <= this.totalPages;
      } else if (this.splitMode === "custom") {
        return this.customRanges.every(
          (r) => r.from >= 1 && r.to <= this.totalPages && r.from <= r.to,
        );
      }
      return false;
    },
  },
  methods: {
    addRange() {
      this.customRanges.push({ from: 1, to: 1 });
    },
    removeRange(index) {
      if (this.customRanges.length > 1) {
        this.customRanges.splice(index, 1);
      }
    },
    closeDialog() {
      this.$emit("close");
    },
    handleSplit() {
      if (!this.isValid) return;

      const splitData = {
        mode: this.splitMode,
        splitAtPage: this.splitAtPage,
        rangeFrom: this.rangeFrom,
        rangeTo: this.rangeTo,
        everyNPages: this.everyNPages,
        customRanges: this.customRanges,
        mergeRanges: this.mergeRanges,
      };

      this.$emit("split", splitData);
      this.closeDialog();
    },
  },
  watch: {
    show(newVal) {
      if (newVal) {
        // Reset to defaults when dialog opens
        this.splitMode = "range";
        this.splitAtPage = Math.floor(this.totalPages / 2);
        this.rangeFrom = 1;
        this.rangeTo = Math.min(2, this.totalPages);
        this.everyNPages = 1;
        this.customRanges = [{ from: 1, to: 1 }];
        this.mergeRanges = false;
      }
    },
  },
};
</script>

<style scoped>
@reference "../css/tailwind.css";
/* Form Components */
.input-label {
  @apply flex items-center gap-2 font-semibold text-gray-700 mb-2 text-sm;

  i {
    @apply text-blue-500 text-base;
  }
}

.input-field {
  @apply w-full p-2.5 border border-gray-300 rounded text-sm mb-3;

  &:focus {
    @apply outline-none border-[#007acc] shadow-[0_0_0_2px_rgba(0,122,204,0.2)];
  }
}

.input-hint {
  @apply mt-2 text-sm text-gray-500 italic;
}

.form-select {
  @apply w-full py-3 px-4 pr-5 border border-gray-300 rounded text-[15px] font-semibold text-gray-800 cursor-pointer transition-all duration-200;

  &:focus {
    @apply outline-none border-[#007acc] shadow-[0_0_0_2px_rgba(0,122,204,0.2)];
  }
}

.info-box {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-2 text-blue-800 font-medium;

  i {
    @apply text-lg;
  }
}

.split-mode-section {
  @apply mb-6;
}

.mode-description {
  @apply mt-2 text-[13px] text-gray-500 leading-relaxed;
}

.range-inputs {
  @apply grid grid-cols-2 gap-2 mb-2;
}

.input-group {
  @apply flex flex-col;
}

.custom-range-item {
  @apply p-1;

  &:last-child {
    @apply mb-0;
  }

  &:first-child .custom-range-header {
    @apply border-t-0;
  }
}

.custom-range-header {
  @apply flex items-center justify-between mb-2 border-t border-gray-200 pb-1 pt-1;

  .input-label {
    @apply mb-0 font-bold text-base;
  }
}

.remove-range-btn {
  @apply text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded cursor-pointer hover:bg-red-50;

  &:disabled {
    @apply text-gray-300 cursor-not-allowed hover:bg-transparent;
  }

  i {
    @apply text-sm;
  }
}

.merge-checkbox-container {
  @apply flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200 mb-2;
}

.merge-checkbox {
  @apply w-4 h-4 cursor-pointer;
}

.merge-checkbox-label {
  @apply text-sm text-gray-700 font-medium cursor-pointer select-none;
}
</style>
