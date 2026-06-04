import svgpath from "svgpath";

class PDFGenerator {
  constructor() {}

  static str2ab(binaryString) {
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes.buffer;
  }

  static hexToRgb(hexString) {
    hexString = hexString.replace("#", "");

    const bigint = parseInt(hexString, 16);
    const red = (bigint >> 16) & 255;
    const green = (bigint >> 8) & 255;
    const blue = bigint & 255;

    return {
      red: red / 255,
      green: green / 255,
      blue: blue / 255,
    };
  }

  static getImageType(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const signature = [view.getUint8(0), view.getUint8(1)];

    const decoder = new TextDecoder("utf-8"); // or whatever encoding you expect
    const str = decoder.decode(arrayBuffer);

    if (str.startsWith("<svg") || str.startsWith("<?xml")) {
      return "svg";
    } else if (signature[0] === 0xff && signature[1] === 0xd8) {
      return "jpg";
    } else if (
      signature[0] === 0x89 &&
      signature[1] === 0x50 &&
      view.getUint8(2) === 0x4e &&
      view.getUint8(3) === 0x47 &&
      view.getUint8(4) === 0x0d &&
      view.getUint8(5) === 0x0a &&
      view.getUint8(6) === 0x1a &&
      view.getUint8(7) === 0x0a
    ) {
      return "png";
    } else {
      return "unknown";
    }
  }

  static async generatePDF(fileContents, pageOperations) {
    const pdfDoc = await PDFLib.PDFDocument.create();
    const srcDoc = await PDFLib.PDFDocument.load(PDFGenerator.str2ab(fileContents));

    for (const page of pageOperations) {
      const index = page.pageIndex;
      const pdfURL = page.pdfURL;
      const pageNumber = page.pageNumber;
      const createOperations = page.operations.filter((item) => item.operation == "create");
      const updateOperations = page.operations.filter((item) => item.operation == "update");

      for (const op of updateOperations) {
        const form = srcDoc.getForm();
        const formField = form.getFields().find((x) => x.getName() === op.id);

        if (formField !== null && formField !== undefined) {
          form.removeField(formField);
        }
      }

      const [cpage] = await pdfDoc.copyPages(srcDoc, [pageNumber - 1]);
      // Remove existing Text annotations (Notes) to avoid duplicates when re-adding them from editor state
      const annotsRef = cpage.node.get(PDFLib.PDFName.of("Annots"));
      if (annotsRef) {
        const annots = cpage.node.context.lookup(annotsRef);
        if (annots instanceof PDFLib.PDFArray) {
          const newAnnots = [];
          for (let i = 0; i < annots.size(); i++) {
            const annotRef = annots.get(i);
            const annot = cpage.node.context.lookup(annotRef);
            let isNote = false;
            if (annot instanceof PDFLib.PDFDict) {
              const subtype = annot.lookup(PDFLib.PDFName.of("Subtype"));
              if (subtype instanceof PDFLib.PDFName && subtype.asString() === "/Text") {
                isNote = true;
              }
            }
            if (!isNote) newAnnots.push(annotRef);
          }
          cpage.node.set(PDFLib.PDFName.of("Annots"), cpage.node.context.obj(newAnnots));
        }
      }

      pdfDoc.addPage(cpage);
    }

    for (const page of pageOperations) {
      const pageNumber = page.pageNumber;
      const createOperations = page.operations.filter((item) => item.operation == "create");
      const updateOperations = page.operations.filter((item) => item.operation == "update");

      const pdfPages = pdfDoc.getPages();
      const pdfPage = pdfPages[pageNumber - 1];

      for (const op of createOperations) {
        if (op.type === "text") {
          await this.drawTextOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "watermark") {
          await this.drawWatermarkOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "rectangle") {
          await this.drawRectangleOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "circle") {
          await this.drawCircleOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "image") {
          await this.drawImageOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "textfield") {
          await this.drawTextFieldOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "checkbox") {
          await this.drawCheckboxOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "link") {
          await this.drawLinkOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "note") {
          await this.drawNoteOnPage(pdfDoc, pdfPage, op);
        }
      }

      for (const op of updateOperations) {
        if (op.type === "textfield") {
          await this.drawTextFieldOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "checkbox") {
          await this.drawCheckboxOnPage(pdfDoc, pdfPage, op);
        } else if (op.type === "link") {
          await this.drawLinkOnPage(pdfDoc, pdfPage, op);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }

  static async drawTextOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();

    const xPadding = operation.xPadding;
    const text = operation.text.replaceAll("\n\n", "\n \n");
    const x = operation.x;
    const y = operation.y;
    const fontFamily = operation.fontFamily;
    const fontSize = parseInt(operation.fontSize);
    const fontColor = PDFGenerator.hexToRgb(operation.color);
    const fontLineHeight = operation.fontSize * operation.lineHeight;
    const fontWordBreak = operation.wordBreak;
    const width = operation.width;
    const opacity = parseFloat(operation.opacity, 10);

    let embedFont;

    if (fontFamily === "Helvetica") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    } else if (fontFamily === "Helvetica-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    } else if (fontFamily === "Helvetica-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique);
    } else if (fontFamily === "Helvetica-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);
    } else if (fontFamily === "Times-Roman") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else if (fontFamily === "Times-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBold);
    } else if (fontFamily === "Times-Italic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesItalic);
    } else if (fontFamily === "Times-BoldItalic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBoldItalic);
    } else if (fontFamily === "Courier") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
    } else if (fontFamily === "Courier-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBold);
    } else if (fontFamily === "Courier-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierOblique);
    } else if (fontFamily === "Courier-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBoldOblique);
    } else if (fontFamily === "Symbol") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Symbol);
    } else if (fontFamily === "ZapfDingbats") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.ZapfDingbats);
    } else if (fontFamily === "TimesRoman") {
      // Legacy support for old naming
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else {
      // Default fallback
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }

    let wordBreaks = [];

    if (fontWordBreak === "break-all") {
      wordBreaks.push("");
    } else if (fontWordBreak === "break-word") {
      wordBreaks.push(" ");
    }

    await pdfPage.drawText(text, {
      x: x + xPadding,
      y: operationPageHeight - y - fontSize,
      color: PDFLib.rgb(fontColor.red, fontColor.green, fontColor.blue),
      font: embedFont,
      size: fontSize,
      lineHeight: fontLineHeight,
      opacity: opacity,
      wordBreaks: wordBreaks,
      maxWidth: width,
    });
  }

  static async drawWatermarkOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();
    const { x: pageX, y: pageY } = pdfPage.getCropBox() || pdfPage.getMediaBox();

    const text = operation.text.replaceAll("\n\n", "\n \n");
    const x = operation.x;
    const y = operation.y;
    let fontFamily = operation.fontFamily;
    const fontSize = parseInt(operation.fontSize);
    const fontColor = PDFGenerator.hexToRgb(operation.color);
    const fontLineHeight = operation.fontSize * (operation.lineHeight || 1.2);
    const width = operation.width;
    const height = operation.height || fontSize;
    const opacity = parseFloat(operation.opacity, 10);
    const bold = operation.bold || false;
    const italic = operation.italic || false;
    const underline = operation.underline || false;
    const rotation = parseFloat(operation.rotation) || 0;
    const alignment = operation.alignment || "center";

    // Adjust font family based on bold/italic flags
    if (fontFamily === "Helvetica") {
      if (bold && italic) {
        fontFamily = "Helvetica-BoldOblique";
      } else if (bold) {
        fontFamily = "Helvetica-Bold";
      } else if (italic) {
        fontFamily = "Helvetica-Oblique";
      }
    } else if (fontFamily === "Times-Roman" || fontFamily === "TimesRoman") {
      if (bold && italic) {
        fontFamily = "Times-BoldItalic";
      } else if (bold) {
        fontFamily = "Times-Bold";
      } else if (italic) {
        fontFamily = "Times-Italic";
      } else {
        fontFamily = "Times-Roman";
      }
    } else if (fontFamily === "Courier") {
      if (bold && italic) {
        fontFamily = "Courier-BoldOblique";
      } else if (bold) {
        fontFamily = "Courier-Bold";
      } else if (italic) {
        fontFamily = "Courier-Oblique";
      }
    }

    let embedFont;

    if (fontFamily === "Helvetica") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    } else if (fontFamily === "Helvetica-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    } else if (fontFamily === "Helvetica-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique);
    } else if (fontFamily === "Helvetica-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);
    } else if (fontFamily === "Times-Roman") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else if (fontFamily === "Times-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBold);
    } else if (fontFamily === "Times-Italic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesItalic);
    } else if (fontFamily === "Times-BoldItalic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBoldItalic);
    } else if (fontFamily === "Courier") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
    } else if (fontFamily === "Courier-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBold);
    } else if (fontFamily === "Courier-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierOblique);
    } else if (fontFamily === "Courier-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBoldOblique);
    } else if (fontFamily === "Symbol") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Symbol);
    } else if (fontFamily === "ZapfDingbats") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.ZapfDingbats);
    } else if (fontFamily === "TimesRoman") {
      // Legacy support for old naming
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else {
      // Default fallback
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }

    // Calculate text dimensions
    const lines = text.split("\n");
    let textWidth = 0;
    lines.forEach((line) => {
      const lineWidth = embedFont.widthOfTextAtSize(line, fontSize);
      if (lineWidth > textWidth) {
        textWidth = lineWidth;
      }
    });

    // Calculate center of the component in PDF coordinates
    // HTML (0,0) is top-left. PDF (0,0) is bottom-left.
    const cx = x + width / 2;
    const cy = y + height / 2;

    const pdfCx = pageX + cx;
    const pdfCy = pageY + operationPageHeight - cy;

    // Rotation
    const pdfRotation = -rotation;
    const rad = (pdfRotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Vertical offset for the first line baseline from center
    const v = (fontSize - (lines.length - 1) * fontLineHeight) / 2;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWidth = embedFont.widthOfTextAtSize(line, fontSize);

      let xLocal;
      if (alignment === "left") {
        xLocal = -textWidth / 2;
      } else if (alignment === "right") {
        xLocal = textWidth / 2 - lineWidth;
      } else {
        // center
        xLocal = -lineWidth / 2;
      }

      const yLocal = -v - i * fontLineHeight;

      const xRot = xLocal * cos - yLocal * sin;
      const yRot = xLocal * sin + yLocal * cos;

      const drawX = pdfCx + xRot;
      const drawY = pdfCy + yRot;

      await pdfPage.drawText(line, {
        x: drawX,
        y: drawY,
        color: PDFLib.rgb(fontColor.red, fontColor.green, fontColor.blue),
        font: embedFont,
        size: fontSize,
        opacity: opacity,
        rotate: PDFLib.degrees(pdfRotation),
      });

      // Draw underline if specified
      if (underline) {
        const underlineOffset = -2; // 2 units below baseline

        const uStart = { x: xLocal, y: yLocal + underlineOffset };
        const uEnd = { x: xLocal + lineWidth, y: yLocal + underlineOffset };

        const rStart = {
          x: uStart.x * cos - uStart.y * sin,
          y: uStart.x * sin + uStart.y * cos,
        };
        const rEnd = {
          x: uEnd.x * cos - uEnd.y * sin,
          y: uEnd.x * sin + uEnd.y * cos,
        };

        pdfPage.drawLine({
          start: { x: pdfCx + rStart.x, y: pdfCy + rStart.y },
          end: { x: pdfCx + rEnd.x, y: pdfCy + rEnd.y },
          thickness: Math.max(1, fontSize / 12),
          color: PDFLib.rgb(fontColor.red, fontColor.green, fontColor.blue),
          opacity: opacity,
        });
      }
    }
  }

  static async drawImageOnPage(pdfDoc, pdfPage, operation) {
    const pageHeight = pdfPage.getHeight();
    const { x, y, width, height, opacity: opacityStr, url } = operation;
    const opacity = parseFloat(opacityStr, 10);

    // Fetch image data
    const arrayBuffer = await fetch(url).then((res) => res.arrayBuffer());
    const type = PDFGenerator.getImageType(arrayBuffer);

    // Helper for JPG/PNG
    const drawRaster = async (embeddedImg) => {
      await pdfPage.drawImage(embeddedImg, {
        x,
        y: pageHeight - y - height,
        width,
        height,
        opacity,
      });
    };

    switch (type) {
      case "jpg":
        await drawRaster(await pdfDoc.embedJpg(arrayBuffer));
        break;
      case "png":
        await drawRaster(await pdfDoc.embedPng(arrayBuffer));
        break;
      case "svg": {
        // Decode SVG text
        const svgText = new TextDecoder("utf-8").decode(arrayBuffer);

        // Extract all path elements
        const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
        const paths = [];
        let pathMatch;

        while ((pathMatch = pathRegex.exec(svgText)) !== null) {
          paths.push({
            data: pathMatch[1],
            element: pathMatch[0], // Store full element for individual styling
          });
        }

        if (paths.length === 0) throw new Error("No SVG paths found");

        // Extract global SVG styles (fallbacks)
        const globalFillMatch = svgText.match(/<svg[^>]*fill="([^"]+)"/);
        const globalStrokeMatch = svgText.match(/<svg[^>]*stroke="([^"]+)"/);
        const globalStrokeWidthMatch = svgText.match(/<svg[^>]*stroke-width="([^"]+)"/);

        // Check preserveAspectRatio attribute
        const preserveAspectRatioMatch = svgText.match(/<svg[^>]*preserveAspectRatio="([^"]+)"/);
        const preserveAspectRatio = preserveAspectRatioMatch ? preserveAspectRatioMatch[1] : null;
        const shouldMaintainAspectRatio = preserveAspectRatio !== "none";

        // Parse viewBox for scaling
        const vbMatch = svgText.match(/viewBox="([^"]+)"/);
        if (!vbMatch) throw new Error("SVG viewBox not found");
        const [, vb] = vbMatch;
        const [, , vbW, vbH] = vb.split(/\s+/).map(parseFloat);

        // Calculate scales based on preserveAspectRatio attribute
        let scaleX,
          scaleY,
          offsetX = 0,
          offsetY = 0;

        if (shouldMaintainAspectRatio) {
          // Maintain aspect ratio - use the smaller scale to ensure the SVG fits within bounds
          const scale = Math.min(width / vbW, height / vbH);
          scaleX = scale;
          scaleY = scale;

          // Calculate offsets to center the scaled SVG within the target dimensions
          const scaledW = vbW * scale;
          const scaledH = vbH * scale;
          offsetX = (width - scaledW) / 2;
          offsetY = (height - scaledH) / 2;
        } else {
          // preserveAspectRatio="none" - stretch to fit exact dimensions
          scaleX = width / vbW;
          scaleY = height / vbH;

          // No offsets needed when stretching to fit
          offsetX = 0;
          offsetY = 0;
        }

        // Calculate position for drawing (convert to PDF coordinate system)
        const drawX = x + offsetX;
        const drawY = pageHeight - y - offsetY;

        // Draw each path
        for (const path of paths) {
          // Extract individual path styles, with global styles as fallbacks
          const pathFillMatch = path.element.match(/fill="([^"]+)"/);
          const pathStrokeMatch = path.element.match(/stroke="([^"]+)"/);
          const pathStrokeWidthMatch = path.element.match(/stroke-width="([^"]+)"/);
          const lineJoinMatch = path.element.match(/stroke-linejoin="([^"]+)"/);

          const opts = { x: drawX, y: drawY, opacity };

          // Determine fill color (path-specific > global > none)
          const fillColor = pathFillMatch?.[1] || globalFillMatch?.[1];
          if (fillColor && fillColor !== "none") {
            const c = PDFGenerator.hexToRgb(fillColor);
            opts.color = PDFLib.rgb(c.red, c.green, c.blue);
          }

          // Determine stroke color (path-specific > global > none)
          const strokeColor = pathStrokeMatch?.[1] || globalStrokeMatch?.[1];
          if (strokeColor && strokeColor !== "none") {
            const c = PDFGenerator.hexToRgb(strokeColor);
            opts.borderColor = PDFLib.rgb(c.red, c.green, c.blue);
          }

          // Determine stroke width (path-specific > global > default)
          const strokeWidth = pathStrokeWidthMatch?.[1] || globalStrokeWidthMatch?.[1];
          if (strokeWidth) {
            opts.borderWidth = parseFloat(strokeWidth) * Math.min(scaleX, scaleY); // Scale stroke width
          }

          if (lineJoinMatch) {
            switch (lineJoinMatch[1]) {
              case "butt":
                opts.borderLineCap = PDFLib.LineCapStyle.Butt;
                break;
              case "projecting":
                opts.borderLineCap = PDFLib.LineCapStyle.Projecting;
                break;
              case "round":
                opts.borderLineCap = PDFLib.LineCapStyle.Round;
                break;
            }
          }

          // Use svgpath to prescale the path data
          const scaledPathData = svgpath(path.data).scale(scaleX, scaleY).toString();

          // Draw the prescaled SVG path at the target position
          await pdfPage.drawSvgPath(scaledPathData, opts);
        }

        break;
      }
      default:
        console.warn(`Unsupported image type: ${type}`);
    }
  }

  static async drawRectangleOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();

    const x = operation.x;
    const y = operation.y;
    const height = operation.height;
    const width = operation.width;
    const borderWidth = parseInt(operation.borderWidth);
    const borderColor = PDFGenerator.hexToRgb(operation.borderColor);
    const fill = operation.fill || operation.color;
    const opacity = parseFloat(operation.opacity, 10);

    // Check if fill is empty, transparent, or undefined
    const isTransparent =
      !fill || fill === "transparent" || fill === "rgba(0,0,0,0)" || fill === "";
    const fillColor = isTransparent ? null : PDFGenerator.hexToRgb(fill);

    const rectangleOptions = {
      x: x + borderWidth / 2,
      y: operationPageHeight + borderWidth / 2 - y - height,
      width: width - borderWidth,
      height: height - borderWidth,
      borderWidth: borderWidth,
      borderColor: PDFLib.rgb(borderColor.red, borderColor.green, borderColor.blue),
      borderOpacity: borderWidth ? opacity : 0,
    };

    // Only add color and opacity if fill is not transparent
    if (fillColor) {
      rectangleOptions.color = PDFLib.rgb(fillColor.red, fillColor.green, fillColor.blue);
      rectangleOptions.opacity = opacity;
    }

    await pdfPage.drawRectangle(rectangleOptions);
  }

  static async drawCircleOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();

    const x = operation.x;
    const y = operation.y;
    const height = operation.height;
    const width = operation.width;
    const borderWidth = operation.borderWidth;
    const borderColor = PDFGenerator.hexToRgb(operation.borderColor);
    const xScale = (width - borderWidth) / 2;
    const yScale = (height - borderWidth) / 2;
    const fill = operation.fill || operation.color;
    const opacity = parseFloat(operation.opacity, 10);

    // Check if fill is empty, transparent, or undefined
    const isTransparent =
      !fill || fill === "transparent" || fill === "rgba(0,0,0,0)" || fill === "";
    const fillColor = isTransparent ? null : PDFGenerator.hexToRgb(fill);

    const ellipseOptions = {
      x: x + width / 2,
      y: operationPageHeight - y - height / 2,
      xScale: xScale,
      yScale: yScale,
      borderWidth: borderWidth,
      borderColor: PDFLib.rgb(borderColor.red, borderColor.green, borderColor.blue),
      borderOpacity: borderWidth ? opacity : 0,
    };

    // Only add color and opacity if fill is not transparent
    if (fillColor) {
      ellipseOptions.color = PDFLib.rgb(fillColor.red, fillColor.green, fillColor.blue);
      ellipseOptions.opacity = opacity;
    }

    await pdfPage.drawEllipse(ellipseOptions);
  }

  static async drawTextFieldOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();

    const type = operation.type;
    const id = type === "create" ? `text-field-${operation.id}` : operation.id;
    const x = operation.x;
    const y = operation.y;
    const height = operation.height;
    const width = operation.width;
    const text = operation.text;
    const borderWidth = parseFloat(operation.borderWidth, 10);
    const borderColor = PDFGenerator.hexToRgb(operation.borderColor);
    const fontColor = PDFGenerator.hexToRgb(operation.color);
    const fontFamily = operation.fontFamily;
    const fontSize = parseFloat(operation.fontSize, 10);
    const backgroundColor = PDFGenerator.hexToRgb(operation.backgroundColor);
    const maxLength = parseFloat(operation.maxLength, 10);
    const alignment = operation.alignment;

    const isRequired = operation.isRequired;
    const isMultiline = operation.isMultiline;
    const isReadOnly = operation.isReadOnly;

    let embedFont;

    if (fontFamily === "Helvetica") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    } else if (fontFamily === "Helvetica-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    } else if (fontFamily === "Helvetica-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaOblique);
    } else if (fontFamily === "Helvetica-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBoldOblique);
    } else if (fontFamily === "Times-Roman") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else if (fontFamily === "Times-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBold);
    } else if (fontFamily === "Times-Italic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesItalic);
    } else if (fontFamily === "Times-BoldItalic") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesBoldItalic);
    } else if (fontFamily === "Courier") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Courier);
    } else if (fontFamily === "Courier-Bold") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBold);
    } else if (fontFamily === "Courier-Oblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierOblique);
    } else if (fontFamily === "Courier-BoldOblique") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.CourierBoldOblique);
    } else if (fontFamily === "Symbol") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Symbol);
    } else if (fontFamily === "ZapfDingbats") {
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.ZapfDingbats);
    } else if (fontFamily === "TimesRoman") {
      // Legacy support for old naming
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.TimesRoman);
    } else {
      // Default fallback
      embedFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    }

    const form = pdfDoc.getForm();

    const textField = form.createTextField(id);

    await textField.addToPage(pdfPage, {
      x: x,
      y: operationPageHeight - y - height,
      width: width - borderWidth / 2,
      height: height - borderWidth / 2,
      textColor: PDFLib.rgb(fontColor.red, fontColor.green, fontColor.blue),
      backgroundColor: PDFLib.rgb(backgroundColor.red, backgroundColor.green, backgroundColor.blue),
      borderColor: PDFLib.rgb(borderColor.red, borderColor.green, borderColor.blue),
      borderWidth: borderWidth,
      font: embedFont,
    });

    const existingTextField = form.getTextField(id);
    existingTextField.setText(text);
    existingTextField.setFontSize(fontSize);

    if (!isNaN(maxLength)) existingTextField.setMaxLength(maxLength);

    if (alignment === "Left") {
      existingTextField.setAlignment(PDFLib.TextAlignment.Left);
    } else if (alignment === "Center") {
      existingTextField.setAlignment(PDFLib.TextAlignment.Center);
    } else if (alignment === "Right") {
      existingTextField.setAlignment(PDFLib.TextAlignment.Right);
    }

    isRequired ? existingTextField.enableRequired() : existingTextField.disableRequired();
    isMultiline ? existingTextField.enableMultiline() : existingTextField.disableMultiline();
    isReadOnly ? existingTextField.enableReadOnly() : existingTextField.disableReadOnly();
  }

  static async drawCheckboxOnPage(pdfDoc, pdfPage, operation) {
    const operationPageHeight = pdfPage.getHeight();

    const type = operation.type;
    const id = type === "create" ? `checkbox-${operation.id}` : operation.id;
    const x = operation.x;
    const y = operation.y;
    const height = operation.height;
    const width = operation.width;
    const rotate = 0;
    const borderWidth = parseFloat(operation.borderWidth, 10);
    const borderColor = PDFGenerator.hexToRgb(operation.borderColor);
    const fontColor = PDFGenerator.hexToRgb(operation.color);
    const backgroundColor = PDFGenerator.hexToRgb(operation.backgroundColor);

    const isChecked = operation.isChecked;
    const isReadOnly = operation.isReadOnly;

    const form = pdfDoc.getForm();

    const checkbox = form.createCheckBox(id);

    await checkbox.addToPage(pdfPage, {
      x: x,
      y: operationPageHeight - y - height,
      width: width,
      height: height,
      textColor: PDFLib.rgb(fontColor.red, fontColor.green, fontColor.blue),
      backgroundColor: PDFLib.rgb(backgroundColor.red, backgroundColor.green, backgroundColor.blue),
      borderColor: PDFLib.rgb(borderColor.red, borderColor.green, borderColor.blue),
      borderWidth: borderWidth,
      rotate: PDFLib.degrees(rotate),
    });

    const existingCheckbox = form.getCheckBox(id);

    isChecked ? existingCheckbox.check() : existingCheckbox.uncheck();
    isReadOnly ? existingCheckbox.enableReadOnly() : existingCheckbox.disableReadOnly();
  }

  static async drawLinkOnPage(pdfDoc, pdfPage, operation) {
    console.log(`drawLinkOnPage`);
    console.log(operation);
    const operationPageHeight = pdfPage.getHeight();

    const x = operation.x;
    const y = operation.y;
    const height = operation.height;
    const width = operation.width;
    const borderWidth = parseInt(operation.borderWidth) || 0;
    const borderColor = PDFGenerator.hexToRgb(operation.borderColor || "#007acc");
    const fill = operation.fill || "rgba(0, 122, 204, 0.1)";
    const opacity = parseFloat(operation.opacity, 10) || 1.0;
    const linkType = operation.linkType;
    const linkValue = operation.linkValue;

    // Parse fill color (handle rgba format)
    let fillColor = null;
    if (fill && fill !== "transparent") {
      if (fill.startsWith("rgba(")) {
        // Parse rgba(r, g, b, a) format
        const rgba = fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (rgba) {
          fillColor = {
            red: parseInt(rgba[1]) / 255,
            green: parseInt(rgba[2]) / 255,
            blue: parseInt(rgba[3]) / 255,
            alpha: parseFloat(rgba[4]),
          };
        }
      } else if (fill.startsWith("#")) {
        // Parse hex color
        const rgb = PDFGenerator.hexToRgb(fill);
        fillColor = { ...rgb, alpha: 1.0 };
      }
    }

    // Draw the visual rectangle for the link area
    const rectangleOptions = {
      x: x + borderWidth / 2,
      y: operationPageHeight + borderWidth / 2 - y - height,
      width: width - borderWidth,
      height: height - borderWidth,
      borderWidth: borderWidth,
      borderColor: PDFLib.rgb(borderColor.red, borderColor.green, borderColor.blue),
      opacity: opacity,
    };

    // Only add color and opacity if fill is not transparent
    if (fillColor) {
      rectangleOptions.color = PDFLib.rgb(fillColor.red, fillColor.green, fillColor.blue);
    }

    await pdfPage.drawRectangle(rectangleOptions);

    // Create the link annotation
    const linkAnnotation = {
      x: x,
      y: operationPageHeight - y - height,
      width: width,
      height: height,
    };

    if (linkType === "url") {
      // External URL link
      if (linkValue && (linkValue.startsWith("http://") || linkValue.startsWith("https://"))) {
        pdfPage.node.set(
          PDFLib.PDFName.of("Annots"),
          pdfPage.node.get(PDFLib.PDFName.of("Annots")) || [],
        );

        const linkDict = pdfDoc.context.obj({
          Type: "Annot",
          Subtype: "Link",
          Rect: [
            linkAnnotation.x,
            linkAnnotation.y,
            linkAnnotation.x + linkAnnotation.width,
            linkAnnotation.y + linkAnnotation.height,
          ],
          A: {
            Type: "Action",
            S: "URI",
            URI: PDFLib.PDFString.of(linkValue),
          },
          Border: [0, 0, 0], // No visible border for the annotation
        });

        const linkRef = pdfDoc.context.register(linkDict);
        const annots = pdfPage.node.get(PDFLib.PDFName.of("Annots"));
        if (annots) {
          annots.push(linkRef);
        } else {
          pdfPage.node.set(PDFLib.PDFName.of("Annots"), [linkRef]);
        }
      }
    } else if (linkType === "page") {
      // Internal page link
      const pageNumber = parseInt(linkValue);
      if (pageNumber && pageNumber > 0) {
        const pages = pdfDoc.getPages();
        const targetPageIndex = pageNumber - 1;

        if (targetPageIndex >= 0 && targetPageIndex < pages.length) {
          pdfPage.node.set(
            PDFLib.PDFName.of("Annots"),
            pdfPage.node.get(PDFLib.PDFName.of("Annots")) || [],
          );

          const targetPage = pages[targetPageIndex];
          const linkDict = pdfDoc.context.obj({
            Type: "Annot",
            Subtype: "Link",
            Rect: [
              linkAnnotation.x,
              linkAnnotation.y,
              linkAnnotation.x + linkAnnotation.width,
              linkAnnotation.y + linkAnnotation.height,
            ],
            Dest: [targetPage.ref, "XYZ", null, null, null],
            Border: [0, 0, 0], // No visible border for the annotation
          });

          const linkRef = pdfDoc.context.register(linkDict);
          const annots = pdfPage.node.get(PDFLib.PDFName.of("Annots"));
          if (annots) {
            annots.push(linkRef);
          } else {
            pdfPage.node.set(PDFLib.PDFName.of("Annots"), [linkRef]);
          }
        }
      }
    }
  }

  static async drawNoteOnPage(pdfDoc, pdfPage, operation) {
    const pageHeight = pdfPage.getHeight();
    const { x, y, width, height, text, color } = operation;

    // Convert hex color to RGB array [0-1]
    const rgbColor = PDFGenerator.hexToRgb(color);
    const colorArray = [rgbColor.red, rgbColor.green, rgbColor.blue];

    const noteDict = pdfDoc.context.obj({
      Type: "Annot",
      Subtype: "Text",
      Rect: [x, pageHeight - y - height, x + width, pageHeight - y],
      Contents: PDFLib.PDFString.of(text || ""),
      C: colorArray,
      Name: "Comment", // Icon type
      T: PDFLib.PDFString.of(operation.author || "User"), // Title/Author
    });

    const noteRef = pdfDoc.context.register(noteDict);
    const annots = pdfPage.node.get(PDFLib.PDFName.of("Annots")) || pdfDoc.context.obj([]);
    pdfPage.node.set(PDFLib.PDFName.of("Annots"), annots);
    annots.push(noteRef);
  }
}

export { PDFGenerator };
