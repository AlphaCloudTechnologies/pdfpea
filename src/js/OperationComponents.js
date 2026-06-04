class BasicOperationComponent {
  operation = null;
  htmlNode = null;
  canvasContainer = null;
  wrapperContainer = null;

  renderDirections = ["n", "e", "s", "w", "nw", "ne", "sw", "se"];

  constructor(operation, canvasContainer) {
    this.canvasContainer = canvasContainer;
    this.operation = operation;

    this.wrapperContainer = document.createElement("div");
    this.wrapperContainer.classList.add("component");
    this.wrapperContainer.classList.add(`${this.operation.type}-component`);
    this.wrapperContainer.dataset.type = this.operation.type;
    this.wrapperContainer.style.left = `${this.operation.x}px`;
    this.wrapperContainer.style.top = `${this.operation.y}px`;
    this.wrapperContainer.style.height = `${this.operation.height}px`;
    this.wrapperContainer.style.width = `${this.operation.width}px`;

    this.wrapperContainer.operation = operation;
    this.wrapperContainer.component = this;

    this.canvasContainer.appendChild(this.wrapperContainer);

    this.wrapperContainer.addEventListener("click", (event) => {
      const pdfView = document.querySelector(".body-pdf-view");
      const isDrawingMode = pdfView && pdfView.classList.contains("drawing-mode");

      if (!isDrawingMode) {
        event.stopPropagation();
        this.setSelected(true);
      }
    });

    document.addEventListener("pdfeditor.shouldClearAllSelection", (e) => {
      if (e.detail.target != this) {
        this.setSelected(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Delete" &&
        this.wrapperContainer.classList.contains("selected") &&
        this.operation.operation === "create"
      ) {
        this.deleteComponent();
      }
    });
  }

  // Create the delete able for Moveable
  createDeleteAble = () => {
    const deleteAble = {
      name: "deleteViewable",
      props: [],
      events: [],
      render: (moveable, r) => {
        return r.createElement(
          "div",
          {
            key: "delete-viewer",
            className: "moveable-delete-container",
          },
          [
            r.createElement(
              "div",
              {
                className: "moveable-delete-button",
                title: "Delete component",
                onMouseDown: (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                },
                onClick: (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  this.deleteComponent();
                },
              },
              [
                r.createElement("i", {
                  className: "fa-solid fa-trash",
                }),
              ],
            ),
          ],
        );
      },
    };

    return deleteAble;
  };

  deleteComponent = () => {
    this.removeMoveable();
    this.wrapperContainer.remove();

    // Set a temporary flag to prevent immediate component creation
    window.preventComponentCreation = true;
    setTimeout(() => {
      window.preventComponentCreation = false;
    }, 200); // 200ms delay

    // Clear selection in property panel
    const clearEvent = new CustomEvent("pdfeditor.shouldClearAllSelection", {
      detail: { target: null },
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(clearEvent);
  };

  initializeOperation = () => {
    Object.keys(this.operation).forEach((key) => {
      if (this.operationChanged) this.operationChanged(key, this.operation[key]);
    });
  };

  makeMoveable = () => {
    const deleteAble = this.createDeleteAble();

    this.wrapperContainer.moveable = new Moveable(this.canvasContainer, {
      target: this.wrapperContainer,
      container: this.canvasContainer,
      draggable: true,
      resizable: true,
      origin: false,
      renderDirections: this.renderDirections,
      ables: [deleteAble],
      props: { deleteViewable: true },
    });

    this.wrapperContainer.moveable.on("drag", ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;

      this.operation.x = left;
      this.operation.y = top;

      this.fireEvent("pdfeditor.componentDragging");
    });

    this.wrapperContainer.moveable.on("resize", ({ target, width, height, direction, delta }) => {
      // Handle resizing based on direction
      // direction[0]: -1 (left), 0 (center), 1 (right)
      // direction[1]: -1 (top), 0 (center), 1 (bottom)

      let newLeft = parseInt(target.style.left);
      let newTop = parseInt(target.style.top);
      let newWidth = width;
      let newHeight = height;

      // Handle horizontal resizing (left edge movement)
      if (direction[0] === -1) {
        newLeft = parseInt(target.style.left) - delta[0];
        newWidth = parseInt(target.style.width) + delta[0];
      }

      // Handle vertical resizing (top edge movement)
      if (direction[1] === -1) {
        newTop = parseInt(target.style.top) - delta[1];
        newHeight = parseInt(target.style.height) + delta[1];
      }

      // Apply the changes
      target.style.left = `${newLeft}px`;
      target.style.top = `${newTop}px`;
      target.style.width = `${newWidth}px`;
      target.style.height = `${newHeight}px`;

      // Update operation
      this.operation.x = newLeft;
      this.operation.y = newTop;
      this.operation.width = newWidth;
      this.operation.height = newHeight;

      this.fireEvent("pdfeditor.componentResizing");
      this.wrapperContainer.moveable.updateRect();
    });

    this.wrapperContainer.moveable.updateRect();
  };

  removeMoveable = () => {
    if (this.wrapperContainer.moveable) {
      this.wrapperContainer.moveable.destroy();
      this.wrapperContainer.moveable = null;
    }
  };

  getOperation = () => {
    const handler = {
      set: (target, property, value) => {
        console.log(`Property ${property} set to ${value}`);

        target[property] = value;

        if (this.operationChanged) this.operationChanged(property, value);

        this.handleBasicOperation(property, value);

        return true;
      },
    };

    return new Proxy(this.operation, handler);
  };

  handleBasicOperation = (property, value) => {
    switch (property) {
      case "x":
        this.wrapperContainer.style.left = `${value}px`;
        break;
      case "y":
        this.wrapperContainer.style.top = `${value}px`;
        break;
      case "width":
        this.wrapperContainer.style.width = `${value}px`;
        break;
      case "height":
        this.wrapperContainer.style.height = `${value}px`;
        break;
    }

    if (this.wrapperContainer.moveable) {
      this.wrapperContainer.moveable.updateRect();
    }
  };

  setSelected = (selected) => {
    if (selected) {
      this.fireEvent("pdfeditor.shouldClearAllSelection");
      this.fireEvent("pdfeditor.componentSelected");

      this.wrapperContainer.classList.add("selected");

      if (!this.wrapperContainer.moveable) {
        this.makeMoveable();
      }
    } else {
      this.wrapperContainer.classList.remove("selected");
      this.removeMoveable();
    }
  };

  fireEvent = (eventName) => {
    const componentSelected = new CustomEvent(eventName, {
      detail: {
        target: this,
      },
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(componentSelected);
  };
}

class ImageOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    const url = "/images/default_image.jpg";

    this.shadow = document.createElement("img");
    this.shadow.classList.add("component-content");
    this.shadow.setAttribute("src", url);

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "imageHeight":
        this.shadow.style.height = `${value}%`;
      case "imageWidth":
        this.shadow.style.width = `${value}%`;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "objectFit":
        this.shadow.style.objectFit = value;
        break;
      case "url":
        this.shadow.setAttribute("src", value);
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 100,
    height = 100,
    url = "/images/default_image.jpg",
    imageHeight = 100,
    imageWidth = 100,
    subType = null,
  ) => {
    return {
      type: "image",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      height: height,
      width: width,
      imageHeight: imageHeight,
      imageWidth: imageWidth,
      opacity: 1.0,
      url: url,
      subType: subType,
    };
  };
}

class RectangleOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content");

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "borderWidth":
        this.shadow.style.borderWidth = value + "px";
        this.shadow.style.width = `100%`;
        this.shadow.style.height = `100%`;
        this.shadow.style.borderStyle = "solid";
        break;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "borderColor":
        this.shadow.style.borderColor = value;
        break;
      case "fill":
        this.shadow.style.background = value;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 100,
    height = 100,
    fill = "",
    borderColor = "#FF0000",
    borderWidth = 2,
    borderStyle = "solid",
    opacity = 1.0,
    subType = null,
  ) => {
    return {
      type: "rectangle",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      height: height,
      width: width,
      fill: fill,
      opacity: opacity,
      borderOpacity: 1.0,
      borderColor: borderColor,
      borderWidth: borderWidth,
      borderStyle: borderStyle,
      subType: subType,
    };
  };
}

class CircleOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content");

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "borderWidth":
        this.shadow.style.borderWidth = value + "px";
        this.shadow.style.width = `100%`;
        this.shadow.style.height = `100%`;
        this.shadow.style.borderStyle = "solid";
        break;
      case "borderRadius":
        this.shadow.style.borderRadius = `${value}%`;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "borderColor":
        this.shadow.style.borderColor = value;
        break;
      case "color":
        this.shadow.style.background = value;
        break;
      case "fill":
        this.shadow.style.background = value;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 100,
    height = 100,
    fill = "transparent",
    borderColor = "#FF0000",
    borderWidth = 2,
    opacity = 1.0,
  ) => {
    return {
      type: "circle",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      height: height,
      width: width,
      color: "#FFFFFF",
      fill: fill,
      opacity: opacity,
      borderOpacity: 1.0,
      borderColor: borderColor,
      borderWidth: borderWidth,
      borderStyle: "solid",
      borderRadius: 50,
    };
  };
}

class TextOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content");
    this.shadow.style.width = "auto";
    //this.shadow.style.height = 'auto';
    this.shadow.style.whiteSpace = "nowrap";
    //this.shadow.style.overflow = 'visible';
    this.shadow.style.display = "inline-block";
    this.shadow.style.paddingTop = "1px";
    this.shadow.contentEditable = false;

    this.wrapperContainer.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.shadow.contentEditable = true;
      this.shadow.focus();
    });

    this.shadow.addEventListener("blur", (event) => {
      event.stopPropagation();
      this.shadow.contentEditable = false;
      this.getOperation().text = this.shadow.innerText;
      this.updateSize();
      this.setSelected(true);
    });

    // Auto-resize while typing
    this.shadow.addEventListener("input", this.updateSize);

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();

    // Initial size update
    setTimeout(this.updateSize, 0);
  }

  updateSize = () => {
    // Create a temporary element to measure text size
    const temp = document.createElement("div");
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.whiteSpace = "nowrap";
    temp.style.font =
      this.shadow.style.font || `${this.operation.fontSize}px ${this.operation.fontFamily}`;
    temp.style.fontSize = this.shadow.style.fontSize;
    temp.style.fontFamily = this.shadow.style.fontFamily;
    temp.innerText = this.shadow.innerText || "sample text";

    document.body.appendChild(temp);
    const width = Math.max(temp.offsetWidth + 4, 20); // Add small padding
    const height = Math.max(temp.offsetHeight + 4, 20); // Add small padding
    document.body.removeChild(temp);

    // Update operation and wrapper size
    this.operation.width = width;
    this.operation.height = height;
    this.wrapperContainer.style.width = `${width}px`;
    this.wrapperContainer.style.height = `${height}px`;

    // Update moveable if it exists
    if (this.wrapperContainer.moveable) {
      this.wrapperContainer.moveable.updateRect();
    }
  };

  // Override makeMoveable to disable resizing for text components
  makeMoveable = () => {
    const deleteAble = this.createDeleteAble();

    this.wrapperContainer.moveable = new Moveable(this.canvasContainer, {
      target: this.wrapperContainer,
      container: this.canvasContainer,
      draggable: true,
      resizable: false, // Disable resizing for text components
      origin: false,
      ables: [deleteAble],
      props: { deleteViewable: true },
    });

    this.wrapperContainer.moveable.on("drag", ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;

      this.operation.x = left;
      this.operation.y = top;

      this.fireEvent("pdfeditor.componentDragging");
    });

    this.wrapperContainer.moveable.updateRect();
  };

  operationChanged = (property, value) => {
    switch (property) {
      case "text":
        this.shadow.innerText = value;
        this.updateSize();
        break;
      case "color":
        this.shadow.style.color = value;
        break;
      case "fontSize":
        this.shadow.style.fontSize = value + "px";
        this.updateSize();
        break;
      case "fontFamily":
        this.shadow.style.fontFamily = value;
        this.updateSize();
        break;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "lineHeight":
        this.shadow.style.lineHeight = value;
        break;
      case "wordBreak":
        this.shadow.style.whiteSpace = "pre-wrap";
        this.shadow.style.wordBreak = value;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 100,
    height = 25,
    fontFamily = "Helvetica",
    fontSize = 16,
    color = "#000000",
    opacity = 1.0,
  ) => {
    return {
      type: "text",
      operation: "create",
      name: "",
      identifier: id,
      height: height,
      width: width,
      x: x,
      y: y,
      xPadding: 2,
      yPadding: 5,
      text: "sample text",
      fontFamily: fontFamily,
      color: color,
      fontSize: fontSize,
      lineHeight: 1,
      opacity: opacity,
      wordBreak: "break-all",
    };
  };
}

class TextFieldOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content");
    this.shadow.contentEditable = false;

    this.wrapperContainer.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.shadow.contentEditable = true;
      this.shadow.focus();
    });

    this.shadow.addEventListener("blur", (event) => {
      event.stopPropagation();
      this.shadow.contentEditable = false;
      this.getOperation().text = this.shadow.innerText;
      this.setSelected(true);
    });

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "backgroundColor":
        this.wrapperContainer.style.backgroundColor = value;
        break;
      case "opacity":
        this.wrapperContainer.style.opacity = value;
        break;
      case "fontFamily":
        this.shadow.style.fontFamily = value;
        break;
      case "fontSize":
        this.shadow.style.fontSize = `${value}px`;
        break;
      case "borderColor":
        this.shadow.style.borderColor = value;
        break;
      case "borderWidth":
        this.shadow.style.borderWidth = value + "px";
        this.shadow.style.width = `calc(100% - ${parseInt(this.shadow.style.borderWidth) * 2}px)`;
        this.shadow.style.height = `calc(100% - ${parseInt(this.shadow.style.borderWidth) * 2}px)`;
        this.shadow.style.borderStyle = "solid";
        break;
      case "text":
        this.shadow.innerText = value;
        break;
    }
  };

  static createDefaultOperation = (id, x, y, width = 150, height = 25) => {
    return {
      type: "textfield",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      text: "",
      height: height,
      width: width,
      color: "#000000",
      borderWidth: 1,
      borderColor: "#000000",
      backgroundColor: "#ADD8E6",
      opacity: 1,
      fontFamily: "Helvetica",
      fontSize: 14,
      isRequired: false,
      isMultiline: false,
      isReadOnly: false,
      maxLength: undefined,
      alignment: "Left",
    };
  };

  static updateDefaultOperation = (
    id,
    x,
    y,
    height,
    width,
    text,
    borderWidth,
    color,
    borderColor,
    backgroundColor,
    fontFamily,
    fontSize,
    isRequired,
    isMultiline,
    isReadOnly,
    maxLength,
    alignment,
  ) => {
    return {
      type: "textfield",
      operation: "update",
      name: "",
      id: id,
      x: parseInt(x),
      y: parseInt(y),
      text: text,
      height: height + borderWidth * 2,
      width: width + borderWidth * 2,
      color: color,
      borderWidth: borderWidth,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      opacity: 1,
      fontFamily: fontFamily,
      fontSize: fontSize,
      isRequired: isRequired,
      isMultiline: isMultiline,
      isReadOnly: isReadOnly,
      maxLength: maxLength || undefined,
      alignment: alignment,
    };
  };
}

class CheckboxOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("img");
    this.shadow.classList.add("component-content");
    this.shadow.setAttribute("src", "/images/checkbox-checked.png");

    this.shadow.style.maxWidth = "100%";
    this.shadow.style.maxHeight = "100%";
    this.shadow.style.objectFit = "contain";

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "width":
        this.wrapperContainer.style.width = `${value}px`;
        break;
      case "height":
        this.wrapperContainer.style.height = `${value}px`;
        break;
      case "backgroundColor":
        this.wrapperContainer.style.backgroundColor = value;
        break;
      case "opacity":
        this.wrapperContainer.style.opacity = value;
        break;
      case "fontFamily":
        this.shadow.style.fontFamily = value;
        break;
      case "borderColor":
        this.shadow.style.borderColor = value;
        break;
      case "borderWidth":
        this.shadow.style.borderWidth = value + "px";
        this.shadow.style.borderStyle = "solid";
        this.shadow.style.width = `calc(100% - ${parseInt(this.shadow.style.borderWidth) * 2}px)`;
        this.shadow.style.height = `calc(100% - ${parseInt(this.shadow.style.borderWidth) * 2}px)`;
        break;
      case "isChecked":
        this.shadow.setAttribute(
          "src",
          value ? "/images/checkbox-checked.png" : "/images/checkbox-unchecked.png",
        );
        break;
    }
  };

  static createDefaultOperation = (id, x, y, width = 25, height = 25) => {
    return {
      type: "checkbox",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      height: height,
      width: width,
      color: "#000000",
      borderWidth: 1,
      borderColor: "#000000",
      backgroundColor: "#ADD8E6",
      opacity: 1,
      isChecked: false,
      isReadOnly: false,
    };
  };

  static updateDefaultOperation = (
    id,
    x,
    y,
    height,
    width,
    borderWidth,
    color,
    borderColor,
    backgroundColor,
    isChecked,
    isReadOnly,
  ) => {
    return {
      type: "checkbox",
      operation: "update",
      name: "",
      id: id,
      x: parseInt(x),
      y: parseInt(y),
      height: height + borderWidth * 2,
      width: width + borderWidth * 2,
      color: color,
      borderWidth: borderWidth,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      opacity: 1,
      isChecked: isChecked,
      isReadOnly: isReadOnly,
    };
  };
}

class LinkOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content", "link-component");

    // Add link visual indicator

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();
  }

  operationChanged = (property, value) => {
    switch (property) {
      case "borderWidth":
        this.shadow.style.borderWidth = value + "px";
        this.shadow.style.borderStyle = "solid";
        break;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "borderColor":
        this.shadow.style.borderStyle = "solid";
        this.shadow.style.borderColor = value;
        break;
      case "fill":
        this.shadow.style.backgroundColor = value;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 100,
    height = 30,
    linkType = "url",
    linkValue = "",
    fill = "rgba(0, 122, 204, 0.1)",
    borderColor = "#007acc",
    borderWidth = 1,
    opacity = 1.0,
  ) => {
    return {
      type: "link",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      height: height,
      width: width,
      linkType: linkType,
      linkValue: linkValue,
      fill: fill,
      opacity: opacity,
      borderColor: borderColor,
      borderWidth: borderWidth,
    };
  };
}

class NoteOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    Object.assign(this.wrapperContainer.style, {
      overflow: "visible",
      zIndex: "10",
      pointerEvents: "auto",
    });

    this.iconContainer = document.createElement("div");
    this.iconContainer.classList.add("component-content", "note-icon");
    Object.assign(this.iconContainer.style, {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    });

    this.icon = document.createElement("i");
    this.icon.classList.add("fa-solid", "fa-comment");
    Object.assign(this.icon.style, { fontSize: "100%", cursor: "pointer" });
    this.iconContainer.appendChild(this.icon);

    this.tooltip = document.createElement("div");
    this.tooltip.classList.add("note-tooltip");
    Object.assign(this.tooltip.style, {
      display: "none",
      position: "absolute",
      left: "100%",
      top: "0",
      minWidth: "250px",
      zIndex: "10000",
      border: "1px solid #999",
      boxShadow: "2px 2px 5px rgba(0,0,0,0.2)",
      fontSize: "12px",
      textAlign: "left",
      cursor: "default",
    });

    this.wrapperContainer.append(this.iconContainer, this.tooltip);

    this.wrapperContainer.addEventListener("mouseenter", () => {
      this.tooltip.style.display = "block";
      this.wrapperContainer.style.zIndex = "10000";
    });

    this.wrapperContainer.addEventListener("mouseleave", () => {
      this.tooltip.style.display = "none";
      this.wrapperContainer.style.zIndex = "10";
    });

    this.wrapperContainer.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.fireEvent("pdfeditor.editNote");
    });

    this.initializeOperation();
    this.renderTooltipContent();
  }

  renderTooltipContent = () => {
    const op = this.getOperation();
    const {
      text = "",
      author = "User",
      backgroundColor = "#ffff88",
      textColor = "#000000",
      fontFamily = "Helvetica",
      fontSize = 12,
      color = "#FFFF00",
    } = op;

    // Clear existing content
    this.tooltip.innerHTML = "";
    // Header with static icon and dynamic timestamp
    const header = document.createElement("div");
    header.style.padding = "5px";
    header.style.borderBottom = "1px solid rgba(0,0,0,0.1)";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.fontWeight = "bold";
    const headerLeft = document.createElement("span");
    // Static markup; no user-controlled data here.
    headerLeft.innerHTML = '<i class="fa-regular fa-comment-alt"></i> Note';
    const headerRight = document.createElement("span");
    headerRight.style.fontWeight = "normal";
    headerRight.style.fontSize = "0.9em";
    headerRight.textContent = new Date().toLocaleString();
    header.appendChild(headerLeft);
    header.appendChild(headerRight);
    // Author section
    const authorDiv = document.createElement("div");
    authorDiv.style.padding = "5px 10px 2px 10px";
    authorDiv.style.fontWeight = "bold";
    const authorSpan = document.createElement("span");
    authorSpan.textContent = author;
    authorDiv.appendChild(authorSpan);
    // Text section
    const textDiv = document.createElement("div");
    textDiv.style.padding = "2px 10px 10px 10px";
    textDiv.style.minHeight = "50px";
    textDiv.style.whiteSpace = "pre-wrap";
    textDiv.textContent = text;
    this.tooltip.appendChild(header);
    this.tooltip.appendChild(authorDiv);
    this.tooltip.appendChild(textDiv);

    Object.assign(this.tooltip.style, {
      backgroundColor,
      color: textColor,
      fontFamily,
      fontSize: fontSize + "px",
    });
    this.icon.style.color = color;
  };

  operationChanged = (property, value) => {
    switch (property) {
      case "color":
        this.icon.style.color = value;
        break;
      case "backgroundColor":
        this.tooltip.style.backgroundColor = value;
        break;
      case "text":
      case "author":
        this.renderTooltipContent();
        break;
      case "textColor":
        this.tooltip.style.color = value;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 30,
    height = 30,
    text = "New Note",
    color = "#FFFF00",
    backgroundColor = "#FFFF88",
    textColor = "#000000",
    fontFamily = "Helvetica",
    fontSize = 12,
    author = "User",
  ) => {
    return {
      type: "note",
      operation: "create",
      name: "",
      id: id,
      x: x,
      y: y,
      width: width,
      height: height,
      text: text,
      color: color,
      backgroundColor: backgroundColor,
      textColor: textColor,
      fontFamily: fontFamily,
      fontSize: fontSize,
      author: author,
      opacity: 1.0,
    };
  };
}

class WatermarkOperationComponent extends BasicOperationComponent {
  constructor(operation, canvasContainer) {
    super(operation, canvasContainer);

    this.shadow = document.createElement("div");
    this.shadow.classList.add("component-content");
    this.shadow.style.width = "auto";
    this.shadow.style.height = "auto";
    this.shadow.style.whiteSpace = "pre-wrap";
    this.shadow.style.overflowWrap = "break-word";
    this.shadow.style.display = "inline-block";
    this.shadow.style.lineHeight = "1.2";
    this.shadow.style.overflow = "visible";
    this.shadow.style.paddingTop = "1px";
    this.shadow.contentEditable = false;
    this.shadow.style.pointerEvents = "none"; // Watermarks shouldn't be editable
    this.shadow.style.textAlign = this.operation.alignment || "center";

    this.wrapperContainer.appendChild(this.shadow);
    this.initializeOperation();

    this.wrapperContainer.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      this.fireEvent("pdfeditor.editWatermark");
    });

    // Initial size update
    setTimeout(this.updateSize, 0);
  }

  updateSize = () => {
    const temp = document.createElement("div");
    temp.style.position = "absolute";
    temp.style.visibility = "hidden";
    temp.style.whiteSpace = "pre-wrap";
    temp.style.overflowWrap = "break-word";
    temp.style.display = "inline-block";
    temp.style.lineHeight = "1.2";
    temp.style.font =
      this.shadow.style.font || `${this.operation.fontSize}px ${this.operation.fontFamily}`;
    temp.style.fontSize = this.shadow.style.fontSize;
    temp.style.fontFamily = this.shadow.style.fontFamily;
    temp.style.fontWeight = this.shadow.style.fontWeight;
    temp.style.fontStyle = this.shadow.style.fontStyle;
    temp.textContent = this.shadow.textContent || "WATERMARK";

    document.body.appendChild(temp);
    const width = Math.max(temp.offsetWidth + 8, 20);
    const height = Math.max(temp.offsetHeight + 8, 20);
    document.body.removeChild(temp);

    this.operation.width = width;
    this.operation.height = height;
    this.wrapperContainer.style.width = `${width}px`;
    this.wrapperContainer.style.height = `${height}px`;

    if (this.wrapperContainer.moveable) {
      this.wrapperContainer.moveable.updateRect();
    }
  };

  makeMoveable = () => {
    const deleteAble = this.createDeleteAble();

    this.wrapperContainer.moveable = new Moveable(this.canvasContainer, {
      target: this.wrapperContainer,
      container: this.canvasContainer,
      draggable: true,
      resizable: false,
      rotatable: true, // Enable rotation for watermarks
      origin: false,
      ables: [deleteAble],
      props: { deleteViewable: true },
    });

    this.wrapperContainer.moveable.on("drag", ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
      this.operation.x = left;
      this.operation.y = top;
      this.fireEvent("pdfeditor.componentDragging");
    });

    this.wrapperContainer.moveable.on("rotate", ({ target, transform, rotation }) => {
      target.style.transform = transform;
      // Store rotation angle directly from the event to avoid parsing the transform string
      if (typeof rotation === "number") {
        this.operation.rotation = rotation;
      }
    });

    this.wrapperContainer.moveable.updateRect();
  };

  operationChanged = (property, value) => {
    switch (property) {
      case "text":
        this.shadow.textContent = value;
        this.updateSize();
        break;
      case "color":
        this.shadow.style.color = value;
        break;
      case "fontSize":
        this.shadow.style.fontSize = value + "px";
        this.updateSize();
        break;
      case "fontFamily":
        this.shadow.style.fontFamily = value;
        this.updateSize();
        break;
      case "opacity":
        this.shadow.style.opacity = value;
        break;
      case "bold":
        this.shadow.style.fontWeight = value ? "bold" : "normal";
        this.updateSize();
        break;
      case "italic":
        this.shadow.style.fontStyle = value ? "italic" : "normal";
        this.updateSize();
        break;
      case "underline":
        this.shadow.style.textDecoration = value ? "underline" : "none";
        break;
      case "alignment":
        this.shadow.style.textAlign = value;
        break;
      case "rotation":
        this.wrapperContainer.style.transform = `rotate(${value}deg)`;
        break;
    }
  };

  static createDefaultOperation = (
    id,
    x,
    y,
    width = 200,
    height = 50,
    text = "WATERMARK",
    fontFamily = "Helvetica",
    fontSize = 126,
    color = "#1E1E1E",
    opacity = 0.5,
    rotation = 0,
    bold = false,
    italic = false,
    underline = false,
    alignment = "center",
    groupId = null,
  ) => {
    return {
      type: "watermark",
      operation: "create",
      name: "",
      identifier: id,
      height: height,
      width: width,
      x: x,
      y: y,
      xPadding: 2,
      yPadding: 5,
      text: text,
      fontFamily: fontFamily,
      color: color,
      fontSize: fontSize,
      lineHeight: 1.2,
      opacity: opacity,
      wordBreak: "break-all",
      rotation: rotation,
      bold: bold,
      italic: italic,
      underline: underline,
      alignment: alignment,
      groupId: groupId,
    };
  };
}

export {
  BasicOperationComponent,
  ImageOperationComponent,
  RectangleOperationComponent,
  CircleOperationComponent,
  TextOperationComponent,
  TextFieldOperationComponent,
  CheckboxOperationComponent,
  LinkOperationComponent,
  NoteOperationComponent,
  WatermarkOperationComponent,
};
