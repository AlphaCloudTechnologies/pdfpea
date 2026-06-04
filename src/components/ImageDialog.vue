<template>
  <BaseDialog :show="show" title="Add Image" @close="closeDialog">
    <template #tabs>
      <div class="flex gap-1 mb-5 border-b border-[#e0e0e0]">
        <button
          :class="{ active: activeTab === 'upload' }"
          @click="activeTab = 'upload'"
          class="tab-btn"
        >
          Upload File
        </button>
        <button :class="{ active: activeTab === 'url' }" @click="activeTab = 'url'" class="tab-btn">
          From URL
        </button>
      </div>
    </template>

    <div v-if="activeTab === 'upload'" class="image-upload-section">
      <div
        class="upload-area"
        @click="triggerFileInput"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <input
          type="file"
          ref="fileInput"
          accept="image/*"
          @change="handleFileUpload"
          style="display: none"
        />
        <i class="fa-solid fa-cloud-upload-alt upload-icon"></i>
        <p>Click to upload or drag and drop an image</p>
        <p class="upload-hint">Supports: JPG, PNG, GIF, WebP</p>
      </div>
    </div>

    <div v-if="activeTab === 'url'" class="image-url-section">
      <label for="imageUrl">Image URL:</label>
      <input
        id="imageUrl"
        type="url"
        v-model="imageUrl"
        placeholder="https://example.com/image.jpg"
        class="url-input"
        @keyup.enter="loadFromUrl"
      />
      <button @click="loadFromUrl" class="load-url-btn" :disabled="!imageUrl">Load Image</button>
    </div>

    <div v-if="preview" class="image-preview-section">
      <h4>Preview:</h4>
      <img :src="preview" alt="Preview" class="image-preview" />
    </div>

    <div v-if="error" class="image-error">
      <p>{{ error }}</p>
    </div>

    <template #footer>
      <button @click="closeDialog" class="btn-secondary">Cancel</button>
      <button @click="confirmSelection" :disabled="!preview" class="btn-primary">Add Image</button>
    </template>
  </BaseDialog>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";

export default {
  name: "ImageDialog",
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
    const activeTab = ref("upload");
    const imageUrl = ref("");
    const preview = ref("");
    const error = ref("");
    const fileInput = ref(null);

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
      activeTab.value = "upload";
      imageUrl.value = "";
      preview.value = "";
      error.value = "";
    };

    const closeDialog = () => {
      emit("close");
    };

    const triggerFileInput = () => {
      fileInput.value?.click();
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        processFile(file);
      }
    };

    const handleDrop = (event) => {
      const files = event.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          processFile(file);
        } else {
          error.value = "Please select a valid image file.";
        }
      }
    };

    const processFile = (file) => {
      error.value = "";

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error.value = "File size must be less than 5MB.";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        preview.value = e.target.result;
      };
      reader.onerror = () => {
        error.value = "Error reading file.";
      };
      reader.readAsDataURL(file);
    };

    const loadFromUrl = async () => {
      if (!imageUrl.value) return;

      error.value = "";

      try {
        // Create a temporary image to test if URL is valid
        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl.value;
        });

        // Convert image to base64
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        preview.value = canvas.toDataURL("image/png");
      } catch (error) {
        error.value = "Failed to load image from URL. Please check the URL and try again.";
      }
    };

    const confirmSelection = () => {
      if (!preview.value) return;

      emit("confirm", preview.value);
      closeDialog();
    };

    return {
      activeTab,
      imageUrl,
      preview,
      error,
      fileInput,
      closeDialog,
      triggerFileInput,
      handleFileUpload,
      handleDrop,
      loadFromUrl,
      confirmSelection,
    };
  },
};
</script>

<style>
.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;

  &:hover {
    border-color: #007acc;
    background: #f0f8ff;
  }

  p {
    margin: 8px 0;
    color: #666;
  }
}
</style>
