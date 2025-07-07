/**
 * Freehand Drawing Utility
 * Handles path smoothing, SVG generation, and canvas management for freehand drawing
 */

export class FreehandDrawing {
  constructor() {
    this.canvas = null;
    this.context = null;
    this.path = [];
    this.lastDrawTime = 0;
    this.drawThrottleMs = 16; // ~60fps
  }

  /**
   * Advanced path smoothing with Bézier curve interpolation
   */
  smoothPath(path, smoothLevel) {
    if (path.length < 3 || smoothLevel <= 1) return path;
    
    // First, reduce noise by removing points that are too close
    const denoised = [];
    const minDistance = Math.max(1, smoothLevel / 20);
    
    denoised.push(path[0]);
    for (let i = 1; i < path.length; i++) {
      const prev = denoised[denoised.length - 1];
      const curr = path[i];
      const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
      
      if (distance >= minDistance) {
        denoised.push(curr);
      }
    }
    
    if (denoised.length < 3) return denoised;
    
    // Apply multiple smoothing passes
    let smoothed = [...denoised];
    const passes = Math.min(3, Math.floor(smoothLevel / 3) + 1);
    
    for (let pass = 0; pass < passes; pass++) {
      smoothed = this.applySmoothingPass(smoothed, smoothLevel);
    }
    
    // Generate Bézier curve points for ultra-smooth result
    if (smoothLevel > 5) {
      smoothed = this.generateBezierCurve(smoothed, smoothLevel);
    }
    
    return smoothed;
  }
  
  /**
   * Single smoothing pass using weighted average
   */
  applySmoothingPass(path, smoothLevel) {
    if (path.length < 3) return path;
    
    const result = [];
    const factor = Math.min(0.8, smoothLevel / 12); // Convert to 0.0 - 0.8 range
    
    // Keep first point
    result.push(path[0]);
    
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
      
      // Use quadratic smoothing with neighboring points
      const smoothedX = curr.x * (1 - factor) + (prev.x + next.x) * factor / 2;
      const smoothedY = curr.y * (1 - factor) + (prev.y + next.y) * factor / 2;
      
      // Additional smoothing with further neighbors if available
      if (i > 1 && i < path.length - 2) {
        const prevPrev = path[i - 2];
        const nextNext = path[i + 2];
        const extraFactor = factor * 0.3;
        
        const finalX = smoothedX * (1 - extraFactor) + (prevPrev.x + nextNext.x) * extraFactor / 2;
        const finalY = smoothedY * (1 - extraFactor) + (prevPrev.y + nextNext.y) * extraFactor / 2;
        
        result.push({ x: finalX, y: finalY });
      } else {
        result.push({ x: smoothedX, y: smoothedY });
      }
    }
    
    // Keep last point
    result.push(path[path.length - 1]);
    
    return result;
  }
  
  /**
   * Generate smooth Bézier curve through control points
   */
  generateBezierCurve(controlPoints, smoothLevel) {
    if (controlPoints.length < 3) return controlPoints;
    
    const result = [];
    const segments = Math.max(2, Math.floor(smoothLevel / 2));
    
    // Add first point
    result.push(controlPoints[0]);
    
    for (let i = 0; i < controlPoints.length - 1; i++) {
      const p0 = i > 0 ? controlPoints[i - 1] : controlPoints[i];
      const p1 = controlPoints[i];
      const p2 = controlPoints[i + 1];
      const p3 = i < controlPoints.length - 2 ? controlPoints[i + 2] : controlPoints[i + 1];
      
      // Generate Catmull-Rom spline points
      for (let t = 0; t < segments; t++) {
        const tNorm = (t + 1) / segments;
        const point = this.catmullRomInterpolate(p0, p1, p2, p3, tNorm);
        result.push(point);
      }
    }
    
    return result;
  }
  
  /**
   * Catmull-Rom spline interpolation for smooth curves
   */
  catmullRomInterpolate(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    
    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );
    
    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );
    
    return { x, y };
  }

  /**
   * Convert path to SVG and then to base64 data URL
   */
  pathToSvgDataUrl(path, options = {}) {
    if (path.length === 0) return null;
    
    const {
      color = '#000000',
      width = 2,
      smoothLevel = 5
    } = options;
    
    // Apply smoothing
    const smoothedPath = this.smoothPath(path, smoothLevel);
    
    // Calculate bounding box
    let minX = Math.min(...smoothedPath.map(p => p.x));
    let minY = Math.min(...smoothedPath.map(p => p.y));
    let maxX = Math.max(...smoothedPath.map(p => p.x));
    let maxY = Math.max(...smoothedPath.map(p => p.y));
    
    // Add padding based on stroke width
    const padding = Math.max(width * 2, 10);
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const svgWidth = maxX - minX;
    const svgHeight = maxY - minY;
    
    // Build SVG path with original coordinates translated to start from padding
    let pathData = '';
    if (smoothedPath.length > 0) {
      pathData = `M ${smoothedPath[0].x - minX} ${smoothedPath[0].y - minY}`;
      for (let i = 1; i < smoothedPath.length; i++) {
        pathData += ` L ${smoothedPath[i].x - minX} ${smoothedPath[i].y - minY}`;
      }
    }
    
    // Create SVG with preserveAspectRatio to maintain stroke width
    const svg = `<svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${pathData}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    </svg>`;

    console.log('SVG:', svg);
    
    // Convert to base64 data URL
    const base64 = btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Create and setup freehand canvas
   */
  createCanvas(container, options = {}) {
    const {
      zoomFactor = 1,
      color = '#000000',
      width = 2
    } = options;

    if (this.canvas) {
      this.canvas.remove();
    }
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    this.canvas.style.zIndex = '9999';
    
    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width / zoomFactor;
    this.canvas.height = rect.height / zoomFactor;
    this.canvas.style.width = `${rect.width / zoomFactor}px`;
    this.canvas.style.height = `${rect.height / zoomFactor}px`;
    
    this.context = this.canvas.getContext('2d');
    this.updateCanvasStyle({ color, width });
    
    container.appendChild(this.canvas);
    return this.canvas;
  }

  /**
   * Update canvas drawing style
   */
  updateCanvasStyle(options = {}) {
    if (!this.context) return;

    const {
      color = '#000000',
      width = 2
    } = options;

    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  /**
   * Draw path on canvas
   */
  drawPath(path, options = {}) {
    if (!this.context || path.length === 0) return;
    
    const {
      isRealTime = false,
      smoothLevel = 5
    } = options;
    
    // For real-time drawing, use simpler smoothing for performance
    const pathToRender = isRealTime && path.length > 10 ? 
      this.applySmoothingPass(path, smoothLevel) : 
      this.smoothPath(path, smoothLevel);
    
    this.context.beginPath();
    this.context.moveTo(pathToRender[0].x, pathToRender[0].y);
    
    for (let i = 1; i < pathToRender.length; i++) {
      this.context.lineTo(pathToRender[i].x, pathToRender[i].y);
    }
    
    this.context.stroke();
  }

  /**
   * Clear canvas
   */
  clearCanvas() {
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Start new path
   */
  startPath(x, y) {
    this.path = [{ x, y }];
    if (this.context) {
      this.context.beginPath();
      this.context.moveTo(x, y);
    }
  }

  /**
   * Add point to current path
   */
  addPoint(x, y) {
    this.path.push({ x, y });
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    return [...this.path];
  }

  /**
   * Reset path
   */
  resetPath() {
    this.path = [];
  }

  /**
   * Clean up canvas and resources
   */
  cleanup() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.context = null;
    }
    this.path = [];
  }

  /**
   * Calculate bounding box for a path
   */
  calculateBoundingBox(path, strokeWidth = 2) {
    if (path.length === 0) return null;

    let minX = Math.min(...path.map(p => p.x));
    let minY = Math.min(...path.map(p => p.y));
    let maxX = Math.max(...path.map(p => p.x));
    let maxY = Math.max(...path.map(p => p.y));
    
    // Add padding based on stroke width
    const padding = Math.max(strokeWidth * 2, 10);
    
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    };
  }
}

// Export singleton instance for convenience
export const freehandDrawing = new FreehandDrawing(); 