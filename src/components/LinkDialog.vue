<template>
  <BaseDialog :show="show" title="Add Link" @close="closeDialog">
    <template #tabs>
      <div class="flex gap-1 mb-5 border-b border-[#e0e0e0]">
        <button :class="{ active: activeTab === 'url' }" @click="activeTab = 'url'" class="tab-btn">
          External URL
        </button>
        <button
          :class="{ active: activeTab === 'page' }"
          @click="activeTab = 'page'"
          class="tab-btn"
        >
          Page Link
        </button>
      </div>
    </template>

    <div v-if="activeTab === 'url'" class="link-url-section">
      <label for="linkUrl">URL:</label>
      <input
        id="linkUrl"
        type="url"
        v-model="linkUrl"
        placeholder="https://example.com"
        class="url-input"
        @keyup.enter="confirmSelection"
      />
    </div>

    <div v-if="activeTab === 'page'" class="link-page-section">
      <label for="pageNumber">Page Number:</label>
      <input
        id="pageNumber"
        type="number"
        v-model="pageNumber"
        placeholder="1"
        min="1"
        class="page-input"
        @keyup.enter="confirmSelection"
      />
    </div>

    <div v-if="error" class="link-error">
      <p>{{ error }}</p>
    </div>

    <template #footer>
      <button @click="closeDialog" class="btn-secondary">Cancel</button>
      <button @click="confirmSelection" :disabled="!isValid" class="btn-primary">Add Link</button>
    </template>
  </BaseDialog>
</template>

<script lang="ts">
import { ref, watch, computed } from "vue";
import BaseDialog from "./BaseDialog.vue";

export default {
  name: "LinkDialog",
  components: {
    BaseDialog,
  },
  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["close", "confirm"],
  setup(props, { emit }) {
    const activeTab = ref("url");
    const linkUrl = ref("");
    const pageNumber = ref("");
    const error = ref("");

    // Reset state when dialog is opened
    watch(
      () => props.show,
      (newValue) => {
        if (newValue) {
          resetState();
        }
      },
    );

    const resetState = () => {
      activeTab.value = "url";
      linkUrl.value = "";
      pageNumber.value = "";
      error.value = "";
    };

    const isValid = computed(() => {
      if (activeTab.value === "url") {
        return linkUrl.value.trim() !== "";
      } else {
        const num = parseInt(pageNumber.value);
        return !isNaN(num) && num > 0;
      }
    });

    const closeDialog = () => {
      emit("close");
    };

    const confirmSelection = () => {
      if (!isValid.value) return;

      error.value = "";

      try {
        if (activeTab.value === "url") {
          // Validate URL format
          if (!linkUrl.value.startsWith("http://") && !linkUrl.value.startsWith("https://")) {
            error.value = "URL must start with http:// or https://";
            return;
          }
          console.log(`confirmSelection`);
          emit("confirm", {
            type: "url",
            value: linkUrl.value.trim(),
          });
        } else {
          const num = parseInt(pageNumber.value);
          if (isNaN(num) || num < 1) {
            error.value = "Please enter a valid page number (1 or greater)";
            return;
          }

          emit("confirm", {
            type: "page",
            value: num,
          });
        }

        closeDialog();
      } catch (error) {
        error.value = "Invalid input. Please check your values.";
      }
    };

    return {
      activeTab,
      linkUrl,
      pageNumber,
      error,
      isValid,
      closeDialog,
      confirmSelection,
    };
  },
};
</script>
