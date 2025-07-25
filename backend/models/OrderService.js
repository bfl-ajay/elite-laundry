const pool = require('../config/database');

class OrderService {
  constructor(data) {
    this.id = data.id;
    this.orderId = data.order_id;
    this.serviceType = data.service_type;
    this.clothType = data.cloth_type;
    this.quantity = parseInt(data.quantity);
    this.unitCost = parseFloat(data.unit_cost);
    this.totalCost = parseFloat(data.total_cost);
  }

  // Create a new order service
  static async create(serviceData) {
    const { orderId, serviceType, clothType, quantity, unitCost } = serviceData;
    
    const query = `
      INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await pool.query(query, [orderId, serviceType, clothType, quantity, unitCost]);
    return new OrderService(result.rows[0]);
  }

  // Find service by ID
  static async findById(id) {
    const query = 'SELECT * FROM order_services WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new OrderService(result.rows[0]);
  }

  // Find all services for an order
  static async findByOrderId(orderId) {
    const query = 'SELECT * FROM order_services WHERE order_id = $1 ORDER BY id';
    const result = await pool.query(query, [orderId]);
    
    return result.rows.map(row => new OrderService(row));
  }

  // Find all services with optional filtering
  static async findAll(filters = {}) {
    let query = 'SELECT * FROM order_services WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.serviceType) {
      paramCount++;
      query += ` AND service_type = $${paramCount}`;
      params.push(filters.serviceType);
    }

    if (filters.clothType) {
      paramCount++;
      query += ` AND cloth_type = $${paramCount}`;
      params.push(filters.clothType);
    }

    if (filters.orderId) {
      paramCount++;
      query += ` AND order_id = $${paramCount}`;
      params.push(filters.orderId);
    }

    query += ' ORDER BY id';

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => new OrderService(row));
  }

  // Update service details
  async update(updateData) {
    const { serviceType, clothType, quantity, unitCost } = updateData;
    
    const query = `
      UPDATE order_services 
      SET service_type = $1, cloth_type = $2, quantity = $3, unit_cost = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await pool.query(query, [serviceType, clothType, quantity, unitCost, this.id]);
    const updatedService = new OrderService(result.rows[0]);
    
    // Update current instance
    this.serviceType = updatedService.serviceType;
    this.clothType = updatedService.clothType;
    this.quantity = updatedService.quantity;
    this.unitCost = updatedService.unitCost;
    this.totalCost = updatedService.totalCost;
    
    return this;
  }

  // Delete service
  async delete() {
    const query = 'DELETE FROM order_services WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Get service statistics
  static async getStatistics(filters = {}) {
    let query = `
      SELECT 
        service_type,
        COUNT(*) as service_count,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_revenue,
        AVG(unit_cost) as average_unit_cost
      FROM order_services os
      JOIN orders o ON os.order_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ' GROUP BY service_type ORDER BY total_revenue DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Get cloth type statistics
  static async getClothTypeStatistics(filters = {}) {
    let query = `
      SELECT 
        cloth_type,
        COUNT(*) as service_count,
        SUM(quantity) as total_quantity,
        SUM(total_cost) as total_revenue,
        AVG(unit_cost) as average_unit_cost
      FROM order_services os
      JOIN orders o ON os.order_id = o.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND o.order_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND o.order_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ' GROUP BY cloth_type ORDER BY total_revenue DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      serviceType: this.serviceType,
      clothType: this.clothType,
      quantity: this.quantity,
      unitCost: this.unitCost,
      totalCost: this.totalCost
    };
  }
}

module.exports = OrderService;