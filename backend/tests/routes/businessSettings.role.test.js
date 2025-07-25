const request = require('supertest');
const app = require('../../server');
const RoleTestData = require('../fixtures/roleTestData');
const path = require('path');
const fs = require('fs').promises;

describe('Business Settings API - Role-Based Access Control', () => {
  let testData;

  beforeAll(async () => {
    testData = new RoleTestData();
    await testData.createTestUsers();
  });

  afterAll(async () => {
    await testData.cleanup();
  });

  describe('GET /api/business-settings', () => {
    test('should deny employee access to business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin access to business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin access to business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('businessName');
      expect(response.body.data).toHaveProperty('logoUrl');
      expect(response.body.data).toHaveProperty('faviconUrl');
    });

    test('should deny access without authentication', async () => {
      const response = await request(app)
        .get('/api/business-settings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('PUT /api/business-settings', () => {
    const updateData = {
      businessName: 'Updated Business Name'
    };

    test('should deny employee updating business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin updating business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to update business settings', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.businessName).toBe(updateData.businessName);
    });
  });

  describe('POST /api/business-settings/logo', () => {
    // Create a test image buffer
    const createTestImageBuffer = () => {
      // Simple 1x1 PNG image in base64
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8IQAAAAABJRU5ErkJggg==';
      return Buffer.from(base64Image, 'base64');
    };

    test('should deny employee uploading logo', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader)
        .attach('logo', imageBuffer, 'test-logo.png');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin uploading logo', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader)
        .attach('logo', imageBuffer, 'test-logo.png');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to upload logo', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader)
        .attach('logo', imageBuffer, 'test-logo.png');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('logoUrl');
      expect(response.body.data.logoUrl).toContain('/uploads/branding/');
    });

    test('should validate file type for logo upload', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const textBuffer = Buffer.from('This is not an image', 'utf8');

      const response = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader)
        .attach('logo', textBuffer, 'test-file.txt');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('file type');
    });
  });

  describe('POST /api/business-settings/favicon', () => {
    const createTestImageBuffer = () => {
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8IQAAAAABJRU5ErkJggg==';
      return Buffer.from(base64Image, 'base64');
    };

    test('should deny employee uploading favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/favicon')
        .set('Authorization', authHeader)
        .attach('favicon', imageBuffer, 'test-favicon.ico');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin uploading favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/favicon')
        .set('Authorization', authHeader)
        .attach('favicon', imageBuffer, 'test-favicon.ico');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to upload favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const imageBuffer = createTestImageBuffer();

      const response = await request(app)
        .post('/api/business-settings/favicon')
        .set('Authorization', authHeader)
        .attach('favicon', imageBuffer, 'test-favicon.ico');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('faviconUrl');
      expect(response.body.data.faviconUrl).toContain('/uploads/branding/');
    });
  });

  describe('DELETE /api/business-settings/logo', () => {
    test('should deny employee removing logo', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .delete('/api/business-settings/logo')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin removing logo', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .delete('/api/business-settings/logo')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to remove logo', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .delete('/api/business-settings/logo')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logoUrl).toBeNull();
    });
  });

  describe('DELETE /api/business-settings/favicon', () => {
    test('should deny employee removing favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('employee');

      const response = await request(app)
        .delete('/api/business-settings/favicon')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should deny admin removing favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('admin');

      const response = await request(app)
        .delete('/api/business-settings/favicon')
        .set('Authorization', authHeader);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should allow super admin to remove favicon', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .delete('/api/business-settings/favicon')
        .set('Authorization', authHeader);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.faviconUrl).toBeNull();
    });
  });

  describe('End-to-End Business Settings Workflow', () => {
    test('super admin can manage complete business settings workflow', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');
      const imageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU8IQAAAAABJRU5ErkJggg==', 'base64');

      // 1. Get initial settings
      const initialResponse = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(initialResponse.status).toBe(200);
      const initialBusinessName = initialResponse.body.data.businessName;

      // 2. Update business name
      const updateNameResponse = await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send({ businessName: 'E2E Test Business' });

      expect(updateNameResponse.status).toBe(200);
      expect(updateNameResponse.body.data.businessName).toBe('E2E Test Business');

      // 3. Upload logo
      const logoResponse = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader)
        .attach('logo', imageBuffer, 'e2e-logo.png');

      expect(logoResponse.status).toBe(200);
      expect(logoResponse.body.data.logoUrl).toBeTruthy();

      // 4. Upload favicon
      const faviconResponse = await request(app)
        .post('/api/business-settings/favicon')
        .set('Authorization', authHeader)
        .attach('favicon', imageBuffer, 'e2e-favicon.ico');

      expect(faviconResponse.status).toBe(200);
      expect(faviconResponse.body.data.faviconUrl).toBeTruthy();

      // 5. Verify all settings are updated
      const finalResponse = await request(app)
        .get('/api/business-settings')
        .set('Authorization', authHeader);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.data.businessName).toBe('E2E Test Business');
      expect(finalResponse.body.data.logoUrl).toBeTruthy();
      expect(finalResponse.body.data.faviconUrl).toBeTruthy();

      // 6. Clean up - restore original business name
      await request(app)
        .put('/api/business-settings')
        .set('Authorization', authHeader)
        .send({ businessName: initialBusinessName });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing file in logo upload', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/business-settings/logo')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('file');
    });

    test('should handle missing file in favicon upload', async () => {
      const authHeader = testData.getBasicAuthHeader('superAdmin');

      const response = await request(app)
        .post('/api/business-settings/favicon')
        .set('Authorization', authHeader);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('file');
    });

    test('should handle invalid authentication', async () => {
      const response = await request(app)
        .get('/api/business-settings')
        .set('Authorization', 'Basic invalid_credentials');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_FAILED');
    });
  });
});