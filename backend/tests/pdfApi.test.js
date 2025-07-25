const PDFBillService = require('../services/pdfService');

describe('PDF Bill Generation Service Integration', () => {
  describe('PDFBillService', () => {
    it('should generate PDF with complete order data', async () => {
      const mockOrderData = {
        id: 123,
        customer_name: 'John Doe',
        customer_phone: '+91 9876543210',
        customer_address: '123 Main Street, Mumbai, Maharashtra 400001',
        status: 'Completed',
        payment_status: 'Paid',
        total_amount: 350.00,
        created_at: new Date().toISOString(),
        services: [
          {
            service_type: 'Washing',
            cloth_type: 'Normal Clothes',
            quantity: 5,
            rate: 30.00
          },
          {
            service_type: 'Ironing',
            cloth_type: 'Saari',
            quantity: 2,
            rate: 50.00
          },
          {
            service_type: 'Dry Cleaning',
            cloth_type: 'Formal Wear',
            quantity: 1,
            rate: 150.00
          }
        ]
      };

      const mockBusinessSettings = {
        business_name: 'Elite Laundry Services',
        logo_path: null
      };

      const pdfService = new PDFBillService();
      const doc = await pdfService.generateBill(mockOrderData, mockBusinessSettings);
      const pdfBuffer = await pdfService.createBuffer(doc);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Should be a substantial PDF
      
      // Check PDF header
      const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });

    it('should handle orders without customer address', async () => {
      const mockOrderData = {
        id: 456,
        customer_name: 'Jane Smith',
        customer_phone: '+91 9876543210',
        customer_address: null,
        status: 'Completed',
        payment_status: 'Pending',
        total_amount: 150.00,
        created_at: new Date().toISOString(),
        services: [
          {
            service_type: 'Washing',
            cloth_type: 'Normal Clothes',
            quantity: 3,
            rate: 50.00
          }
        ]
      };

      const pdfService = new PDFBillService();
      const doc = await pdfService.generateBill(mockOrderData);
      const pdfBuffer = await pdfService.createBuffer(doc);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
    });

    it('should handle orders with no services', async () => {
      const mockOrderData = {
        id: 789,
        customer_name: 'Test Customer',
        customer_phone: '+91 9876543210',
        status: 'Completed',
        payment_status: 'Paid',
        total_amount: 0.00,
        created_at: new Date().toISOString(),
        services: []
      };

      const pdfService = new PDFBillService();
      const doc = await pdfService.generateBill(mockOrderData);
      const pdfBuffer = await pdfService.createBuffer(doc);
      
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(500); // Smaller but still valid PDF
    });
  });
});