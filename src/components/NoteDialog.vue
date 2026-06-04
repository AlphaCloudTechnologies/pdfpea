<template>
  <BaseDialog :show="show" title="Note Details" @close="close">
    <div class="note-form">
      <div class="form-group">
        <label for="noteAuthor">Author:</label>
        <input
          id="noteAuthor"
          v-model="localAuthor"
          type="text"
          class="form-input"
          placeholder="Enter author name..."
        />
      </div>

      <div class="form-group">
        <label for="noteContent">Content:</label>
        <textarea
          id="noteContent"
          v-model="localText"
          class="form-textarea"
          rows="5"
          placeholder="Enter note content..."
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button @click="close" class="btn-secondary">Cancel</button>
      <button @click="confirm" class="btn-primary">Save</button>
    </template>
  </BaseDialog>
</template>

<script lang="ts">
import { ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";

export default {
  name: "NoteDialog",
  components: {
    BaseDialog,
  },
  props: {
    show: Boolean,
    text: String,
    author: String,
  },
  emits: ["close", "confirm"],
  setup(props, { emit }) {
    const localText = ref("");
    const localAuthor = ref("");

    watch(
      () => props.show,
      (newVal) => {
        if (newVal) {
          localText.value = props.text || "";
          localAuthor.value = props.author || "User";
        }
      },
    );

    const close = () => {
      emit("close");
    };

    const confirm = () => {
      emit("confirm", {
        text: localText.value,
        author: localAuthor.value,
      });
    };

    return {
      localText,
      localAuthor,
      close,
      confirm,
    };
  },
};
</script>
<style scoped>
@reference "../css/tailwind.css";
.note-form {
  @apply flex flex-col gap-2;
}

.form-group {
  @apply flex flex-col gap-2;
}

.form-group label {
  @apply text-sm font-medium text-gray-700;
}

.form-input,
.form-textarea {
  @apply w-full p-2 border border-gray-300 rounded outline-none transition-colors duration-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10;
  font-family: inherit;
}

.form-textarea {
  @apply min-h-[100px] resize-y;
}
</style>
