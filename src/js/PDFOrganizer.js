import { toRaw } from "vue";

class PDFOrganizer {
  constructor() {
    this.pages = [];
    this.pageCanvasRefs = {};
    this.nextPageId = 0;
    this.fileCounter = 0;
    // Track which files are still in use
    this.fileUsage = new Map();
    this.filePdfDocs = new Map();
    this.fileBuffers = new Map();
  }

  async loadPDFFile(file, reset = true) {
    try {
      const originalBuffer = await file.arrayBuffer();
      const bufferForDisplay = originalBuffer.slice(0);
      const pdfDoc = await window.pdfjsLib.getDocument({ data: bufferForDisplay }).promise;

      if (reset) {
        this.pages = [];
        this.pageCanvasRefs = {};
        this.nextPageId = 0;
        this.fileCounter = 0;
      }

      const currentIndex = this.fileCounter++;
      const startId = this.nextPageId;
      const newPages = [];

      // Store PDF doc and buffer in Maps
      this.filePdfDocs.set(currentIndex, pdfDoc);
      this.fileBuffers.set(currentIndex, originalBuffer);
      this.fileUsage.set(currentIndex, pdfDoc.numPages);

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const pdfPage = await pdfDoc.getPage(i);
        const pageData = {
          id: this.nextPageId++,
          pageNumber: i,
          rotation: pdfPage.rotate || 0,
          externalPdfDoc: pdfDoc,
          externalArrayBuffer: originalBuffer,
          fileIndex: currentIndex,
        };
        this.pages.push(pageData);
        newPages.push(pageData);
      }

      return {
        pages: this.pages,
        newPages,
        startId,
        endId: this.nextPageId,
        fileIndex: currentIndex,
      };
    } catch (err) {
      console.error("Error loading PDF:", err);
      throw err;
    }
  }

  async renderPage(index, canvas, scale = 0.5) {
    const page = this.pages[index];
    if (!page || !canvas) return;

    if (page.isBlank) {
      this.renderBlankPage(canvas);
      return;
    }

    try {
      const pdfInstance = page.externalPdfDoc ? toRaw(page.externalPdfDoc) : null;
      if (!pdfInstance) return;

      const pdfPage = await pdfInstance.getPage(page.pageNumber);
      const viewport = pdfPage.getViewport({ scale, rotation: page.rotation });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      await pdfPage.render({ canvasContext: context, viewport }).promise;
    } catch (err) {
      console.error("Error rendering page:", err);
      throw err;
    }
  }

  rotatePage(index, degrees) {
    if (!this.pages[index]) return;
    const currentRotation = this.pages[index].rotation || 0;
    const newRotation = (currentRotation + degrees) % 360;
    // Convert -0 to 0
    this.pages[index].rotation = (newRotation + 360) % 360;
    return this.pages[index];
  }

  duplicatePage(index) {
    const original = this.pages[index];
    if (!original) return null;

    const newPage = {
      id: this.nextPageId++,
      pageNumber: original.pageNumber,
      rotation: original.rotation,
      externalPdfDoc: original.externalPdfDoc,
      externalArrayBuffer: original.externalArrayBuffer,
      fileIndex: original.fileIndex,
    };

    if (original.isBlank) newPage.isBlank = true;

    this.pages.splice(index + 1, 0, newPage);
    return newPage;
  }

  addBlankPage(index) {
    const blankPage = {
      id: this.nextPageId++,
      pageNumber: null,
      rotation: 0,
      isBlank: true,
    };
    this.pages.splice(index, 0, blankPage);
    return blankPage;
  }

  renderBlankPage(canvas) {
    if (!canvas) return;
    canvas.width = 612;
    canvas.height = 792;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  deletePage(index) {
    const deletedPage = this.pages[index];

    // Clean up canvas reference
    if (deletedPage && deletedPage.id !== undefined) {
      delete this.pageCanvasRefs[deletedPage.id];
    }

    // Track file usage and clean up if no pages from this file remain
    if (deletedPage && deletedPage.fileIndex !== undefined && !deletedPage.isBlank) {
      const fileIndex = deletedPage.fileIndex;
      const currentUsage = this.fileUsage.get(fileIndex) || 0;

      if (currentUsage > 0) {
        this.fileUsage.set(fileIndex, currentUsage - 1);

        // If no pages from this file remain, clean up
        if (currentUsage - 1 === 0) {
          this.cleanupFile(fileIndex);
        }
      }
    }

    this.pages.splice(index, 1);
    return true;
  }

  cleanupFile(fileIndex) {
    // Destroy PDF.js document if it exists
    const pdfDoc = this.filePdfDocs.get(fileIndex);
    if (pdfDoc && typeof pdfDoc.destroy === "function") {
      try {
        pdfDoc.destroy();
      } catch (err) {
        console.warn("Error destroying PDF document:", err);
      }
    }

    // Remove references to allow garbage collection
    this.filePdfDocs.delete(fileIndex);
    this.fileBuffers.delete(fileIndex);
    this.fileUsage.delete(fileIndex);
  }

  reversePages() {
    this.pages.reverse();
    return this.pages;
  }

  sortSelectedPages(selectedIndices) {
    if (!selectedIndices || selectedIndices.length === 0) return this.pages;
    const selectedPages = selectedIndices.map((idx) => this.pages[idx]).reverse();
    selectedIndices.forEach((idx, i) => (this.pages[idx] = selectedPages[i]));
    return this.pages;
  }

  movePage(fromIndex, toIndex) {
    if (fromIndex === null || toIndex === null) return;
    if (fromIndex < 0 || fromIndex >= this.pages.length) return;
    if (toIndex < 0 || toIndex >= this.pages.length) return;

    const [draggedPage] = this.pages.splice(fromIndex, 1);
    this.pages.splice(toIndex, 0, draggedPage);
    return this.pages;
  }

  moveMultiplePages(pageIndices, dropIndex) {
    if (!pageIndices || pageIndices.length === 0) return this.pages;
    if (dropIndex < 0 || dropIndex >= this.pages.length) return this.pages;

    const selectedPages = pageIndices.map((idx) => this.pages[idx]);

    for (let i = pageIndices.length - 1; i >= 0; i--) {
      this.pages.splice(pageIndices[i], 1);
    }

    let adjustedDropIndex = dropIndex - pageIndices.filter((idx) => idx < dropIndex).length;

    selectedPages.forEach((page, i) => {
      this.pages.splice(adjustedDropIndex + 1 + i, 0, page);
    });

    return this.pages;
  }

  swapPages(index1, index2) {
    if (index1 === null || index2 === null) return;
    if (index1 < 0 || index1 >= this.pages.length) return;
    if (index2 < 0 || index2 >= this.pages.length) return;
    if (index1 === index2) return;

    [this.pages[index1], this.pages[index2]] = [this.pages[index2], this.pages[index1]];
    return this.pages;
  }

  getPages() {
    return this.pages;
  }

  // Helper: adds a single page (blank or regular with rotation) to a PDF document
  async addPageToPdf(pdfDoc, pageInfo, loadedPdfDocs) {
    if (!pageInfo) return;

    const { degrees } = window.PDFLib;

    if (pageInfo.isBlank) {
      const blankPage = pdfDoc.addPage([612, 792]);
      if (pageInfo.rotation !== 0) blankPage.setRotation(degrees(pageInfo.rotation));
    } else {
      const buffer = pageInfo.externalArrayBuffer;
      let srcDoc = loadedPdfDocs.get(buffer);
      if (!srcDoc) {
        srcDoc = await window.PDFLib.PDFDocument.load(buffer);
        loadedPdfDocs.set(buffer, srcDoc);
      }

      const [copiedPage] = await pdfDoc.copyPages(srcDoc, [pageInfo.pageNumber - 1]);
      if (pageInfo.rotation !== 0) {
        const currentRotation = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees(currentRotation + pageInfo.rotation));
      }
      pdfDoc.addPage(copiedPage);
    }
  }
  async exportPDF(pageIndices = null) {
    try {
      const indices = pageIndices || Array.from({ length: this.pages.length }, (_, i) => i);
      const newPdf = await window.PDFLib.PDFDocument.create();
      const loadedPdfDocs = new Map();

      for (const index of indices) {
        await this.addPageToPdf(newPdf, this.pages[index], loadedPdfDocs);
      }

      return await newPdf.save();
    } catch (err) {
      console.error("Error exporting PDF:", err);
      throw err;
    }
  }

  clear() {
    // Destroy all PDF.js documents
    for (const [fileIndex, pdfDoc] of this.filePdfDocs.entries()) {
      if (pdfDoc && typeof pdfDoc.destroy === "function") {
        try {
          pdfDoc.destroy();
        } catch (err) {
          console.warn("Error destroying PDF document:", err);
        }
      }
    }

    // Clear all references
    this.pages = [];
    this.pageCanvasRefs = {};
    this.filePdfDocs.clear();
    this.fileBuffers.clear();
    this.fileUsage.clear();
    this.nextPageId = 0;
    this.fileCounter = 0;
  }

  async splitAtPage(pageNumber) {
    try {
      const pdf1 = await window.PDFLib.PDFDocument.create();
      const pdf2 = await window.PDFLib.PDFDocument.create();
      const loadedPdfDocs = new Map();

      for (let i = 0; i < pageNumber; i++) {
        await this.addPageToPdf(pdf1, this.pages[i], loadedPdfDocs);
      }

      for (let i = pageNumber; i < this.pages.length; i++) {
        await this.addPageToPdf(pdf2, this.pages[i], loadedPdfDocs);
      }

      return [await pdf1.save(), await pdf2.save()];
    } catch (err) {
      console.error("Error splitting PDF at page:", err);
      throw err;
    }
  }

  async extractPageRange(fromPage, toPage) {
    try {
      const newPdf = await window.PDFLib.PDFDocument.create();
      const loadedPdfDocs = new Map();

      for (let i = fromPage - 1; i < toPage; i++) {
        await this.addPageToPdf(newPdf, this.pages[i], loadedPdfDocs);
      }

      return await newPdf.save();
    } catch (err) {
      console.error("Error extracting page range:", err);
      throw err;
    }
  }

  async splitEveryNPages(n) {
    try {
      const pdfParts = [];
      const numParts = Math.ceil(this.pages.length / n);

      for (let part = 0; part < numParts; part++) {
        const newPdf = await window.PDFLib.PDFDocument.create();
        const loadedPdfDocs = new Map();
        const startIdx = part * n;
        const endIdx = Math.min(startIdx + n, this.pages.length);

        for (let i = startIdx; i < endIdx; i++) {
          await this.addPageToPdf(newPdf, this.pages[i], loadedPdfDocs);
        }

        pdfParts.push(await newPdf.save());
      }

      return pdfParts;
    } catch (err) {
      console.error("Error splitting PDF every N pages:", err);
      throw err;
    }
  }
}

export { PDFOrganizer };
