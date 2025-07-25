const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFBillService {
   constructor() {
      this.pageMargin = 30; // Reduced margin for more compact layout
      this.primaryColor = '#800000'; // Maroon color for headers
      this.secondaryColor = '#4a4a4a'; // Dark gray color for text
      this.lightMaroon = '#a52a2a'; // Light maroon for accents
      this.whiteColor = '#ffffff'; // White color
   }

   /**
    * Generate a PDF bill for an order
    * @param {Object} orderData - Order information
    * @param {Object} businessSettings - Business branding settings
    * @returns {PDFDocument} PDF document stream
    */
   async generateBill(orderData, businessSettings = null) {
      const doc = new PDFDocument({
         size: 'A4',
         margin: this.pageMargin,
         info: {
            Title: `Bill - Order #${orderData.id}`,
            Author: businessSettings?.business_name || 'Elite Laundry',
            Subject: 'Service Bill',
            Keywords: 'laundry, bill, invoice'
         }
      });

      // Add business logo if available
      await this.addBusinessHeader(doc, businessSettings);

      // Add bill header
      this.addBillHeader(doc, orderData);

      // Add customer information
      this.addCustomerInfo(doc, orderData);

      // Add services table
      this.addServicesTable(doc, orderData.services || []);

      // Add total amount
      this.addTotalAmount(doc, orderData.total_amount);

      // Add footer
      this.addFooter(doc, businessSettings);

      return doc;
   }

   /**
    * Add business header with logo
    */
   async addBusinessHeader(doc, businessSettings) {
      const startY = doc.y;
      let businessLogoWidth = 0;

      // Add default Elite Laundry logo on the extreme right
      const eliteLogoWidth = 120; // Increased width for better visibility
      const eliteLogoHeight = 30; // Height based on SVG aspect ratio (400x100 = 4:1)
      const rightLogoX = doc.page.width - this.pageMargin - eliteLogoWidth;

      // Try to use the actual logo.svg file first, fallback to manual drawing
      await this.addEliteLaundryLogo(doc, rightLogoX, startY, eliteLogoWidth);

      // Add business logo if available (left side)
      if (businessSettings?.logo_path && fs.existsSync(businessSettings.logo_path)) {
         try {
            doc.image(businessSettings.logo_path, this.pageMargin, startY, {
               width: 60,
               height: 60,
               fit: [60, 60]
            });
            businessLogoWidth = 70; // Logo width + margin
         } catch (error) {
            console.warn('Failed to load business logo:', error.message);
         }
      }

      // Business name and details
      const businessName = businessSettings?.business_name || 'Elite Laundry';
      const textStartX = this.pageMargin + businessLogoWidth;
      const textMaxWidth = rightLogoX - textStartX - 15; // Leave more space for right logo

      doc.fontSize(18)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text(businessName, textStartX, startY, {
            width: textMaxWidth
         });

      doc.fontSize(9)
         .fillColor(this.secondaryColor)
         .font('Helvetica')
         .text('Elite Care for Every Wear', textStartX, startY + 20);

      // Contact information in compact format
      const contactBoxY = startY + 35;
      doc.fontSize(8)
         .fillColor(this.secondaryColor)
         .text('Phone: +91 91758 31200 | Email: info@elitelaundry.org', textStartX, contactBoxY, {
            width: textMaxWidth
         })
         .text('Address: Shop No. 9, Sai Park Town Kiwale, Pune, 412101, MH, IN', textStartX, contactBoxY + 12, {
            width: textMaxWidth
         });

      // Add maroon line separator (ensure it's below both logos)
      const separatorY = Math.max(startY + 65, startY + eliteLogoHeight + 5);
      doc.moveTo(this.pageMargin, separatorY)
         .lineTo(doc.page.width - this.pageMargin, separatorY)
         .strokeColor(this.primaryColor)
         .lineWidth(2)
         .stroke();

      // Move cursor down
      doc.y = separatorY + 10;
   }

   /**
    * Add bill header with order information
    */
   addBillHeader(doc, orderData) {
      const startY = doc.y + 10;

      // Bill title with maroon background
      const titleBoxHeight = 30;
      doc.rect(this.pageMargin, startY, doc.page.width - (this.pageMargin * 2), titleBoxHeight)
         .fillColor(this.primaryColor)
         .fill();

      doc.fontSize(20)
         .fillColor(this.whiteColor)
         .font('Helvetica-Bold')
         .text('SERVICE INVOICE', this.pageMargin, startY + 8, {
            align: 'center',
            width: doc.page.width - (this.pageMargin * 2)
         });

      // Order details in compact format
      const detailsY = startY + 40;

      // Left column - Order details
      doc.fontSize(10)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text('Order Details:', this.pageMargin, detailsY);

      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica')
         .text(`Order ID: #${orderData.id}`, this.pageMargin, detailsY + 15)
         .text(`Date: ${new Date(orderData.created_at).toLocaleDateString('en-IN')}`, this.pageMargin, detailsY + 28)
         .text(`Status: ${orderData.status}`, this.pageMargin, detailsY + 41);

      // Right column - Payment status box (more compact)
      const paymentBoxX = doc.page.width - 150;
      const paymentColor = orderData.payment_status === 'Paid' ? '#10b981' : this.lightMaroon;
      const paymentBgColor = orderData.payment_status === 'Paid' ? '#f0fdf4' : '#fef2f2';

      doc.rect(paymentBoxX, detailsY, 120, 55)
         .fillColor(paymentBgColor)
         .strokeColor(paymentColor)
         .lineWidth(1)
         .fillAndStroke();

      doc.fontSize(9)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Payment Status:', paymentBoxX + 8, detailsY + 8);

      doc.fontSize(12)
         .fillColor(paymentColor)
         .font('Helvetica-Bold')
         .text(orderData.payment_status, paymentBoxX + 8, detailsY + 22);

      // Due date if payment is pending
      if (orderData.payment_status !== 'Paid') {
         doc.fontSize(8)
            .fillColor(this.secondaryColor)
            .font('Helvetica')
            .text('Pay on delivery', paymentBoxX + 8, detailsY + 40);
      }

      // Move cursor down
      doc.y = detailsY + 65;
   }

   /**
    * Add customer information section
    */
   addCustomerInfo(doc, orderData) {
      const startY = doc.y + 10;

      // Customer section with white background and maroon border
      const sectionHeight = orderData.customer_address ? 55 : 45;
      doc.rect(this.pageMargin, startY, doc.page.width - (this.pageMargin * 2), sectionHeight)
         .fillColor(this.whiteColor)
         .strokeColor(this.primaryColor)
         .lineWidth(1)
         .fillAndStroke();

      // Customer section header
      doc.fontSize(10)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text('BILL TO:', this.pageMargin + 10, startY + 8);

      // Customer details in compact format
      doc.fontSize(10)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text(orderData.customer_name || 'N/A', this.pageMargin + 10, startY + 22);

      doc.fontSize(9)
         .font('Helvetica')
         .text(`Phone: ${orderData.customer_phone || 'N/A'}`, this.pageMargin + 10, startY + 35);

      // Customer address if available
      if (orderData.customer_address) {
         doc.text(`Address: ${orderData.customer_address}`, this.pageMargin + 10, startY + 47, {
            width: 400
         });
      }

      // Move cursor down
      doc.y = startY + sectionHeight + 10;
   }

   /**
    * Add services table
    */
   addServicesTable(doc, services) {
      const startY = doc.y + 10;
      const itemHeight = 22; // Reduced height for compact layout

      // Table header
      doc.fontSize(11)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text('SERVICES BREAKDOWN', this.pageMargin, startY);

      // Table header background
      const headerY = startY + 20;
      const tableWidth = doc.page.width - (this.pageMargin * 2);
      doc.rect(this.pageMargin, headerY, tableWidth, 20)
         .fillColor(this.primaryColor)
         .fill();

      // Table headers with compact spacing
      doc.fontSize(9)
         .fillColor(this.whiteColor)
         .font('Helvetica-Bold')
         .text('Service', this.pageMargin + 8, headerY + 6)
         .text('Cloth Type', this.pageMargin + 120, headerY + 6)
         .text('Qty', this.pageMargin + 200, headerY + 6)
         .text('Rate (Rs.)', this.pageMargin + 240, headerY + 6)
         .text('Amount (Rs.)', this.pageMargin + 300, headerY + 6);

      // Table rows
      let currentY = headerY + 20;
      let subtotal = 0;

      services.forEach((service, index) => {
         const amount = (service.quantity || 1) * (service.rate || 0);
         subtotal += amount;

         // Alternate row colors - white and light maroon tint
         const rowColor = index % 2 === 0 ? this.whiteColor : '#fdf2f2';
         doc.rect(this.pageMargin, currentY, tableWidth, itemHeight)
            .fillColor(rowColor)
            .fill();

         doc.fontSize(8)
            .fillColor('#000000')
            .font('Helvetica')
            .text(service.service_type || 'N/A', this.pageMargin + 8, currentY + 7, { width: 110 })
            .text(service.cloth_type || 'N/A', this.pageMargin + 120, currentY + 7, { width: 75 })
            .text((service.quantity || 1).toString(), this.pageMargin + 200, currentY + 7)
            .text(`Rs.${(service.rate || 0).toFixed(2)}`, this.pageMargin + 240, currentY + 7)
            .font('Helvetica-Bold')
            .text(`Rs.${amount.toFixed(2)}`, this.pageMargin + 300, currentY + 7);

         currentY += itemHeight;
      });

      // Add border around table
      doc.rect(this.pageMargin, headerY, tableWidth, currentY - headerY)
         .strokeColor(this.primaryColor)
         .lineWidth(1)
         .stroke();

      // Add subtotal if there are multiple services
      if (services.length > 1) {
         currentY += 8;
         doc.fontSize(10)
            .fillColor(this.secondaryColor)
            .font('Helvetica-Bold')
            .text(`Subtotal: Rs.${subtotal.toFixed(2)}`, this.pageMargin + 300, currentY);
      }

      doc.y = currentY + 15;
   }

   /**
    * Add total amount section
    */
   addTotalAmount(doc, totalAmount) {
      const startY = doc.y + 10;
      const boxWidth = 160;
      const boxHeight = 50;
      const boxX = doc.page.width - this.pageMargin - boxWidth;

      // Total amount box with maroon background
      doc.rect(boxX, startY, boxWidth, boxHeight)
         .fillColor(this.primaryColor)
         .fill();

      doc.rect(boxX + 2, startY + 2, boxWidth - 4, boxHeight - 4)
         .fillColor(this.whiteColor)
         .strokeColor(this.primaryColor)
         .lineWidth(2)
         .fillAndStroke();

      // Total amount text
      doc.fontSize(10)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT', boxX + 10, startY + 8);

      doc.fontSize(18)
         .fillColor(this.primaryColor)
         .font('Helvetica-Bold')
         .text(`Rs.${(totalAmount || 0).toFixed(2)}`, boxX + 10, startY + 25);

      // Add payment terms in compact format
      doc.fontSize(8)
         .fillColor(this.secondaryColor)
         .font('Helvetica')
         .text('Payment Terms: Cash on Delivery', this.pageMargin, startY + 10)
         .text('Thank you for choosing our services!', this.pageMargin, startY + 22);

      doc.y = startY + boxHeight + 15;
   }

   /**
    * Add Elite Laundry logo - try SVG first, fallback to manual drawing
    */
   async addEliteLaundryLogo(doc, x, y, width) {
      const logoPath = path.join(__dirname, '../assets/logo.svg');
      
      try {
         // Check if logo file exists
         if (fs.existsSync(logoPath)) {
            // Convert SVG to PNG buffer using Sharp
            const sharp = require('sharp');
            const logoHeight = width * 0.25; // Maintain aspect ratio from SVG (400x100)
            
            const pngBuffer = await sharp(logoPath)
               .resize(Math.round(width), Math.round(logoHeight))
               .png()
               .toBuffer();
            
            // Add the converted PNG to PDF
            doc.image(pngBuffer, x, y, {
               width: width,
               height: logoHeight
            });
            
            console.log(`Elite Laundry logo added successfully at position (${x}, ${y}) with size ${width}x${logoHeight}`);
            return; // Successfully added SVG logo
         } else {
            console.warn(`Logo file not found at: ${logoPath}`);
         }
      } catch (error) {
         console.warn('Failed to load SVG logo, falling back to manual drawing:', error.message);
      }
      
      // Fallback to manual drawing if SVG loading fails
      this.drawEliteLaundryLogo(doc, x, y, width);
   }

   /**
    * Draw Elite Laundry logo manually using PDFKit drawing commands
    */
   drawEliteLaundryLogo(doc, x, y, width) {
      try {
         // Ensure minimum width to prevent rendering issues
         if (width < 60) {
            width = 60;
         }

         const height = width * 0.25; // Maintain 4:1 aspect ratio
         const iconSize = height; // Square icon area
         const iconCenterX = x + iconSize / 2;
         const iconCenterY = y + iconSize / 2;

         // Save current graphics state
         doc.save();

         // Draw rounded-square background
         const cornerRadius = Math.max(2, iconSize * 0.2);
         doc.roundedRect(x, y, iconSize, iconSize, cornerRadius)
            .fillColor('#9D3744')
            .fill();

         // Draw inner circle
         const circleRadius = Math.max(5, iconSize * 0.38);
         doc.circle(iconCenterX, iconCenterY, circleRadius)
            .fillColor('#FCEAEA')
            .fill();

         // Draw hanger icon with proper scaling
         const hangerScale = Math.max(0.5, iconSize * 0.08); // Better scale factor
         doc.strokeColor('#9D3744')
            .lineWidth(Math.max(1, iconSize * 0.05))
            .lineCap('round')
            .lineJoin('round');

         // Hanger arms
         doc.moveTo(iconCenterX - 8 * hangerScale, iconCenterY + 4 * hangerScale)
            .lineTo(iconCenterX, iconCenterY - 6 * hangerScale)
            .lineTo(iconCenterX + 8 * hangerScale, iconCenterY + 4 * hangerScale)
            .stroke();

         // Hanger bottom bar
         doc.moveTo(iconCenterX - 8 * hangerScale, iconCenterY + 4 * hangerScale)
            .lineTo(iconCenterX + 8 * hangerScale, iconCenterY + 4 * hangerScale)
            .stroke();

         // Hanger hook (simplified as a small line)
         doc.moveTo(iconCenterX - 2 * hangerScale, iconCenterY - 6 * hangerScale)
            .lineTo(iconCenterX + 2 * hangerScale, iconCenterY - 6 * hangerScale)
            .stroke();

         // Add text next to the icon
         const textX = x + iconSize + 8;
         const textWidth = Math.max(50, width - iconSize - 8);

         // "Elite Laundry" text with proper sizing
         const titleFontSize = Math.max(8, Math.min(14, width * 0.15));
         doc.fontSize(titleFontSize)
            .fillColor('#7D0C17')
            .font('Helvetica-Bold')
            .text('Elite', textX, y + height * 0.1, { width: textWidth })
            .text('Laundry', textX, y + height * 0.45, { width: textWidth });

         // Tagline (if there's enough space)
         if (width > 100) {
            const taglineFontSize = Math.max(6, Math.min(8, width * 0.06));
            doc.fontSize(taglineFontSize)
               .fillColor('#C51D23')
               .font('Helvetica')
               .text('Elite Care for Everyday Wear', textX, y + height * 0.8, { width: textWidth });
         }

         // Restore graphics state
         doc.restore();

      } catch (error) {
         console.warn('Failed to draw Elite Laundry logo:', error.message);
         // Fallback: just draw text
         try {
            doc.fontSize(10)
               .fillColor(this.primaryColor)
               .font('Helvetica-Bold')
               .text('Elite Laundry', x, y);
         } catch (fallbackError) {
            console.warn('Fallback logo text also failed:', fallbackError.message);
         }
      }
   }

   /**
    * Add footer with business information
    */
   addFooter(doc, businessSettings) {
      const footerY = doc.page.height - 40;

      // Add a maroon separator line
      doc.moveTo(this.pageMargin, footerY - 10)
         .lineTo(doc.page.width - this.pageMargin, footerY - 10)
         .strokeColor(this.primaryColor)
         .lineWidth(1)
         .stroke();

      // Footer content in compact format
      doc.fontSize(7)
         .fillColor(this.secondaryColor)
         .font('Helvetica')
         .text('For any queries, contact us at +91 91758 31200 or info@elitelaundry.org', this.pageMargin, footerY - 5);

      // Add generation timestamp
      doc.fontSize(7)
         .fillColor(this.secondaryColor)
         .text(`Generated: ${new Date().toLocaleString('en-IN')}`, doc.page.width - 150, footerY - 5);
   }

   /**
    * Create a buffer from the PDF document
    */
   async createBuffer(doc) {
      return new Promise((resolve, reject) => {
         const buffers = [];

         doc.on('data', (chunk) => {
            buffers.push(chunk);
         });

         doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
         });

         doc.on('error', (error) => {
            reject(error);
         });

         doc.end();
      });
   }
}

module.exports = PDFBillService;