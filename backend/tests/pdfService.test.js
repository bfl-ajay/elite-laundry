const PDFBillService = require('../services/pdfService');

describe('PDFBillService', () => {
  let pdfService;
  
  beforeEach(() => {
    pdfService = new PDFBillService();
  });

  describe('generateBill', () => {
    it('should create a PDF document with order data', async () => {
      const mockOrderData = {
        id: 123,
        customer_name: 'John Doe',
        customer_phone: '+91 9876543210',
        customer_address: '123 Main Street, City, State',
        status: 'Completed',
        payment_status: 'Paid',
        total_amount: 250.00,
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
          }
        ]
      };

      const mockBusinessSettings = {
        business_name: 'Test Laundry Service',
        logo_path: null
      };

      const doc = await pdfService.generateBill(mockOrderData, mockBusinessSettings);
      
      expect(doc).toBeDefined();
      expect(doc.constructor.name).toBe('PDFDocument');
    });

    it('should handle missing business settings', async () => {
      const mockOrderData = {
        id: 456,
        customer_name: 'Jane Smith',
        customer_phone: '+91 9876543210',
        status: 'Pending',
        payment_status: 'Pending',
        total_amount: 150.00,
        created_at: new Date().toISOString(),
        services: []
      };

      const doc = await pdfService.generateBill(mockOrderData);
      
      expect(doc).toBeDefined();
      expect(doc.constructor.name).toBe('PDFDocument');
    });

    it('should create PDF buffer', async () => {
      const mockOrderData = {
        id: 789,
        customer_name: 'Test Customer',
        customer_phone: '+91 9876543210',
        status: 'Completed',
        payment_status: 'Paid',
        total_amount: 100.00,
        created_at: new Date().toISOString(),
        services: [
          {
            service_type: 'Dry Cleaning',
            cloth_type: 'Normal Clothes',
            quantity: 1,
            rate: 100.00
          }
        ]
      };

      const doc = await pdfService.generateBill(mockOrderData);
      const buffer = await pdfService.createBuffer(doc);
      
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      
      // Check PDF header
      const pdfHeader = buffer.toString('ascii', 0, 4);
      expect(pdfHeader).toBe('%PDF');
    });
  });
});