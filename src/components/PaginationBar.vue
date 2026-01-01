<template>
  <div class="pagination-bar">
    <button @click="handlePrevPage" :disabled="currentPage === 1" class="pagination-btn">
      &#60;
    </button>
    <input
      type="number"
      :min="1"
      :max="totalPages"
      :value="currentPage"
      @keyup.enter="handleGoToPage($event.target.value)"
      @change="handleGoToPage($event.target.value)"
      class="pagination-input"
    />
    <span class="pagination-separator">/</span>
    <span class="pagination-total">{{ totalPages }}</span>
    <button @click="handleNextPage" :disabled="currentPage === totalPages" class="pagination-btn">
      &#62;
    </button>
  </div>
</template>

<script lang="ts">
export default {
  name: "PaginationBar",
  props: {
    currentPage: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPages: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  emits: ["prev-page", "next-page", "go-to-page"],
  methods: {
    handlePrevPage() {
      this.$emit("prev-page");
    },
    handleNextPage() {
      this.$emit("next-page");
    },
    handleGoToPage(pageNum) {
      this.$emit("go-to-page", Number(pageNum));
    },
  },
};
</script>

<style scoped>
@reference "../css/tailwind.css";

/* Pagination Styles */
.pagination-bar {
  @apply flex items-center justify-center py-1 px-2 mb-1 mt-1 text-lg border border-gray-300 rounded-lg;
}
.pagination-btn {
  @apply bg-transparent text-black w-5 h-5 rounded flex items-center justify-center cursor-pointer transition-all border-none;
}

.pagination-btn:disabled {
  @apply opacity-30 cursor-not-allowed hover:bg-transparent;
}

.pagination-input {
  @apply text-base bg-white text-center w-7;

  &:focus {
    @apply outline-none;
  }
}

.pagination-separator {
  @apply text-base text-gray-500 mx-1;
}

.pagination-total {
  @apply text-base text-gray-700 min-w-7 text-center;
}

/* Hide spin buttons for number inputs */
.pagination-input::-webkit-inner-spin-button,
.pagination-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.pagination-input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
