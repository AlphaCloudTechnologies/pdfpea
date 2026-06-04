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
        <h3>
          <slot name="title">{{ title }}</slot>
        </h3>
        <button @click="closeDialog" class="dialog-close-btn">&times;</button>
      </div>

      <div class="dialog-content">
        <slot name="tabs"></slot>
        <slot></slot>
      </div>

      <div v-if="$slots.footer" class="dialog-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: "BaseDialog",
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "",
    },
    closeOnOverlayClick: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["close"],
  methods: {
    closeDialog() {
      this.$emit("close");
    },
    handleOverlayClick() {
      if (this.closeOnOverlayClick) {
        this.closeDialog();
      }
    },
  },
};
</script>

<style scoped>
@reference "../css/tailwind.css";
.dialog-overlay {
  @apply fixed inset-0 bg-black/50 flex justify-center items-center z-[10000];
}

.dialog-container {
  @apply bg-white rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] w-[90%] max-w-[500px] max-h-[80vh] overflow-hidden flex flex-col;
}

.dialog-header {
  @apply flex justify-between items-center p-5 border-b border-[#e0e0e0] bg-[#f8f9fa];

  h3 {
    @apply m-0 text-[#333] text-[18px] font-semibold;
  }
}

.dialog-content {
  @apply flex-1 p-5 overflow-y-auto;
}

.dialog-body {
  @apply p-6 flex-1 overflow-y-auto;
}

.dialog-footer {
  @apply flex justify-end gap-3 p-5 border-t border-[#e0e0e0] bg-[#f8f9fa];
}

.dialog-close-btn {
  @apply bg-transparent border-none text-2xl text-gray-600 cursor-pointer p-0 w-[30px] h-[30px] flex items-center justify-center rounded transition-colors duration-200 hover:bg-gray-200;
}
</style>
