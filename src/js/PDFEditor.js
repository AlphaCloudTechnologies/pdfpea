import { 
  ImageOperationComponent, 
  RectangleOperationComponent, 
  CircleOperationComponent, 
  TextOperationComponent, 
  TextFieldOperationComponent, 
  CheckboxOperationComponent,
  LinkOperationComponent 
} from './OperationComponents.js';

import { PDFGenerator } from './PDFGenerator.js';

import { 
  DEFAULT_VALUES, 
  FIELD_TYPES, 
  ALIGNMENT, 
  COMPONENT_TYPES, 
  EVENTS,
  IMAGE_PATHS
} from './constants.js';

class PDFEditor {
  container = null;
  pdfPages = [];

  constructor(container) {
    this.container = container;
  }

  async renderPDF(fileName, fileContents) {
    this.fileContents = fileContents;
    this.pdfPages = [];
    return new Promise(async (resolve, reject) => {
      try {
        const pdfDoc = await pdfjsLib.getDocument({ data: fileContents }).promise;
        const promises = [];

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const promise = await pdfDoc.getPage(pageNum).then(async() => {
            const pdfURL = fileName;
            const pdfPageNumber = pageNum;

            const pdfPageContainer = document.createElement('div');
            this.container.appendChild(pdfPageContainer);

            const pdfPage = new PDFPage(pdfPageContainer);
            await pdfPage.initialize(pdfURL, pdfPageNumber, fileContents);

            this.pdfPages.push(pdfPage);
          });

          promises.push(promise);
        }

        await Promise.all(promises);
        resolve();
      } catch (error) {
        console.error('Error processing PDF:', error);
        reject(error);
      }
    });
  }

  async downloadPDF() {
    const pageOperations = this.pdfPages.map((page) => ({
      pageNumber: page.pageNumber,
      operations: page.getOperations()
    }));

    return await PDFGenerator.generatePDF(this.fileContents, pageOperations);
  }

  applyZoom(zoomLevel) {
    console.log('Applying zoom level:', zoomLevel);
    this.pdfPages.forEach((page) => {
      page.applyZoom(zoomLevel);
    });
  }
}

class PDFPage {
  constructor(container) {
    this.container = container;
    this.container.classList.add('pdf-page');

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'body-pdf-canvas');
    this.canvas.setAttribute('class', 'body-pdf-canvas');
    this.canvas.style.display = 'block';
    this.context = this.canvas.getContext('2d');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Basic click handler for selection - drawing handlers will be added by App.vue
    this.canvas.addEventListener("click", (event) => {
      event.stopPropagation();
      this.setSelected();
    });

  }

  rgbToHex(red, green, blue) {
    const redHex = red.toString(16).padStart(2, '0');
    const greenHex = green.toString(16).padStart(2, '0');
    const blueHex = blue.toString(16).padStart(2, '0');

    return `#${redHex}${greenHex}${blueHex}`;
  }

  async initialize(pdfURL, pageNumber, fileContents) {
    const scale = DEFAULT_VALUES.SCALE;

    this.pdfURL = pdfURL;
    this.pageNumber = pageNumber;

    try {
      const pdfDoc = await pdfjsLib.getDocument({ data: fileContents }).promise;
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Set canvas to high resolution
      this.canvas.height = viewport.height;
      this.canvas.width = viewport.width;
      
      // Set container style to display size (half of canvas size for 2x scale)
      const displayHeight = viewport.height / scale;
      const displayWidth = viewport.width / scale;
      this.container.style.height = `${displayHeight}px`;
      this.container.style.width = `${displayWidth}px`;
      
      // Scale canvas style to fit container
      this.canvas.style.height = `${displayHeight}px`;
      this.canvas.style.width = `${displayWidth}px`;
      
      this.container.appendChild(this.canvas);
      
      const formFields = await page.getAnnotations();

      await page.render({
        annotationMode: pdfjsLib.AnnotationMode.DISABLE,
        canvasContext: this.context,
        viewport: page.getViewport({ scale: DEFAULT_VALUES.SCALE })
      });

      this.processFormFields(formFields, viewport);
    } catch (error) {
      console.error('Error initializing PDF page:', error);
    }
  }

  processFormFields(formFields, viewport) {
    for (let field of formFields) {
      if (field.fieldType === FIELD_TYPES.TEXT_FIELD) {
        this.createTextFieldFromPDF(field, viewport);
      } else if (field.fieldType === FIELD_TYPES.BUTTON && field.checkBox) {
        this.createCheckboxFromPDF(field, viewport);
      }
    }
  }

  createTextFieldFromPDF(field, viewport) {
    const rect = field.rect;
    const id = field.fieldName;
    const borderWidth = field.borderStyle.width;
    const x = Math.ceil(rect[0]);
    const tempY = Math.ceil(rect[1]);
    const width = Math.floor(rect[2]) - x - (2 * borderWidth);
    const height = Math.floor(rect[3]) - tempY - (2 * borderWidth);
    const y = viewport.height - tempY - height - (2 * borderWidth);
    const color = this.rgbToHex(field.color[0], field.color[1], field.color[2]);
    const borderColor = this.rgbToHex(field.borderColor[0], field.borderColor[1], field.borderColor[2]);
    const backgroundColor = this.rgbToHex(field.backgroundColor[0], field.backgroundColor[1], field.backgroundColor[2]);
    const fontFamily = field.defaultAppearanceData.fontName;
    const fontSize = field.defaultAppearanceData.fontSize;
    const text = field.fieldValue;
    
    const isRequired = field.required;
    const isMultiline = field.multiLine;
    const isReadOnly = field.readOnly;
    const maxLength = field.maxLen;

    const alignment = 
      field.textAlignment === 0 ? ALIGNMENT.LEFT : 
      field.textAlignment === 1 ? ALIGNMENT.CENTER : 
      field.textAlignment === 2 ? ALIGNMENT.RIGHT : ALIGNMENT.LEFT;

    new TextFieldOperationComponent(
      TextFieldOperationComponent.updateDefaultOperation(
        id, x, y, height, width, text, borderWidth, color, borderColor, 
        backgroundColor, fontFamily, fontSize, isRequired, isMultiline, isReadOnly, maxLength, alignment
      ), 
      this.container
    );
  }

  createCheckboxFromPDF(field, viewport) {
    const rect = field.rect;
    const id = field.fieldName;
    const borderWidth = field.borderStyle.width;
    const x = Math.ceil(rect[0]);
    const tempY = Math.ceil(rect[1]);
    const width = Math.floor(rect[2]) - x - (2 * borderWidth);
    const height = Math.floor(rect[3]) - tempY - (2 * borderWidth);
    const y = viewport.height - tempY - height - (2 * borderWidth);
    const color = this.rgbToHex(field.color[0], field.color[1], field.color[2]);
    const borderColor = this.rgbToHex(field.borderColor[0], field.borderColor[1], field.borderColor[2]);
    const backgroundColor = this.rgbToHex(field.backgroundColor[0], field.backgroundColor[1], field.backgroundColor[2]);
    const isChecked = field.fieldFlags === 1;
    const isReadOnly = field.readOnly;

    new CheckboxOperationComponent(
      CheckboxOperationComponent.updateDefaultOperation(
        id, x, y, height, width, borderWidth, color, borderColor, backgroundColor, isChecked, isReadOnly
      ), 
      this.container
    );
  }

  createComponentWithDimensions(toolType, settings, id, x, y, width, height) {
    switch (toolType) {
      case COMPONENT_TYPES.CIRCLE:
        if (settings?.fill !== undefined || settings?.borderColor !== undefined || settings?.borderWidth !== undefined) {
          return new CircleOperationComponent(
            CircleOperationComponent.createDefaultOperation(
              id, x, y, width, height, 
              settings.fill || 'transparent',
              settings.borderColor || '#FF0000',
              settings.borderWidth || 2,
              settings.opacity || 1.0
            ), this.container
          );
        } else {
          return new CircleOperationComponent(
            CircleOperationComponent.createDefaultOperation(id, x, y, width, height), this.container
          );
        }
      
      case COMPONENT_TYPES.RECTANGLE:
        if(settings?.subType === 'highlight') {
          return new RectangleOperationComponent(
            RectangleOperationComponent.createDefaultOperation(
              id, x, y, width, height, 
              settings.fill || '#FFFF00',
              '',
              0,
              'solid', 
              settings.opacity || 0.5
            ), this.container
          );
        } else if(settings?.subType === 'white-out') {
          return new RectangleOperationComponent(
            RectangleOperationComponent.createDefaultOperation(id, x, y, width, height, '#FFFFFF','',0), this.container
          );
        } else if (settings?.fill !== undefined || settings?.borderColor !== undefined || settings?.borderWidth !== undefined) {
          return new RectangleOperationComponent(
            RectangleOperationComponent.createDefaultOperation(
              id, x, y, width, height, 
              settings.fill || 'transparent',
              settings.borderColor || '#FF0000',
              settings.borderWidth || 2,
              'solid',
              settings.opacity || 1.0
            ), this.container
          );
        } else {
          return new RectangleOperationComponent(
            RectangleOperationComponent.createDefaultOperation(id, x, y, width, height), this.container
          );
        }
      
      case COMPONENT_TYPES.TEXT:
        if (settings?.fontFamily || settings?.fontSize || settings?.color || settings?.opacity) {
          return new TextOperationComponent(
            TextOperationComponent.createDefaultOperation(
              id, x, y, width, height,
              settings.fontFamily || 'Helvetica',
              settings.fontSize || 16,
              settings.color || '#000000',
              settings.opacity || 1.0
            ), this.container
          );
        } else {
          return new TextOperationComponent(
            TextOperationComponent.createDefaultOperation(id, x, y, width, height), this.container
          );
        }
      
      case COMPONENT_TYPES.IMAGE:
        if(settings?.subType === 'icon') {
          return new ImageOperationComponent(
            ImageOperationComponent.createDefaultOperation(id, x, y, width, height, settings.url, 100, 100, settings.subType), this.container
          );
        } else if(settings?.subType === 'freehand') {
          return new ImageOperationComponent(
            ImageOperationComponent.createDefaultOperation(id, x, y, width, height, settings.url, 100, 100, settings.subType), this.container
          );
        } else if(settings?.subType === 'line') {
          return new ImageOperationComponent(
            ImageOperationComponent.createDefaultOperation(id, x, y, width, height, settings.url, 100, 100, settings.subType), this.container
          );
        } else {
          return new ImageOperationComponent(
            ImageOperationComponent.createDefaultOperation(id, x, y, width, height, settings.url || '/images/default_image.jpg', 100, 100, settings?.subType), this.container
          );
        }
      
      case COMPONENT_TYPES.TEXT_FIELD:
        return new TextFieldOperationComponent(
          TextFieldOperationComponent.createDefaultOperation(id, x, y, width, height), this.container
        );
      
      case COMPONENT_TYPES.CHECKBOX:
        return new CheckboxOperationComponent(
          CheckboxOperationComponent.createDefaultOperation(id, x, y, width, height), this.container
        );
      
      case COMPONENT_TYPES.LINK:
        return new LinkOperationComponent(
          LinkOperationComponent.createDefaultOperation(
            id, x, y, width, height,
            settings.linkType || 'url',
            settings.linkValue || '',
            settings.fill || 'rgba(0, 122, 204, 0.1)',
            settings.borderColor || '#007acc',
            settings.borderWidth || 1,
            settings.opacity || 1.0
          ), this.container
        );
      
      default:
        return null;
    }
  }

  getOperations = () => {
    const components = Array.from(this.container.getElementsByClassName("component"));
    return components.map((element) => element.operation);
  }

  setSelected = () => {
    this.fireEvent(EVENTS.SHOULD_CLEAR_ALL_SELECTION);
  }

  fireEvent = (eventName) => {
    const event = new CustomEvent(eventName, {
      detail: { 
        target: this, 
      },
      bubbles: true,
      cancelable: true
    });

    document.dispatchEvent(event);     
  }

  applyZoom(zoomLevel) {
    console.log('Applying zoom to page:', this.pageNumber, 'zoom:', zoomLevel);
    this.container.style.transform = `scale(${zoomLevel})`;
    this.container.style.transformOrigin = 'top left';
    
    // Calculate the actual dimensions after scaling
    const originalHeight = this.container.offsetHeight;
    const originalWidth = this.container.offsetWidth;
    const scaledHeight = originalHeight * zoomLevel;
    const scaledWidth = originalWidth * zoomLevel;
    
    // Set margins to account for the increased size after scaling
    // This ensures the next page is pushed down by the full scaled height
    this.container.style.marginBottom = `${(scaledHeight - originalHeight) + 20}px`; // +20px for gap between pages
    this.container.style.marginRight = `${(scaledWidth - originalWidth)}px`;
  }
}

export { PDFEditor };