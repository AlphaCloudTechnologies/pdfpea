// Default values and constants
export const DEFAULT_VALUES = {
  SCALE: 2.0,
  COMPONENT_HEIGHT: 100,
  COMPONENT_WIDTH: 100,
  TEXT_HEIGHT: 25,
  TEXT_WIDTH: 100,
  TEXT_FIELD_HEIGHT: 25,
  TEXT_FIELD_WIDTH: 150,
  CHECKBOX_SIZE: 25,
  FONT_SIZE: 14,
  TEXT_FIELD_FONT_SIZE: 14,
  LINE_HEIGHT: 1,
  OPACITY: 1.0,
  BORDER_WIDTH: 2,
  TEXT_FIELD_BORDER_WIDTH: 1,
  X_PADDING: 2,
  Y_PADDING: 5,
};

// Colors
export const COLORS = {
  WHITE: "#FFFFFF",
  RED: "#FF0000",
  BLACK: "#000000",
  LIGHT_BLUE: "#ADD8E6",
};

// Font families
export const FONTS = {
  HELVETICA: "Helvetica",
  COURIER: "Courier",
  TIMES_ROMAN: "TimesRoman",
};

// Field types
export const FIELD_TYPES = {
  TEXT_FIELD: "Tx",
  BUTTON: "Btn",
};

// Alignment options
export const ALIGNMENT = {
  LEFT: "Left",
  CENTER: "Center",
  RIGHT: "Right",
};

// Operation types
export const OPERATION_TYPES = {
  CREATE: "create",
  UPDATE: "update",
};

// Component types
export const COMPONENT_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  TEXT_FIELD: "textfield",
  CHECKBOX: "checkbox",
  LINK: "link",
  NOTE: "note",
  WATERMARK: "watermark",
};

// Events
export const EVENTS = {
  COMPONENT_SELECTED: "pdfeditor.componentSelected",
  COMPONENT_DRAGGING: "pdfeditor.componentDragging",
  COMPONENT_RESIZING: "pdfeditor.componentResizing",
  SHOULD_CLEAR_ALL_SELECTION: "pdfeditor.shouldClearAllSelection",
};

// Image paths
export const IMAGE_PATHS = {
  DEFAULT_IMAGE: "/images/default_image.jpg",
  CHECKBOX_CHECKED: "/images/checkbox-checked.png",
  CHECKBOX_UNCHECKED: "/images/checkbox-unchecked.png",
  SVG_TICK: "/images/tick.svg",
  SVG_CROSS: "/images/cross.svg",
};

// Image file signatures
export const IMAGE_SIGNATURES = {
  JPG: [0xff, 0xd8],
  PNG: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

// Watermark constants
export const WATERMARK = {
  DEFAULT_SIZE: 126,
  DEFAULT_OPACITY: 50,
  DEFAULT_COLOR: "#1E1E1E",
  DEFAULT_ORIENTATION: "horizontal",
  DEFAULT_POSITION: "center",

  ORIENTATIONS: {
    HORIZONTAL: "horizontal",
    DIAGONAL: "diagonal",
    VERTICAL: "vertical",
  },

  POSITIONS: {
    TOP_LEFT: "top-left",
    TOP_CENTER: "top-center",
    TOP_RIGHT: "top-right",
    MIDDLE_LEFT: "middle-left",
    CENTER: "center",
    MIDDLE_RIGHT: "middle-right",
    BOTTOM_LEFT: "bottom-left",
    BOTTOM_CENTER: "bottom-center",
    BOTTOM_RIGHT: "bottom-right",
  },
};
