<template>
  <div class="pdf-editor">
    <div class="p-2">
      <div class="header-actions">


        <!-- Single element container for all tool options -->
        <div class="element-container ml-2">

          <div class="option-element">
            <input type="file" id="file" ref="file" style="display: none" @change="handleFileUpload" />
            <button @click="clickFileInput" class="btn ml-4" title="Open a PDF file from your device">
              <i class="fa-solid fa-folder-open mr-2"></i>
              Open
            </button>
          </div>
          <div class="option-element">
            <button id="download-pdf-button" @click="downloadPDF()" class="btn"
              title="Export the edited PDF with all annotations">
              <i class="fa-solid fa-download mr-2"></i>
              Export
            </button>
          </div>
          <div class="option-element">

            <!-- Config Dropdown -->
            <div class="dropdown">
              <button @click="toggleConfigDropdown" class="btn"
                title="Configuration options - export or restore project settings">
                <i class="fa-solid fa-cog mr-2"></i>
                Config
                <i class="fa-solid fa-chevron-down ml-2"></i>
              </button>
              <div class="dropdown-menu" :class="{ show: showConfigDropdown }">
                <button @click="downloadConfig(); closeConfigDropdown()" class="dropdown-item">
                  <i class="fa-solid fa-file-export mr-2"></i>
                  Export Config
                </button>
                <div class="dropdown-divider"></div>
                <button @click="clickRestoreConfigInput(); closeConfigDropdown()" class="dropdown-item">
                  <i class="fa-solid fa-file-import mr-2"></i>
                  Restore Config
                </button>
              </div>
            </div>
            <input type="file" id="config-file" ref="configFile" style="display: none" accept=".json"
              @change="handleConfigRestore" />
          </div>
          <!-- General controls (always visible) -->
          <div class="option-element">
            <button @click="clearMeasurements" class="btn btn-xs" title="Clear all measurement lines from the document">
              <i class="fa-solid fa-ruler"></i>
              Clear
            </button>
          </div>

          <div class="option-element">
            <button @click="scrollToEditor" class="btn btn-xs" title="Focus on the PDF editor area">
              <i class="fa-solid fa-expand"></i>
              Focus
            </button>
          </div>

          <div class="option-element">
            <select v-model="zoomLevel" @change="applyZoom" class="btn btn-xs"
              title="Adjust the zoom level of the PDF document">
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1.0">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="1.75">175%</option>
              <option value="2.0">200%</option>
              <option value="2.25">225%</option>
              <option value="2.5">250%</option>
              <option value="2.75">275%</option>
              <option value="3.0">300%</option>
            </select>
          </div>

          <!-- Freehand tool options -->
          <template v-if="selectedTool === 'freehand'">
            <div class="option-element">
              <label>Smooth:</label>
              <input type="range" v-model="freehandOptions.smoothLevel" min="1" max="10" />
              <span class="value-display">{{ freehandOptions.smoothLevel }}</span>
            </div>

            <div class="option-element">
              <label>Stroke Color:</label>
              <input type="color" v-model="freehandOptions.color" />
            </div>

            <div class="option-element">
              <label>Stroke Width:</label>
              <input type="range" v-model="freehandOptions.width" min="1" max="20" />
              <span class="value-display">{{ freehandOptions.width }}px</span>
            </div>
          </template>

          <!-- Line tool options -->
          <template v-if="selectedTool === 'line'">
            <div class="option-element">
              <label>Stroke Color:</label>
              <input type="color" v-model="lineOptions.color" />
            </div>

            <div class="option-element">
              <label>Stroke Width:</label>
              <input type="range" v-model="lineOptions.width" min="1" max="20" />
              <span class="value-display">{{ lineOptions.width }}px</span>
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="lineOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(lineOptions.opacity * 100) }}%</span>
            </div>
          </template>

          <!-- Shape tool options (Circle and Rectangle) -->
          <template v-if="selectedTool === 'rectangle' || selectedTool === 'circle'">
            <div class="option-element">
              <label>Fill:</label>
              <input type="color" v-model="shapeOptions.fill" />
              <button @click="shapeOptions.fill = 'transparent'" class="btn transparent-btn" title="No Fill">
                ∅
              </button>
            </div>

            <div class="option-element">
              <label>Border:</label>
              <input type="color" v-model="shapeOptions.borderColor" />
            </div>

            <div class="option-element">
              <label>Width:</label>
              <input type="range" v-model="shapeOptions.borderWidth" min="0" max="10" />
              <span class="value-display">{{ shapeOptions.borderWidth }}px</span>
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="shapeOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(shapeOptions.opacity * 100) }}%</span>
            </div>
          </template>

          <!-- Selected Component Options - Show when select tool is active and component is selected -->
          <template v-if="selectedTool === 'select' && selectedOperation">
            <!-- Selected Text Component Options -->
            <template v-if="selectedOperation.type === 'text'">
              <div class="option-element">
                <label>Font:</label>
                <select v-model="selectedOperation.fontFamily" class="font-select">
                  <option value="Helvetica">Helvetica</option>
                  <option value="Helvetica-Bold">Helvetica Bold</option>
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Times-Bold">Times Bold</option>
                  <option value="Courier">Courier</option>
                  <option value="Courier-Bold">Courier Bold</option>
                </select>
              </div>

              <div class="option-element">
                <label>Size:</label>
                <input type="range" v-model="selectedOperation.fontSize" min="8" max="72" />
                <span class="value-display">{{ selectedOperation.fontSize }}px</span>
              </div>

              <div class="option-element">
                <label>Color:</label>
                <input type="color" v-model="selectedOperation.color" />
              </div>

              <div class="option-element">
                <label>Opacity:</label>
                <input type="range" v-model="selectedOperation.opacity" min="0.1" max="1.0" step="0.1" />
                <span class="value-display">{{ Math.round(selectedOperation.opacity * 100) }}%</span>
              </div>
            </template>

            <!-- Selected Rectangle/Circle Component Options -->
            <template v-if="selectedOperation.type === 'rectangle' || selectedOperation.type === 'circle'">
              <div class="option-element">
                <label>Fill:</label>
                <input type="color" v-model="selectedOperation.fill" />
                <button @click="selectedOperation.fill = 'transparent'" class="btn transparent-btn" title="No Fill">
                  ∅
                </button>
              </div>

              <div class="option-element">
                <label>Border:</label>
                <input type="color" v-model="selectedOperation.borderColor" />
              </div>

              <div class="option-element">
                <label>Width:</label>
                <input type="range" v-model="selectedOperation.borderWidth" min="0" max="10" />
                <span class="value-display">{{ selectedOperation.borderWidth }}px</span>
              </div>

              <div class="option-element">
                <label>Opacity:</label>
                <input type="range" v-model="selectedOperation.opacity" min="0.1" max="1.0" step="0.1" />
                <span class="value-display">{{ Math.round(selectedOperation.opacity * 100) }}%</span>
              </div>
            </template>

            <!-- Selected Image Component Options -->
            <template v-if="selectedOperation.type === 'image'">
              <!-- SVG-specific controls for line and freehand -->
              <template v-if="selectedOperation.subType === 'line' || selectedOperation.subType === 'freehand'">
                <div class="option-element">
                  <label>Stroke Color:</label>
                  <div class="color-input-group">
                    <input type="color" :value="getSvgStrokeColor(selectedOperation)"
                      @input="updateSvgStrokeColor(selectedOperation, $event.target.value)" class="color-picker">
                  </div>
                </div>

                <div class="option-element">
                  <label>Stroke Width:</label>
                  <input type="range" :value="getSvgStrokeWidth(selectedOperation)"
                    @input="updateSvgStrokeWidth(selectedOperation, $event.target.value)" min="1" max="20" />
                  <span class="value-display">{{ getSvgStrokeWidth(selectedOperation) }}px</span>
                </div>
              </template>

              <!-- SVG-specific controls for icons -->
              <template v-if="selectedOperation.subType === 'icon'">
                <div class="option-element">
                  <label>Fill Color:</label>
                  <div class="color-input-group">
                    <input type="color" :value="getSvgFillColor(selectedOperation)"
                      @input="updateSvgFillColor(selectedOperation, $event.target.value)" class="color-picker">
                  </div>
                </div>
              </template>

              <div class="option-element">
                <label>Opacity:</label>
                <input type="range" v-model="selectedOperation.opacity" min="0.1" max="1.0" step="0.1" />
                <span class="value-display">{{ Math.round(selectedOperation.opacity * 100) }}%</span>
              </div>
            </template>

            <!-- Selected TextField Component Options -->
            <template v-if="selectedOperation.type === 'textfield'">
              <div class="option-element">
                <label>Font:</label>
                <select v-model="selectedOperation.fontFamily" class="font-select">
                  <option value="Helvetica">Helvetica</option>
                  <option value="Helvetica-Bold">Helvetica Bold</option>
                  <option value="Times-Roman">Times Roman</option>
                  <option value="Times-Bold">Times Bold</option>
                  <option value="Courier">Courier</option>
                  <option value="Courier-Bold">Courier Bold</option>
                </select>
              </div>

              <div class="option-element">
                <label>Size:</label>
                <input type="range" v-model="selectedOperation.fontSize" min="8" max="72" />
                <span class="value-display">{{ selectedOperation.fontSize }}px</span>
              </div>

              <div class="option-element">
                <label>Text Color:</label>
                <input type="color" v-model="selectedOperation.color" />
              </div>

              <div class="option-element">
                <label>Background:</label>
                <input type="color" v-model="selectedOperation.backgroundColor" />
              </div>

              <div class="option-element">
                <label>Border:</label>
                <input type="color" v-model="selectedOperation.borderColor" />
              </div>

              <div class="option-element">
                <label>Border Width:</label>
                <input type="range" v-model="selectedOperation.borderWidth" min="0" max="5" />
                <span class="value-display">{{ selectedOperation.borderWidth }}px</span>
              </div>
            </template>

            <!-- Selected Checkbox Component Options -->
            <template v-if="selectedOperation.type === 'checkbox'">
              <div class="option-element">
                <label>Background:</label>
                <input type="color" v-model="selectedOperation.backgroundColor" />
              </div>

              <div class="option-element">
                <label>Border:</label>
                <input type="color" v-model="selectedOperation.borderColor" />
              </div>

              <div class="option-element">
                <label>Border Width:</label>
                <input type="range" v-model="selectedOperation.borderWidth" min="0" max="5" />
                <span class="value-display">{{ selectedOperation.borderWidth }}px</span>
              </div>

              <div class="option-element">
                <label>Checked:</label>
                <input type="checkbox" v-model="selectedOperation.isChecked" />
              </div>
            </template>

            <!-- Selected Link Component Options -->
            <template v-if="selectedOperation.type === 'link'">
              <div class="option-element">
                <label>Fill:</label>
                <input type="color" v-model="selectedOperation.fill" />
                <button @click="selectedOperation.fill = 'transparent'" class="btn transparent-btn" title="No Fill">
                  ∅
                </button>
              </div>

              <div class="option-element">
                <label>Border:</label>
                <input type="color" v-model="selectedOperation.borderColor" />
              </div>

              <div class="option-element">
                <label>Border Width:</label>
                <input type="range" v-model="selectedOperation.borderWidth" min="0" max="10" />
                <span class="value-display">{{ selectedOperation.borderWidth }}px</span>
              </div>

              <div class="option-element">
                <label>Opacity:</label>
                <input type="range" v-model="selectedOperation.opacity" min="0.1" max="1.0" step="0.1" />
                <span class="value-display">{{ Math.round(selectedOperation.opacity * 100) }}%</span>
              </div>
            </template>
          </template>

          <!-- Highlight tool options -->
          <template v-if="selectedTool === 'highlight'">
            <div class="option-element">
              <label>Fill:</label>
              <input type="color" v-model="highlightOptions.fill" />
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="highlightOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(highlightOptions.opacity * 100) }}%</span>
            </div>
          </template>

          <!-- Text tool options -->
          <template v-if="selectedTool === 'text'">
            <div class="option-element">
              <label>Font:</label>
              <select v-model="textOptions.fontFamily" class="font-select">
                <option value="Helvetica">Helvetica</option>
                <option value="Helvetica-Bold">Helvetica Bold</option>
                <option value="Times-Roman">Times Roman</option>
                <option value="Times-Bold">Times Bold</option>
                <option value="Courier">Courier</option>
                <option value="Courier-Bold">Courier Bold</option>
              </select>
            </div>

            <div class="option-element">
              <label>Size:</label>
              <input type="range" v-model="textOptions.fontSize" min="8" max="72" />
              <span class="value-display">{{ textOptions.fontSize }}px </span>
            </div>

            <div class="option-element">
              <label>Color:</label>
              <input type="color" v-model="textOptions.color" />
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="textOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(textOptions.opacity * 100) }}%</span>
            </div>
          </template>

          <!-- Icon tool options -->
          <template v-if="iconTools.some(tool => tool.id === selectedTool)">
            <div class="option-element">
              <label>Size:</label>
              <select v-model="iconOptions.size" class="font-select">
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
                <option value="25">25</option>
                <option value="30">30</option>
                <option value="35">35</option>
                <option value="40">40</option>
                <option value="45">45</option>
                <option value="50">50</option>
                <option value="55">55</option>
                <option value="60">60</option>
                <option value="65">65</option>
                <option value="70">70</option>
                <option value="75">75</option>
                <option value="80">80</option>
                <option value="85">85</option>
                <option value="90">90</option>
                <option value="95">95</option>
                <option value="100">100</option>
                <option value="105">105</option>
                <option value="110">110</option>
                <option value="115">115</option>
                <option value="120">120</option>
                <option value="125">125</option>
                <option value="130">130</option>
                <option value="135">135</option>
                <option value="140">140</option>
                <option value="145">145</option>
                <option value="150">150</option>
                <option value="155">155</option>
                <option value="160">160</option>
                <option value="165">165</option>
                <option value="170">170</option>
                <option value="175">175</option>
                <option value="180">180</option>
                <option value="185">185</option>
                <option value="190">190</option>
                <option value="195">195</option>
                <option value="200">200</option>
              </select>
            </div>

            <div class="option-element">
              <label>Fill Color:</label>
              <input type="color" v-model="iconOptions.fillColor" />
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="iconOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(iconOptions.opacity * 100) }}%</span>
            </div>
          </template>

          <!-- Link tool options -->
          <template v-if="selectedTool === 'link'">
            <div class="option-element">
              <label>Fill:</label>
              <input type="color" v-model="linkOptions.fill" />
              <button @click="linkOptions.fill = 'transparent'" class="btn transparent-btn" title="No Fill">
                ∅
              </button>
            </div>

            <div class="option-element">
              <label>Border:</label>
              <input type="color" v-model="linkOptions.borderColor" />
            </div>

            <div class="option-element">
              <label>Width:</label>
              <input type="range" v-model="linkOptions.borderWidth" min="0" max="10" />
              <span class="value-display">{{ linkOptions.borderWidth }}px</span>
            </div>

            <div class="option-element">
              <label>Opacity:</label>
              <input type="range" v-model="linkOptions.opacity" min="0.1" max="1.0" step="0.1" />
              <span class="value-display">{{ Math.round(linkOptions.opacity * 100) }}%</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Image Dialog Component -->
    <ImageDialog :show="showImageDialog" @close="closeImageDialog" @confirm="handleImageConfirm" />

    <!-- Link Dialog Component -->
    <LinkDialog :show="showLinkDialog" @close="closeLinkDialog" @confirm="handleLinkConfirm" />

    <div class="pdf-body">

              <!-- Floating Toolbar -->
              <div class="floating-toolbar">
          <!-- General Tools Section -->
          <div class="tools-section">
            <div class="body-tool" :class="{ active: selectedTool === 'select' }" @click="selectTool('select')"
              title="Select Tool - Click and drag to select and move components">
              <i class="fa-solid fa-mouse-pointer"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'text' }" @click="selectTool('text')"
              title="Text Tool - Click to add text to the document">
              <i class="fa-solid fa-font"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'image' }" @click="selectTool('image')"
              title="Image Tool - Click and drag to add images to the document">
              <i class="fa-regular fa-image"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'rectangle' }" @click="selectTool('rectangle')"
              title="Rectangle Tool - Click and drag to draw rectangles">
              <i class="fa-regular fa-square"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'circle' }" @click="selectTool('circle')"
              title="Circle Tool - Click and drag to draw circles and ellipses">
              <i class="fa-regular fa-circle"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'white-out' }" @click="selectTool('white-out')"
              title="White-out Tool - Click and drag to cover text with white rectangles">
              <i class="fa fa-window-close-o" aria-hidden="true"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'highlight' }" @click="selectTool('highlight')"
              title="Highlight Tool - Click and drag to highlight text with colored rectangles">
              <img src="/images/highlight.svg" alt="highlight" class="body-tool-image" style="padding: 3px;">
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'link' }" @click="selectTool('link')"
              title="Link Tool - Click and drag to add hyperlinks or page links to the document">
              <i class="fa-solid fa-link"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'line' }" @click="selectTool('line')"
              title="Line Tool - Click and drag to draw straight lines. Hold Shift for horizontal/vertical lines">
              <i class="fa-solid fa-minus"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'freehand' }" @click="selectTool('freehand')"
              title="Freehand Tool - Click and drag to draw freehand lines and shapes">
              <i class="fa-solid fa-pencil"></i>
            </div>

            <div class="body-tool" :class="{ active: selectedTool === 'measure' }" @click="selectTool('measure')"
              title="Measurement Tool - Click two points to measure distance. Hold Shift for horizontal/vertical measurements">
              <i class="fa-solid fa-ruler"></i>
            </div>
          </div>

          <!-- Icon Tools Section -->
          <div class="icons-section">
            <div v-for="iconTool in iconTools" :key="iconTool.id" class="body-tool"
              :class="{ active: selectedTool === iconTool.id }" @click="selectTool(iconTool.id)"
              :title="iconTool.title">
              <img :src="iconTool.icon" :alt="iconTool.alt" class="body-tool-image">
            </div>
          </div>
        </div>
        
      <div ref="pdfViewContainer" id="body-pdf-view" class="body-pdf-view"
        :class="{ 'drawing-mode': selectedTool !== 'select', 'freehand-cursor': selectedTool === 'freehand' }">


        <!-- Placeholder content for when no PDF is loaded -->
        <div v-if="!isLoaded" class="pdf-placeholder">
          <div class="pdf-placeholder-content">
            <i class="fas fa-file-pdf pdf-placeholder-icon"></i>

            <p class="pdf-placeholder-text">
              Drag and drop a PDF file here to get started
            </p>
            <p class="pdf-placeholder-text-secondary">
              or use the <button @click="clickFileInput" class="btn"> <i class="fa-solid fa-folder-open mr-2"></i>
                Open
              </button> button above to browse for a file
            </p>
            <div class="pdf-placeholder-formats">
              <span class="pdf-placeholder-format">PDF files</span>
              <span class="pdf-placeholder-format ml-3">JSON config files</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  <!-- Toast Notification - Outside main container for better positioning -->
  <!-- Debug: Toast show state: {{ toast.show }} -->


  <!-- Dynamic toast -->
  <div v-if="toast.show"
    style="position: fixed; top: 80px; right: 20px; background: #4ade80; color: white; padding: 16px; border-radius: 8px; z-index: 99999; min-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
    @click="hideToast">
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>{{ toast.message }}</span>
      <button @click.stop="hideToast"
        style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick, watch } from 'vue'
import { PDFEditor } from './js/PDFEditor.js'
import ImageDialog from './components/ImageDialog.vue'
import LinkDialog from './components/LinkDialog.vue'
import { freehandDrawing } from './utils/FreehandDrawing.js'

export default {
  name: 'App',
  components: {
    ImageDialog,
    LinkDialog
  },
  setup() {
    console.log('Vue setup() function called - this means Vue is working');
    
    const pdfViewContainer = ref(null);
    const file = ref(null);
    const configFile = ref(null);
    let pdfEditor = null;
    const selectedOperation = ref(null);
    const counter = ref(0);
    const zoomLevel = ref(1.5);
    const selectedTool = ref('select');

    // Icon cache for base64 encoded SVGs
    const iconCache = ref({});

    // Define icon tools array for dynamic rendering
    const iconTools = ref([
      {
        id: 'tick',
        title: 'Tick Tool - Click to add checkmark icons to the document',
        icon: '/images/tick.svg',
        alt: 'svg-tick'
      },
      {
        id: 'cross',
        title: 'Cross Tool - Click to add cross/X mark icons to the document',
        icon: '/images/cross.svg',
        alt: 'svg-cross'
      },
      {
        id: 'star',
        title: 'Star Tool - Click to add star icons to the document',
        icon: '/images/star.svg',
        alt: 'svg-star'
      },
      {
        id: 'thumb-up',
        title: 'Thumbs Up Tool - Click to add thumbs up icons to the document',
        icon: '/images/thumb-up.svg',
        alt: 'svg-thumb-up'
      },
      {
        id: 'thumb-down',
        title: 'Thumbs Down Tool - Click to add thumbs down icons to the document',
        icon: '/images/thumb-down.svg',
        alt: 'svg-thumb-down'
      },
      {
        id: 'love',
        title: 'Heart Tool - Click to add heart icons to the document',
        icon: '/images/love.svg',
        alt: 'svg-love'
      }
    ]);

    // Drawing state
    const isDrawing = ref(false);
    const drawingStart = ref({ x: 0, y: 0 });
    const drawingCurrent = ref({ x: 0, y: 0 });
    let drawingOverlay = null;

    // Freehand drawing state
    const freehandPath = ref([]);
    let lastDrawTime = 0;
    const drawThrottleMs = 16; // ~60fps

    // Freehand tool options
    const freehandOptions = ref({
      smoothLevel: 5,
      color: '#000000',
      width: 2
    });

    // Line tool options
    const lineOptions = ref({
      color: '#000000',
      width: 2,
      opacity: 1.0
    });

    // Shape tool options
    const shapeOptions = ref({
      fill: 'transparent',
      borderColor: '#000000',
      borderWidth: 2,
      opacity: 1.0
    });

    // Highlight tool options
    const highlightOptions = ref({
      fill: '#FFFF00',
      opacity: 0.5
    });

    // Text tool options
    const textOptions = ref({
      fontFamily: 'Helvetica',
      fontSize: 12,
      color: '#000000',
      opacity: 1.0
    });

    // Icon tool options
    const iconOptions = ref({
      fillColor: '#000000',
      opacity: 1.0,
      size: 25
    });

    // Link tool options
    const linkOptions = ref({
      fill: '#a5edff',
      borderColor: '#007acc',
      borderWidth: 1,
      opacity: 0.2
    });

    // Measurement state
    const measurementState = ref({
      isActive: false,
      firstPoint: null,
      currentPoint: null,
      measurements: [], // Array of finalized measurements
      liveMeasurement: null // Current live measurement being drawn
    });

    // Image dialog state - simplified
    const showImageDialog = ref(false);
    const pendingImageData = ref(null);

    // Link dialog state
    const showLinkDialog = ref(false);
    const pendingLinkData = ref(null);

    // Config dropdown state
    const showConfigDropdown = ref(false);

    // Toast notification state
    const toast = ref({
      show: false,
      message: '',
      type: 'success', // 'success', 'error', 'info', 'warning'
      timeout: null
    });

    // PDF loaded state
    const isLoaded = ref(false);

    // Image dialog functions - simplified
    const openImageDialog = (page, id, x, y, width, height) => {
      pendingImageData.value = { page, id, x, y, width, height };
      showImageDialog.value = true;
    };

    const handleImageConfirm = (imageDataUrl) => {
      if (!pendingImageData.value) return;
      
      const { page, id, x, y, width, height } = pendingImageData.value;
      
      // Create image component with base64 data
      const component = page.createComponentWithDimensions(
        'image',
        { url: imageDataUrl },
        id,
        x,
        y,
        width,
        height
      );
      
      //if (component) {
      //  component.setSelected(true);
      //}
      
      pendingImageData.value = null;
    };

    const closeImageDialog = () => {
      showImageDialog.value = false;
      pendingImageData.value = null;
    };

    // Link dialog functions
    const openLinkDialog = (page, id, x, y, width, height) => {
      pendingLinkData.value = { page, id, x, y, width, height };
      showLinkDialog.value = true;
    };

    const handleLinkConfirm = ({type, value}) => {
      console.log(`handleLinkConfirm`);
      if (!pendingLinkData.value) return;
      
      const { page, id, x, y, width, height } = pendingLinkData.value;
      
      // Create link component
      const component = page.createComponentWithDimensions(
        'link',
        { 
          linkType: type,
          linkValue: value,
          fill: linkOptions.value.fill,
          borderColor: linkOptions.value.borderColor,
          borderWidth: linkOptions.value.borderWidth,
          opacity: linkOptions.value.opacity
        },
        id,
        x,
        y,
        width,
        height
      );
      
      pendingLinkData.value = null;
    };

    const closeLinkDialog = () => {
      showLinkDialog.value = false;
      pendingLinkData.value = null;
    };

    // Config dropdown functions
    const toggleConfigDropdown = () => {
      showConfigDropdown.value = !showConfigDropdown.value;
    };

    const closeConfigDropdown = () => {
      showConfigDropdown.value = false;
    };

    // Toast functions
    const showToast = (message, type = 'success', duration = 2000) => {
      console.log('showToast called:', { message, type, duration });
      
      // Clear existing timeout
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
      }

      toast.value.message = message;
      toast.value.type = type;
      toast.value.show = true;

      console.log('Toast state after setting:', toast.value);

      // Auto-hide after duration
      toast.value.timeout = setTimeout(() => {
        hideToast();
      }, duration);
    };

    const hideToast = () => {
      toast.value.show = false;
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
        toast.value.timeout = null;
      }
    };

    // Function to clear PDF pages while preserving other content (toolbar, placeholder)
    const clearPdfPages = () => {
      if (pdfViewContainer.value) {
        const pdfPages = pdfViewContainer.value.querySelectorAll('.pdf-page');
        pdfPages.forEach(page => page.remove());
      }
      isLoaded.value = false;
    };

    const clickFileInput = () => {
      console.log('clickFileInput called');
      file.value.click();
    }

    const selectTool = (tool) => {
      selectedTool.value = tool;
      
      // Clear all component selections when switching tools
      selectedOperation.value = null;
      
      // Clear measurements when switching away from measurement tool
      if (tool !== 'measure' && measurementState.value.isActive) {
        // Remove live measurement if switching away from measure tool
        document.querySelectorAll('.measurement-overlay.live').forEach(overlay => {
          overlay.remove();
        });
        measurementState.value.isActive = false;
        measurementState.value.firstPoint = null;
        measurementState.value.currentPoint = null;
      }
      
      // Dispatch event to clear all component selections
      const clearEvent = new CustomEvent('pdfeditor.shouldClearAllSelection', {
        detail: { target: null },
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(clearEvent);
      
      console.log('Selected tool:', tool);
    }

    const getToolSettings = (tool) => {
      // Check if the tool is an icon tool from the dynamic array
      const iconTool = iconTools.value.find(iconTool => iconTool.id === tool);
      if (iconTool) {
        return {
          subType: 'icon', 
          url: getColoredIcon(iconTool.id, iconOptions.value.fillColor),
          opacity: iconOptions.value.opacity
        };
      }
      
      const toolSettings = {
        'highlight': { 
          subType: 'highlight',
          fill: highlightOptions.value.fill,
          opacity: highlightOptions.value.opacity
        },
        'white-out': { subType: 'white-out' },
        'freehand': { subType: 'freehand' },
        'line': { 
          subType: 'line',
          color: lineOptions.value.color,
          width: lineOptions.value.width,
          opacity: lineOptions.value.opacity
        },
        'text': {
          fontFamily: textOptions.value.fontFamily,
          fontSize: textOptions.value.fontSize,
          color: textOptions.value.color,
          opacity: textOptions.value.opacity
        },
        'circle': { 
          fill: shapeOptions.value.fill,
          borderColor: shapeOptions.value.borderColor,
          borderWidth: shapeOptions.value.borderWidth,
          opacity: shapeOptions.value.opacity
        },
        'rectangle': { 
          fill: shapeOptions.value.fill,
          borderColor: shapeOptions.value.borderColor,
          borderWidth: shapeOptions.value.borderWidth,
          opacity: shapeOptions.value.opacity
        },
        'link': {
          fill: linkOptions.value.fill,
          borderColor: linkOptions.value.borderColor,
          borderWidth: linkOptions.value.borderWidth,
          opacity: linkOptions.value.opacity
        }
      };
      return toolSettings[tool] || {};
    }

    const getToolType = (tool) => {
      // Check if the tool is an icon tool from the dynamic array
      if (iconTools.value.some(iconTool => iconTool.id === tool)) {
        return 'image';
      }
      
      const toolTypeMap = {
        'text': 'text',
        'image': 'image',
        'rectangle': 'rectangle',
        'circle': 'circle',
        'highlight': 'rectangle',
        'white-out': 'rectangle',
        'freehand': 'image',
        'line': 'image',
        'textfield': 'textfield',
        'checkbox': 'checkbox',
        'link': 'link'
      };
      return toolTypeMap[tool] || tool;
    }

    const createDrawingOverlay = () => {
      if (drawingOverlay) {
        drawingOverlay.remove();
      }
      
      drawingOverlay = document.createElement('div');
      drawingOverlay.className = 'drawing-overlay';
      
      return drawingOverlay;
    }

    const updateDrawingOverlay = (startX, startY, currentX, currentY, container, zoomFactor = 1) => {
      if (!drawingOverlay) return;
      
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      
      // Position overlay in the scaled coordinate system
      drawingOverlay.style.left = `${left}px`;
      drawingOverlay.style.top = `${top}px`;
      drawingOverlay.style.width = `${width}px`;
      drawingOverlay.style.height = `${height}px`;
    }

    const setupCanvasDrawingListeners = () => {
      if (!pdfEditor) return;
      
      pdfEditor.pdfPages.forEach(page => {
        const canvas = page.canvas;
        const container = page.container;
        
        // Remove old drag and drop listeners
        canvas.removeEventListener("dragenter", page.dragEnter);
        canvas.removeEventListener("dragover", page.dragOver);
        canvas.removeEventListener("drop", page.dragDrop);
        
        // Add drawing listeners to both canvas and container
        const addDrawingListeners = (element) => {
          element.addEventListener("mousedown", (event) => {
            console.log(`mouse down`);
            
            // Check if click is on a moveable control or delete button
            if (event.target.closest('.moveable-control') || 
                event.target.closest('.moveable-delete-button') ||
                event.target.closest('.moveable-delete-container') ||
                event.target.classList.contains('moveable-control') ||
                event.target.classList.contains('moveable-delete-button')) {
              return; // Don't handle drawing events for moveable controls
            }
            
            if (selectedTool.value === 'select') {
              // Default selection behavior - only handle on canvas
              if (element === canvas) {
                event.stopPropagation();
                page.setSelected();
              }
              return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            
            isDrawing.value = true;
            const rect = container.getBoundingClientRect();
            
            // Account for zoom level when calculating coordinates
            const zoomFactor = zoomLevel.value;
            const rawX = event.clientX - rect.left;
            const rawY = event.clientY - rect.top;
            
            drawingStart.value = {
              x: rawX / zoomFactor,
              y: rawY / zoomFactor
            };
            drawingCurrent.value = { ...drawingStart.value };
            
            // For icon tools, create component immediately with default size
            if (iconTools.value.some(tool => tool.id === selectedTool.value)) {
              const id = Math.random().toString(36).substring(2, 11);
              const toolType = getToolType(selectedTool.value);
              const settings = getToolSettings(selectedTool.value);
              
              // Center the icon on the cursor position
              const iconSize = iconOptions.value.size;
              const centeredX = drawingStart.value.x - (iconSize / 2);
              const centeredY = drawingStart.value.y - (iconSize / 2);
              
              const component = page.createComponentWithDimensions(toolType, settings, id, centeredX, centeredY, iconSize, iconSize);
              //if (component) {
              //  component.setSelected(true);
              //}
              isDrawing.value = false;
              return;
            }
            
            // For text tool, create component immediately and focus for editing
            if (selectedTool.value === 'text') {
              // Check if component creation is temporarily prevented (e.g., after deletion)
              if (window.preventComponentCreation) {
                isDrawing.value = false;
                return;
              }
              
              const id = Math.random().toString(36).substring(2, 11);
              const toolType = getToolType(selectedTool.value);
              const settings = getToolSettings(selectedTool.value);
              
              // Create text component with minimal initial size (will auto-resize)
              const component = page.createComponentWithDimensions(
                toolType, 
                settings, 
                id, 
                drawingStart.value.x, 
                drawingStart.value.y, 
                20, // Minimal initial width
                20  // Minimal initial height
              );
              
              if (component) {
                // Set selected and trigger edit mode
                component.setSelected(true);
                
                // Focus the text element for immediate editing
                setTimeout(() => {
                  const textElement = component.shadow;
                  if (textElement) {
                    textElement.contentEditable = true;
                    textElement.focus();
                    // Select all text for easy replacement
                    const range = document.createRange();
                    range.selectNodeContents(textElement);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                }, 10);
              }
              
              isDrawing.value = false;
              return;
            }
            
            // For freehand drawing, set up canvas and start path
            if (selectedTool.value === 'freehand') {
              freehandPath.value = [{ x: drawingStart.value.x, y: drawingStart.value.y }];
              
              // Create freehand canvas using utility
              freehandDrawing.createCanvas(container, {
                zoomFactor,
                color: freehandOptions.value.color,
                width: freehandOptions.value.width
              });
              
              // Start drawing path
              freehandDrawing.startPath(drawingStart.value.x, drawingStart.value.y);
              return;
            }

            // For line drawing, set up canvas and start line
            if (selectedTool.value === 'line') {
              freehandPath.value = [{ x: drawingStart.value.x, y: drawingStart.value.y }];
              
              // Create line canvas using utility
              freehandDrawing.createCanvas(container, {
                zoomFactor,
                color: lineOptions.value.color,
                width: lineOptions.value.width
              });
              
              // Start drawing line
              freehandDrawing.startPath(drawingStart.value.x, drawingStart.value.y);
              return;
            }

            // For measurement tool
            if (selectedTool.value === 'measure') {
              if (!measurementState.value.isActive) {
                // First click - start measurement
                measurementState.value.isActive = true;
                measurementState.value.firstPoint = { ...drawingStart.value };
                measurementState.value.currentPoint = { ...drawingStart.value };
              } else {
                // Second click - finalize measurement
                let finalPoint = { ...drawingStart.value };
                
                // If Shift is held, constrain to horizontal or vertical measurement
                if (event.shiftKey) {
                  const deltaX = Math.abs(finalPoint.x - measurementState.value.firstPoint.x);
                  const deltaY = Math.abs(finalPoint.y - measurementState.value.firstPoint.y);
                  
                  // Choose direction based on which axis has greater movement
                  if (deltaX > deltaY) {
                    // Make horizontal measurement
                    finalPoint.y = measurementState.value.firstPoint.y;
                  } else {
                    // Make vertical measurement
                    finalPoint.x = measurementState.value.firstPoint.x;
                  }
                }
                
                // Remove live measurement
                document.querySelectorAll('.measurement-overlay.live').forEach(overlay => {
                  overlay.remove();
                });
                
                // Add final measurement
                const finalMeasurement = addMeasurementOverlay(
                  measurementState.value.firstPoint,
                  finalPoint,
                  container,
                  false
                );
                
                // Store measurement
                measurementState.value.measurements.push({
                  start: measurementState.value.firstPoint,
                  end: finalPoint,
                  elements: finalMeasurement
                });
                
                // Reset measurement state
                measurementState.value.isActive = false;
                measurementState.value.firstPoint = null;
                measurementState.value.currentPoint = null;
              }
              
              isDrawing.value = false;
              return;
            }
            
            // Create and add drawing overlay for other tools
            createDrawingOverlay();
            container.appendChild(drawingOverlay);
            updateDrawingOverlay(
              drawingStart.value.x, 
              drawingStart.value.y, 
              drawingCurrent.value.x, 
              drawingCurrent.value.y,
              container,
              zoomFactor
            );
          });
          
          element.addEventListener("mousemove", (event) => {
            if (!isDrawing.value || selectedTool.value === 'select') return;
            
            event.preventDefault();
            const rect = container.getBoundingClientRect();
            
            // Account for zoom level when calculating coordinates
            const zoomFactor = zoomLevel.value;
            const rawX = event.clientX - rect.left;
            const rawY = event.clientY - rect.top;
            
            drawingCurrent.value = {
              x: rawX / zoomFactor,
              y: rawY / zoomFactor
            };
            
            // Handle freehand drawing
            if (selectedTool.value === 'freehand') {
              freehandPath.value.push({ x: drawingCurrent.value.x, y: drawingCurrent.value.y });
              freehandDrawing.addPoint(drawingCurrent.value.x, drawingCurrent.value.y);
              
              // Throttle drawing for better performance
              const now = Date.now();
              if (now - lastDrawTime >= drawThrottleMs) {
                freehandDrawing.clearCanvas();
                freehandDrawing.drawPath(freehandPath.value, {
                  isRealTime: true,
                  smoothLevel: freehandOptions.value.smoothLevel
                });
                lastDrawTime = now;
              }
              return;
            }

            // Handle line drawing (straight line from start to current point)
            if (selectedTool.value === 'line') {
              // For line tool, only use start and current points (straight line)
              let endX = drawingCurrent.value.x;
              let endY = drawingCurrent.value.y;
              
              // If Shift is held, constrain to horizontal or vertical line
              if (event.shiftKey) {
                const deltaX = Math.abs(endX - drawingStart.value.x);
                const deltaY = Math.abs(endY - drawingStart.value.y);
                
                // Choose direction based on which axis has greater movement
                if (deltaX > deltaY) {
                  // Make horizontal line
                  endY = drawingStart.value.y;
                } else {
                  // Make vertical line
                  endX = drawingStart.value.x;
                }
              }
              
              const linePath = [
                { x: drawingStart.value.x, y: drawingStart.value.y },
                { x: endX, y: endY }
              ];
              
              // Throttle drawing for better performance
              const now = Date.now();
              if (now - lastDrawTime >= drawThrottleMs) {
                freehandDrawing.clearCanvas();
                freehandDrawing.drawPath(linePath, {
                  isRealTime: true,
                  smoothLevel: 1 // No smoothing for straight lines
                });
                lastDrawTime = now;
              }
              return;
            }

            // Handle measurement tool live preview
            if (selectedTool.value === 'measure' && measurementState.value.isActive) {
              let currentPoint = { ...drawingCurrent.value };
              
              // If Shift is held, constrain to horizontal or vertical measurement
              if (event.shiftKey) {
                const deltaX = Math.abs(currentPoint.x - measurementState.value.firstPoint.x);
                const deltaY = Math.abs(currentPoint.y - measurementState.value.firstPoint.y);
                
                // Choose direction based on which axis has greater movement
                if (deltaX > deltaY) {
                  // Make horizontal measurement
                  currentPoint.y = measurementState.value.firstPoint.y;
                } else {
                  // Make vertical measurement
                  currentPoint.x = measurementState.value.firstPoint.x;
                }
              }
              
              measurementState.value.currentPoint = currentPoint;
              
              // Show live measurement
              addMeasurementOverlay(
                measurementState.value.firstPoint,
                measurementState.value.currentPoint,
                container,
                true
              );
              return;
            }
            
            updateDrawingOverlay(
              drawingStart.value.x, 
              drawingStart.value.y, 
              drawingCurrent.value.x, 
              drawingCurrent.value.y,
              container,
              zoomFactor
            );
          });
          
          // Add separate mousemove listener for measurement tool when not drawing
          element.addEventListener("mousemove", (event) => {
            // Only handle measurement tool when active but not drawing
            if (selectedTool.value === 'measure' && measurementState.value.isActive && !isDrawing.value) {
              const rect = container.getBoundingClientRect();
              const zoomFactor = zoomLevel.value;
              const rawX = event.clientX - rect.left;
              const rawY = event.clientY - rect.top;
              
              let currentPoint = {
                x: rawX / zoomFactor,
                y: rawY / zoomFactor
              };
              
              // If Shift is held, constrain to horizontal or vertical measurement
              if (event.shiftKey) {
                const deltaX = Math.abs(currentPoint.x - measurementState.value.firstPoint.x);
                const deltaY = Math.abs(currentPoint.y - measurementState.value.firstPoint.y);
                
                // Choose direction based on which axis has greater movement
                if (deltaX > deltaY) {
                  // Make horizontal measurement
                  currentPoint.y = measurementState.value.firstPoint.y;
                } else {
                  // Make vertical measurement
                  currentPoint.x = measurementState.value.firstPoint.x;
                }
              }
              
              measurementState.value.currentPoint = currentPoint;
              
              // Show live measurement
              addMeasurementOverlay(
                measurementState.value.firstPoint,
                measurementState.value.currentPoint,
                container,
                true
              );
            }
          });
          
          element.addEventListener("mouseup", (event) => {
            if (!isDrawing.value || selectedTool.value === 'select') return;
            
            event.preventDefault();
            event.stopPropagation();
            
            // Handle freehand drawing completion
            if (selectedTool.value === 'freehand' && freehandPath.value.length > 1) {
              // Convert path to SVG data URL using utility
              const svgDataUrl = freehandDrawing.pathToSvgDataUrl(freehandPath.value, {
                color: freehandOptions.value.color,
                width: freehandOptions.value.width,
                smoothLevel: freehandOptions.value.smoothLevel
              });
              
              if (svgDataUrl) {
                // Calculate bounding box using utility
                const boundingBox = freehandDrawing.calculateBoundingBox(
                  freehandPath.value, 
                  freehandOptions.value.width
                );
                
                if (boundingBox) {
                  const id = Math.random().toString(36).substring(2, 11);
                  const component = page.createComponentWithDimensions(
                    'image', 
                    { subType: 'freehand', url: svgDataUrl }, 
                    id, 
                    boundingBox.x, 
                    boundingBox.y, 
                    boundingBox.width, 
                    boundingBox.height
                  );
                  
                  if (component) {
                    component.setSelected(true);
                  }
                }
              }
              
              // Clean up freehand drawing
              freehandDrawing.cleanup();
              freehandPath.value = [];
              isDrawing.value = false;
              return;
            }

            // Handle line drawing completion
            if (selectedTool.value === 'line') {
              // Create final line path with just start and end points
              let endX = drawingCurrent.value.x;
              let endY = drawingCurrent.value.y;
              
              // If Shift is held, constrain to horizontal or vertical line
              if (event.shiftKey) {
                const deltaX = Math.abs(endX - drawingStart.value.x);
                const deltaY = Math.abs(endY - drawingStart.value.y);
                
                // Choose direction based on which axis has greater movement
                if (deltaX > deltaY) {
                  // Make horizontal line
                  endY = drawingStart.value.y;
                } else {
                  // Make vertical line
                  endX = drawingStart.value.x;
                }
              }
              
              const linePath = [
                { x: drawingStart.value.x, y: drawingStart.value.y },
                { x: endX, y: endY }
              ];
              
              if (linePath.length === 2) {
                // Convert line to SVG data URL using utility
                const svgDataUrl = freehandDrawing.pathToSvgDataUrl(linePath, {
                  color: lineOptions.value.color,
                  width: lineOptions.value.width,
                  smoothLevel: 1 // No smoothing for straight lines
                });
                
                if (svgDataUrl) {
                  // Calculate bounding box using utility
                  const boundingBox = freehandDrawing.calculateBoundingBox(
                    linePath, 
                    lineOptions.value.width
                  );
                  
                  if (boundingBox) {
                    const id = Math.random().toString(36).substring(2, 11);
                    const component = page.createComponentWithDimensions(
                      'image', 
                      { subType: 'line', url: svgDataUrl }, 
                      id, 
                      boundingBox.x, 
                      boundingBox.y, 
                      boundingBox.width, 
                      boundingBox.height
                    );
                    
                    if (component) {
                      component.setSelected(true);
                    }
                  }
                }
              }
              
              // Clean up line drawing
              freehandDrawing.cleanup();
              freehandPath.value = [];
              isDrawing.value = false;
              return;
            }
            
            // Remove drawing overlay
            if (drawingOverlay) {
              drawingOverlay.remove();
              drawingOverlay = null;
            }
            
            // Calculate final dimensions (already adjusted for zoom)
            const x = Math.min(drawingStart.value.x, drawingCurrent.value.x);
            const y = Math.min(drawingStart.value.y, drawingCurrent.value.y);
            const width = Math.abs(drawingCurrent.value.x - drawingStart.value.x);
            const height = Math.abs(drawingCurrent.value.y - drawingStart.value.y);
            
            // Only create component if there's a meaningful size
            if (width > 5 && height > 5) {
              const id = Math.random().toString(36).substring(2, 11);
              const toolType = getToolType(selectedTool.value);
              const settings = getToolSettings(selectedTool.value);
              
              // Special handling for image tool - show dialog
              if (selectedTool.value === 'image') {
                openImageDialog(page, id, x, y, width, height);
              } else if (selectedTool.value === 'link') {
                // Special handling for link tool - show dialog
                openLinkDialog(page, id, x, y, width, height);
              } else {
                // Create component with calculated dimensions for other tools
                const component = page.createComponentWithDimensions(toolType, settings, id, x, y, width, height);
                if (component) {
                  component.setSelected(true);
                }
              }
            }
            
            isDrawing.value = false;
          });
          
          // Handle mouse leave to cancel drawing
          element.addEventListener("mouseleave", (event) => {
            if (isDrawing.value) {
              if (drawingOverlay) {
                drawingOverlay.remove();
                drawingOverlay = null;
              }
              
              // Clean up freehand drawing
              freehandDrawing.cleanup();
              freehandPath.value = [];
              
              isDrawing.value = false;
            }
          });
        };
        
        // Add listeners to both canvas and container
        addDrawingListeners(canvas);
        addDrawingListeners(container);
      });
    }

    const handleFileUpload = () => {
      console.log('handleFileUpload called');
      const rfile = file.value.files[0];
      processFile(rfile);
    }

    const processFile = (fileToProcess) => {
      if (!fileToProcess) {
        console.log('No file provided');
        return;
      }

      // Check if it's a PDF file
      if (fileToProcess.type !== 'application/pdf' && !fileToProcess.name.toLowerCase().endsWith('.pdf')) {
        showToast('Please select a PDF file.', 'warning');
        return;
      }

      const reader = new FileReader();

      reader.onload = async(e) => {
        if (pdfEditor) {
          // Clear PDF pages before loading new PDF
          clearPdfPages();
          isLoaded.value = true;
          await pdfEditor.renderPDF("", e.target.result).then(() => {
              pdfEditor.applyZoom(zoomLevel.value);
              // Setup drawing listeners after PDF is rendered
              setupCanvasDrawingListeners();
              // Update toolbar position after PDF is loaded
              setTimeout(() => {
                updateToolbarPosition();
              }, 100);
              isLoaded.value = true;
              showToast('File loaded', 'success');
          });
          

        } else {
          console.error('PDFEditor not initialized yet');
        }
      };

      reader.readAsBinaryString(fileToProcess); 
    }

    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.add('drag-over');
    }

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    }

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Only remove drag-over class if we're leaving the document entirely
      if (e.clientX === 0 && e.clientY === 0) {
        document.body.classList.remove('drag-over');
      }
    }

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove('drag-over');

      const files = Array.from(e.dataTransfer.files);
      const pdfFile = files.find(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      const jsonFile = files.find(file => 
        file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')
      );

      if (pdfFile) {
        console.log('PDF file dropped:', pdfFile.name);
        processFile(pdfFile);
      } else if (jsonFile) {
        console.log('JSON config file dropped:', jsonFile.name);
        processConfigFile(jsonFile);
      } else if (files.length > 0) {
        showToast('Please drop a PDF file or JSON config file.', 'warning');
      }
    }

    const downloadPDF = async() => {
      console.log('downloadPDF called');
      if (pdfEditor) {
        let pdfBytes = await pdfEditor.downloadPDF();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `modified_pdf.pdf`;
        link.click();
      } else {
        console.error('PDFEditor not initialized yet');
      }
    }

    const downloadConfig = () => {
      console.log('downloadConfig called');
      if (!pdfEditor || !pdfEditor.fileContents) {
        console.error('No PDF loaded or PDFEditor not initialized');
        return;
      }

      try {
        // Convert PDF binary string to base64 with proper data URL prefix
        const pdfBase64 = btoa(pdfEditor.fileContents);
        const pdfURL = `data:application/pdf;base64,${pdfBase64}`;
        
        // Get all page operations
        const pages = pdfEditor.pdfPages.map((page) => ({
          pageNumber: page.pageNumber,
          operations: page.getOperations()
        }));

        // Create config object
        const config = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          pdfURL: pdfURL,
          pages: pages
        };

        // Create and download JSON file
        const jsonString = JSON.stringify(config, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pdf-config-${new Date().toISOString().split('T')[0]}-pdfso.json`;
        link.click();
        
        console.log('Config downloaded successfully');
        showToast('Configuration exported successfully!', 'success');
      } catch (error) {
        console.error('Error creating config file:', error);
        showToast('Error creating config file. Please try again.', 'error');
      }
    }

    const clickRestoreConfigInput = () => {
      console.log('clickRestoreConfigInput called');
      configFile.value.click();
    }

    const processConfigFile = async (configFileToProcess) => {
      if (!configFileToProcess) {
        console.log('No config file provided');
        return;
      }

      // Check if it's a JSON file
      if (configFileToProcess.type !== 'application/json' && !configFileToProcess.name.toLowerCase().endsWith('.json')) {
        showToast('Please select a JSON config file.', 'warning');
        return;
      }

      try {
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(configFileToProcess);
        });

        const config = JSON.parse(fileContent);
        
        // Validate config structure
        if (!config.pdfURL || !config.pages) {
          throw new Error('Invalid config file format');
        }

        console.log('Config loaded:', config);

        // Clear PDF pages before loading new PDF
        clearPdfPages();

        // Handle PDF data - check if it's a base64 data URL or regular URL
        let pdfData;
        if (config.pdfURL.startsWith('data:application/pdf;base64,')) {
          // Extract base64 data and convert to binary string
          const base64Data = config.pdfURL.replace('data:application/pdf;base64,', '');
          pdfData = atob(base64Data);
        } else {
          // It's a regular URL, we'll pass it as is
          pdfData = config.pdfURL;
        }

        // Load the PDF
        if (pdfEditor) {
          await pdfEditor.renderPDF("", pdfData);
          isLoaded.value = true;
          
          // Restore operations for each page
          config.pages.forEach((pageConfig, index) => {
            if (pdfEditor.pdfPages[index]) {
              const page = pdfEditor.pdfPages[index];
              
              // Create components for each operation
              pageConfig.operations.forEach((operation) => {
                try {
                  const component = page.createComponentWithDimensions(
                    operation.type,
                    operation,
                    operation.id || operation.identifier,
                    operation.x,
                    operation.y,
                    operation.width,
                    operation.height
                  );
                  
                  if (component) {
                    // Update all operation properties
                    Object.keys(operation).forEach(key => {
                      if (component.operation[key] !== undefined) {
                        component.operation[key] = operation[key];
                      }
                    });
                    
                    // Trigger operation changed to update visual appearance
                    if (component.operationChanged) {
                      Object.keys(operation).forEach(key => {
                        component.operationChanged(key, operation[key]);
                      });
                    }
                  }
                } catch (operationError) {
                  console.error('Error restoring operation:', operation, operationError);
                }
              });
            }
          });

          // Apply current zoom level and setup drawing listeners
          pdfEditor.applyZoom(zoomLevel.value);
          setupCanvasDrawingListeners();
          // Update toolbar position after config restoration
          setTimeout(() => {
            updateToolbarPosition();
          }, 100);
          
          console.log('Config restored successfully from dropped file');
          showToast('Configuration restored successfully!', 'success');
        }
        
      } catch (error) {
        console.error('Error restoring config from dropped file:', error);
        showToast('Error restoring configuration. Please check the file format.', 'error');
      }
    }

    const handleConfigRestore = async () => {
      console.log('handleConfigRestore called');
      const configFileInput = configFile.value.files[0];
      
      if (!configFileInput) {
        console.log('No config file selected');
        return;
      }

      try {
        const fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(configFileInput);
        });

        const config = JSON.parse(fileContent);
        
        // Validate config structure
        if (!config.pdfURL || !config.pages) {
          throw new Error('Invalid config file format');
        }

        console.log('Config loaded:', config);

        // Clear PDF pages before loading new PDF
        clearPdfPages();

        // Handle PDF data - check if it's a base64 data URL or regular URL
        let pdfData;
        if (config.pdfURL.startsWith('data:application/pdf;base64,')) {
          // Extract base64 data and convert to binary string
          const base64Data = config.pdfURL.replace('data:application/pdf;base64,', '');
          pdfData = atob(base64Data);
        } else {
          // It's a regular URL, we'll pass it as is
          pdfData = config.pdfURL;
        }

        // Load the PDF
        if (pdfEditor) {
          await pdfEditor.renderPDF("", pdfData);
          isLoaded.value = true;
          
          // Restore operations for each page
          config.pages.forEach((pageConfig, index) => {
            if (pdfEditor.pdfPages[index]) {
              const page = pdfEditor.pdfPages[index];
              
              // Create components for each operation
              pageConfig.operations.forEach((operation) => {
                try {
                  const component = page.createComponentWithDimensions(
                    operation.type,
                    operation,
                    operation.id || operation.identifier,
                    operation.x,
                    operation.y,
                    operation.width,
                    operation.height
                  );
                  
                  if (component) {
                    // Update all operation properties
                    Object.keys(operation).forEach(key => {
                      if (component.operation[key] !== undefined) {
                        component.operation[key] = operation[key];
                      }
                    });
                    
                    // Trigger operation changed to update visual appearance
                    if (component.operationChanged) {
                      Object.keys(operation).forEach(key => {
                        component.operationChanged(key, operation[key]);
                      });
                    }
                  }
                } catch (operationError) {
                  console.error('Error restoring operation:', operation, operationError);
                }
              });
            }
          });

          // Apply current zoom level and setup drawing listeners
          pdfEditor.applyZoom(zoomLevel.value);
          setupCanvasDrawingListeners();
          // Update toolbar position after config restoration
          setTimeout(() => {
            updateToolbarPosition();
          }, 100);
          
          console.log('Config restored successfully');
          showToast('Configuration restored successfully!', 'success');
        }
        
      } catch (error) {
        console.error('Error restoring config:', error);
        showToast('Error restoring configuration. Please check the file format.', 'error');
      }
    }

    const uploadPropertyPanel = (e) => {
      selectedOperation.value = e.detail.target.getOperation();
    }

    const clearPropertyPanel = () => {
      selectedOperation.value = null;
    }

    const updateToolbarPosition = () => {
      const toolbar = document.querySelector('.floating-toolbar');
      if (!toolbar || !pdfEditor || !pdfEditor.pdfPages.length) return;
      
      // Get the first PDF page to calculate positioning
      const firstPage = pdfEditor.pdfPages[0];
      if (!firstPage || !firstPage.container) return;
      
      // Get the PDF view container
      const pdfViewContainer = document.querySelector('.body-pdf-view');
      if (!pdfViewContainer) return;
      
      // Skip if on mobile (toolbar positioning handled by CSS on mobile)
      if (window.innerWidth <= 768) {
        toolbar.style.left = ''; // Clear any JavaScript-set positioning
        return;
      }
      
      // Calculate the PDF page position with current zoom
      const pdfPageRect = firstPage.container.getBoundingClientRect();
      const viewContainerRect = pdfViewContainer.getBoundingClientRect();
      
      // Calculate the left edge of the PDF page relative to the view container
      const pdfPageLeft = pdfPageRect.left - viewContainerRect.left;
      
      // Position toolbar 20px to the left of the PDF page
      const toolbarWidth = 54; // Toolbar width
      const spacing = 20; // Desired spacing from PDF page
      const minLeftPosition = 20; // Minimum distance from left edge
      
      const desiredLeft = pdfPageLeft - toolbarWidth - spacing;
      const toolbarLeft = Math.max(minLeftPosition, desiredLeft);
      
      // Only update if position has changed significantly (avoid unnecessary updates)
      const currentLeft = parseInt(toolbar.style.left) || 20;
      if (Math.abs(currentLeft - toolbarLeft) > 5) {
        toolbar.style.left = `${toolbarLeft}px`;
      }
    }

    const applyZoom = () => {
      console.log('applyZoom called with zoomLevel:', zoomLevel.value);
      if (pdfEditor) {
        pdfEditor.applyZoom(zoomLevel.value);
        // Update toolbar position after zoom is applied
        setTimeout(() => {
          updateToolbarPosition();
        }, 100); // Small delay to ensure zoom has been applied
      } else {
        console.error('PDFEditor not initialized yet');
      }
    }

    // Update freehand canvas style when options change
    const updateFreehandOptions = () => {
      freehandDrawing.updateCanvasStyle({
        color: freehandOptions.value.color,
        width: freehandOptions.value.width
      });
    }

    // Watch for changes in freehand options
    watch(() => [freehandOptions.value.color, freehandOptions.value.width], updateFreehandOptions);



    // SVG property helper functions
    const getSvgStrokeColor = (operation) => {
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return '#000000';
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        const svgString = atob(base64Data);
        
        // Extract stroke color from SVG
        const strokeMatch = svgString.match(/stroke="([^"]+)"/);
        return strokeMatch ? strokeMatch[1] : '#000000';
      } catch (error) {
        console.error('Error parsing SVG:', error);
        return '#000000';
      }
    }

    const getSvgStrokeWidth = (operation) => {
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return 2;
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        const svgString = atob(base64Data);
        
        // Extract stroke width from SVG
        const strokeWidthMatch = svgString.match(/stroke-width="([^"]+)"/);
        return strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : 2;
      } catch (error) {
        console.error('Error parsing SVG:', error);
        return 2;
      }
    }

    const updateSvgStrokeColor = (operation, newColor) => {
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return;
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        let svgString = atob(base64Data);
        
        // Update stroke color in SVG
        if (svgString.includes('stroke=')) {
          svgString = svgString.replace(/stroke="[^"]*"/g, `stroke="${newColor}"`);
        } else {
          // Add stroke attribute if it doesn't exist
          svgString = svgString.replace(/<path([^>]*)>/g, `<path$1 stroke="${newColor}">`);
        }
        
        // Re-encode to base64
        const newBase64 = btoa(svgString);
        operation.url = `data:image/svg+xml;base64,${newBase64}`;
        
        // Trigger visual update
        const event = new CustomEvent('pdfeditor.operationChanged', {
          detail: { operation, property: 'url' },
          bubbles: true
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating SVG stroke color:', error);
      }
    }

    const updateSvgStrokeWidth = (operation, newWidth) => {
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return;
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        let svgString = atob(base64Data);
        
        // Update stroke width in SVG
        if (svgString.includes('stroke-width=')) {
          svgString = svgString.replace(/stroke-width="[^"]*"/g, `stroke-width="${newWidth}"`);
        } else {
          // Add stroke-width attribute if it doesn't exist
          svgString = svgString.replace(/<path([^>]*)>/g, `<path$1 stroke-width="${newWidth}">`);
        }
        
        // Re-encode to base64
        const newBase64 = btoa(svgString);
        operation.url = `data:image/svg+xml;base64,${newBase64}`;
        
        // Trigger visual update
        const event = new CustomEvent('pdfeditor.operationChanged', {
          detail: { operation, property: 'url' },
          bubbles: true
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating SVG stroke width:', error);
      }
    }

    const getSvgFillColor = (operation) => {
      console.log('getSvgFillColor called with operation:', operation);
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return '#000000';
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        const svgString = atob(base64Data);
        
        // Extract fill color from SVG
        const fillMatch = svgString.match(/fill="([^"]+)"/);
        return fillMatch ? fillMatch[1] : '#000000';
      } catch (error) {
        console.error('Error parsing SVG:', error);
        return '#000000';
      }
    }

    const updateSvgFillColor = (operation, newColor) => {
      if (!operation.url || !operation.url.startsWith('data:image/svg+xml;base64,')) {
        return;
      }
      
      try {
        // Decode base64 SVG
        const base64Data = operation.url.replace('data:image/svg+xml;base64,', '');
        let svgString = atob(base64Data);
        
        // Update fill color in SVG
        if (svgString.includes('fill=')) {
          svgString = svgString.replace(/fill="[^"]*"/g, `fill="${newColor}"`);
        } else {
          // Add fill attribute if it doesn't exist
          svgString = svgString.replace(/<svg([^>]*)>/g, `<svg$1 fill="${newColor}">`);
        }
        
        // Re-encode to base64
        const newBase64 = btoa(svgString);
        operation.url = `data:image/svg+xml;base64,${newBase64}`;
        
        // Trigger visual update
        const event = new CustomEvent('pdfeditor.operationChanged', {
          detail: { operation, property: 'url' },
          bubbles: true
        });
        document.dispatchEvent(event);
      } catch (error) {
        console.error('Error updating SVG fill color:', error);
      }
    }

    onMounted(async () => {
      console.log(`onMounted - starting`);
      
      // Wait for DOM to be updated
      await nextTick();
      
      console.log('DOM has been updated, initializing PDFEditor...');
      console.log('Container element (ref):', pdfViewContainer.value);
      
      if (pdfViewContainer.value) {
        console.log('Creating PDFEditor with container:', pdfViewContainer.value);
        try {
          pdfEditor = new PDFEditor(pdfViewContainer.value);
          
          document.addEventListener('pdfeditor.componentSelected', uploadPropertyPanel);
          document.addEventListener('pdfeditor.componentDragging', uploadPropertyPanel);
          document.addEventListener('pdfeditor.componentResizing', uploadPropertyPanel);
          document.addEventListener('pdfeditor.shouldClearAllSelection', clearPropertyPanel);
          console.log('PDFEditor initialized successfully');
        } catch (error) {
          console.error('Error creating PDFEditor:', error);
        }
      } else {
        console.error('Could not find container element!');
        console.log('pdfViewContainer.value:', pdfViewContainer.value);
        console.log('Available elements:', document.querySelectorAll('.body-pdf-view'));
      }

      // Listen for file load from landing page
      window.addEventListener('loadPdfFromLanding', (event) => {
        const { fileData, fileName } = event.detail;
        if (pdfEditor && fileData) {
          // Convert data URL to binary string
          const base64Data = fileData.split(',')[1];
          const binaryString = atob(base64Data);
          
          clearPdfPages();
          isLoaded.value = true;
          pdfEditor.renderPDF("", binaryString).then(() => {
            pdfEditor.applyZoom(zoomLevel.value);
            setupCanvasDrawingListeners();
            setTimeout(() => {
              updateToolbarPosition();
            }, 100);
            isLoaded.value = true;
            showToast(`${fileName} loaded successfully`, 'success');
          });
        }
      });

      // Check for PDF file in sessionStorage (from landing page)
      const storedPdfFile = sessionStorage.getItem('pdfFile');
      const storedFileName = sessionStorage.getItem('pdfFileName');
      if (storedPdfFile && pdfEditor) {
        // Convert data URL to binary string
        const base64Data = storedPdfFile.split(',')[1];
        const binaryString = atob(base64Data);
        
        clearPdfPages();
        isLoaded.value = true;
        pdfEditor.renderPDF("", binaryString).then(() => {
          pdfEditor.applyZoom(zoomLevel.value);
          setupCanvasDrawingListeners();
          setTimeout(() => {
            updateToolbarPosition();
          }, 100);
          isLoaded.value = true;
          showToast(`${storedFileName} loaded successfully`, 'success');
        });
        
        // Clear from sessionStorage after loading
        sessionStorage.removeItem('pdfFile');
        sessionStorage.removeItem('pdfFileName');
      }

      // Setup dynamic tooltip positioning
      setupTooltipPositioning();

      // Setup click outside listener for dropdown
      document.addEventListener('click', (event) => {
        const dropdown = event.target.closest('.dropdown');
        if (!dropdown && showConfigDropdown.value) {
          showConfigDropdown.value = false;
        }
      });

      // Setup drag and drop for PDF files
      document.addEventListener('dragenter', handleDragEnter);
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('drop', handleDrop);

      // Load and cache icon SVGs at startup
      await loadIconCache();

      // Setup window resize listener to update toolbar position
      window.addEventListener('resize', () => {
        setTimeout(() => {
          updateToolbarPosition();
        }, 100);
      });
    });

    const setupTooltipPositioning = () => {
      // Wait for DOM to be ready
      nextTick(() => {
        // Handle toolbar buttons (positioned to the right)
        const toolButtons = document.querySelectorAll('.body-tool[title]');
        
        toolButtons.forEach(button => {
          // Remove default title to prevent browser tooltip
          const tooltipText = button.getAttribute('title');
          button.removeAttribute('title');
          button.setAttribute('data-tooltip', tooltipText);
          
          button.addEventListener('mouseenter', (e) => {
            showCustomTooltip(e.target, tooltipText, 'right');
          });
          
          button.addEventListener('mouseleave', (e) => {
            hideCustomTooltip();
          });
        });

        // Handle top bar buttons (positioned below)
        const topBarButtons = document.querySelectorAll('.header-actions .btn[title], .element-container .btn[title], .element-container select[title], .dropdown-item[title]');
        
        topBarButtons.forEach(button => {
          // Remove default title to prevent browser tooltip
          const tooltipText = button.getAttribute('title');
          button.removeAttribute('title');
          button.setAttribute('data-tooltip', tooltipText);
          
          button.addEventListener('mouseenter', (e) => {
            showCustomTooltip(e.target, tooltipText, 'below');
          });
          
          button.addEventListener('mouseleave', (e) => {
            hideCustomTooltip();
          });
        });
      });
    }

    const showCustomTooltip = (element, text, position = 'right') => {
      // Remove any existing tooltip
      hideCustomTooltip();
      
      // Create tooltip element
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.textContent = text;
      tooltip.id = 'active-tooltip';
      
      // Add to body to ensure it's above everything
      document.body.appendChild(tooltip);
      
      // Position tooltip
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      let left, top;
      
      if (position === 'below') {
        // Position below and to the right of the element
        left = rect.left;
        top = rect.bottom + 10;
      } else {
        // Default position to the right (for toolbar)
        left = rect.right + 10;
        top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
      }
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      
      // Add arrow
      const arrow = document.createElement('div');
      arrow.className = `custom-tooltip-arrow ${position === 'below' ? 'above' : 'left'}`;
      tooltip.appendChild(arrow);
      
      // Trigger animation
      setTimeout(() => {
        tooltip.classList.add('show');
      }, 10);
    }

    const hideCustomTooltip = () => {
      const existingTooltip = document.getElementById('active-tooltip');
      if (existingTooltip) {
        existingTooltip.remove();
      }
    }

    // Load and cache icon SVGs at startup
    const loadIconCache = async () => {
      // Build icon URLs from the dynamic iconTools array
      const iconUrls = {};
      iconTools.value.forEach(iconTool => {
        iconUrls[iconTool.id] = iconTool.icon;
      });

      for (const [iconName, url] of Object.entries(iconUrls)) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const svgText = await response.text();
            // Convert to base64 data URL
            const base64Data = btoa(svgText);
            const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
            iconCache.value[iconName] = dataUrl;
            console.log(`Cached icon: ${iconName}`);
          } else {
            console.error(`Failed to fetch icon: ${iconName} from ${url}`);
          }
        } catch (error) {
          console.error(`Error loading icon ${iconName}:`, error);
        }
      }
    };

    // Apply fill color to cached SVG icon
    const getColoredIcon = (iconName, fillColor) => {
      const cachedIcon = iconCache.value[iconName];
      if (!cachedIcon || !cachedIcon.startsWith('data:image/svg+xml;base64,')) {
        return cachedIcon || `/images/${iconName}.svg`;
      }
      
      try {
        // Decode base64 SVG
        const base64Data = cachedIcon.replace('data:image/svg+xml;base64,', '');
        let svgString = atob(base64Data);
        
        // Update fill color in SVG
        if (svgString.includes('fill=')) {
          svgString = svgString.replace(/fill="[^"]*"/g, `fill="${fillColor}"`);
        } else {
          // Add fill attribute if it doesn't exist
          svgString = svgString.replace(/<svg([^>]*)>/g, `<svg$1 fill="${fillColor}">`);
        }
        
        // Re-encode to base64
        const newBase64 = btoa(svgString);
        return `data:image/svg+xml;base64,${newBase64}`;
      } catch (error) {
        console.error('Error applying color to icon:', error);
        return cachedIcon;
      }
    };

    // Measurement utility functions
    const calculateDistance = (point1, point2) => {
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const convertPixelsToUnits = (pixels) => {
      //const inches = pixels / 96; // 96 DPI standard
      //const mm = pixels * 0.2646; // 1 pixel = 0.2646 mm
      const px = pixels * zoomLevel.value;
      const inches = px / (zoomLevel.value*72); // 96 DPI standard
      const mm = inches * 25.4; // 1 pixel = 0.2646 mm
      
      return {
        px: Math.round(px * 100) / 100,
        inches: Math.round(inches * 1000) / 1000,
        mm: Math.round(mm * 100) / 100
      };
    };

    const clearMeasurements = () => {
      // Clear all measurement overlays
      document.querySelectorAll('.measurement-overlay').forEach(overlay => {
        overlay.remove();
      });
      
      // Reset measurement state
      measurementState.value = {
        isActive: false,
        firstPoint: null,
        currentPoint: null,
        measurements: [],
        liveMeasurement: null
      };
      
      console.log('All measurements cleared');
    };

    const createMeasurementOverlay = (point1, point2, isLive = false) => {
      const distance = calculateDistance(point1, point2);
      const units = convertPixelsToUnits(distance);
      
      // Create measurement line
      const line = document.createElement('div');
      line.className = `measurement-overlay measurement-line ${isLive ? 'live' : 'final'}`;
      
      // Calculate line position and rotation
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const length = distance;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      line.style.left = `${point1.x}px`;
      line.style.top = `${point1.y}px`;
      line.style.width = `${length}px`;
      line.style.transform = `rotate(${angle}deg)`;
      
      // Create measurement label
      const label = document.createElement('div');
      label.className = `measurement-overlay measurement-label ${isLive ? 'live' : 'final'}`;
      
      const midX = (point1.x + point2.x) / 2;
      const midY = (point1.y + point2.y) / 2;
      
      const labelContent = document.createElement('div');
      labelContent.className = `measurement-label-content ${isLive ? 'live' : 'final'}`;
      labelContent.style.left = `${midX}px`;
      labelContent.style.top = `${midY - 30}px`;
      labelContent.textContent = `${units.inches} in  /  ${units.mm} mm`;
      
      label.appendChild(labelContent);
      
      // Create start and end points
      const startPoint = document.createElement('div');
      startPoint.className = `measurement-overlay measurement-point ${isLive ? 'live' : 'final'}`;
      startPoint.style.left = `${point1.x }px`;
      startPoint.style.top = `${point1.y }px`;
      
      const endPoint = document.createElement('div');
      endPoint.className = `measurement-overlay measurement-point ${isLive ? 'live' : 'final'}`;
      endPoint.style.left = `${point2.x }px`;
      endPoint.style.top = `${point2.y }px`;
      
      return { line, label, startPoint, endPoint };
    };

    const addMeasurementOverlay = (point1, point2, container, isLive = false) => {
      // Remove existing live measurement if adding a new live one
      if (isLive) {
        document.querySelectorAll('.measurement-overlay.live').forEach(overlay => {
          overlay.remove();
        });
      }
      
      const { line, label, startPoint, endPoint } = createMeasurementOverlay(point1, point2, isLive);
      
      container.appendChild(line);
      container.appendChild(label);
      container.appendChild(startPoint);
      container.appendChild(endPoint);
      
      return { line, label, startPoint, endPoint };
    };

    const scrollToEditor = () => {
      console.log('scrollToEditor called');
      const pdfEditor = document.querySelector('.pdf-editor');
      if (pdfEditor) {
        pdfEditor.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'center'
        });
        showToast('Focused on PDF editor', 'info', 1500);
      } else {
        console.log('PDF editor container not found');
      }
    };

    return {
      pdfViewContainer,
      file,
      configFile,
      selectedOperation,
      counter,
      clickFileInput,
      handleFileUpload,
      processFile,
      processConfigFile,
      handleDragEnter,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      downloadPDF,
      zoomLevel,
      applyZoom,
      updateToolbarPosition,
      selectedTool,
      selectTool,
      freehandOptions,
      lineOptions,
      shapeOptions,
      highlightOptions,
      textOptions,
      iconOptions,
      linkOptions,
      showImageDialog,
      pendingImageData,
      openImageDialog,
      closeImageDialog,
      handleImageConfirm,
      uploadPropertyPanel,
      clearPropertyPanel,
      downloadConfig,
      clickRestoreConfigInput,
      handleConfigRestore,
      getSvgStrokeColor,
      getSvgStrokeWidth,
      updateSvgStrokeColor,
      updateSvgStrokeWidth,
      getSvgFillColor,
      updateSvgFillColor,
      iconCache,
      loadIconCache,
      getColoredIcon,
      showLinkDialog,
      pendingLinkData,
      openLinkDialog,
      handleLinkConfirm,
      closeLinkDialog,
      showConfigDropdown,
      toggleConfigDropdown,
      closeConfigDropdown,
      toast,
      showToast,
      hideToast,
      clearPdfPages,
      isLoaded,
      iconTools,
      measurementState,
      clearMeasurements,
      calculateDistance,
      convertPixelsToUnits,
      createMeasurementOverlay,
      addMeasurementOverlay,
      scrollToEditor
    }
  }
}
</script>