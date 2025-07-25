const pool = require('../config/database');

class Order {
  constructor(data) {
    this.id = data.id;
    this.orderNumber = data.order_number;
    this.customerName = data.customer_name;
    this.contactNumber = data.contact_number;
    this.orderDate = data.order_date;
    this.status = data.status;
    this.totalAmount = parseFloat(data.total_amount || 0);
    this.paymentStatus = data.payment_status;
    this.createdBy = data.created_by;
    this.createdByUsername = data.created_by_username; // For joined queries
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.services = data.services || [];
  }

  // Create a new order
  static async create(orderData, createdBy = null) {
    const { customerName, contactNumber, orderDate, services } = orderData;
    
    // Generate order number
    const orderNumber = `ORD${Date.now()}`;
    
    // Calculate total amount
    const totalAmount = services.reduce((sum, service) => 
      sum + (service.quantity * service.unitCost), 0
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert order
      const orderQuery = `
        INSERT INTO orders (order_number, customer_name, contact_number, order_date, total_amount, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        orderNumber, customerName, contactNumber, orderDate, totalAmount, createdBy
      ]);
      
      const order = new Order(orderResult.rows[0]);

      // Insert services
      const servicePromises = services.map(service => {
        const serviceQuery = `
          INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        return client.query(serviceQuery, [
          order.id, service.serviceType, service.clothType, service.quantity, service.unitCost
        ]);
      });

      const serviceResults = await Promise.all(servicePromises);
      order.services = serviceResults.map(result => result.rows[0]);

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Find order by ID with services
  static async findById(id) {
    const query = `
      SELECT o.*, 
             u.username as created_by_username,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1
      GROUP BY o.id, u.username
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Order(result.rows[0]);
  }

  // Find order by order number
  static async findByOrderNumber(orderNumber) {
    const query = `
      SELECT o.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      WHERE o.order_number = $1
      GROUP BY o.id
    `;
    
    const result = await pool.query(query, [orderNumber]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Order(result.rows[0]);
  }

  // Find all orders with optional filtering
  static async findAll(filters = {}) {
    let query = `
      SELECT o.*, 
             u.username as created_by_username,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', os.id,
                   'service_type', os.service_type,
                   'cloth_type', os.cloth_type,
                   'quantity', os.quantity,
                   'unit_cost', os.unit_cost,
                   'total_cost', os.total_cost
                 )
               ) FILTER (WHERE os.id IS NOT NULL), 
               '[]'
             ) as services
      FROM orders o
      LEFT JOIN order_services os ON o.id = os.order_id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.status) {
      paramCount++;
      query += ` AND o.status = $${paramCount}`;
      params.push(filters.status);
    }

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

    if (filters.customerName) {
      paramCount++;
      query += ` AND o.customer_name ILIKE $${paramCount}`;
      params.push(`%${filters.customerName}%`);
    }

    query += ` GROUP BY o.id, u.username ORDER BY o.created_at DESC`;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => new Order(row));
  }

  // Update order status
  async updateStatus(newStatus) {
    const query = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [newStatus, this.id]);
    const updatedOrder = new Order(result.rows[0]);
    
    // Update current instance
    this.status = updatedOrder.status;
    this.updatedAt = updatedOrder.updatedAt;
    
    return this;
  }

  // Update payment status
  async updatePaymentStatus(paymentStatus) {
    const query = `
      UPDATE orders 
      SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [paymentStatus, this.id]);
    const updatedOrder = new Order(result.rows[0]);
    
    // Update current instance
    this.paymentStatus = updatedOrder.paymentStatus;
    this.updatedAt = updatedOrder.updatedAt;
    
    return this;
  }

  // Delete order (cascade will delete services)
  async delete() {
    const query = 'DELETE FROM orders WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Get order statistics
  static async getStatistics(filters = {}) {
    let query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_orders,
        COALESCE(SUM(CASE WHEN status = 'Completed' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN status = 'Completed' THEN total_amount END), 0) as average_order_value
      FROM orders 
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;

    if (filters.startDate) {
      paramCount++;
      query += ` AND order_date >= $${paramCount}`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      paramCount++;
      query += ` AND order_date <= $${paramCount}`;
      params.push(filters.endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }

  // Update complete order details
  async update(updateData) {
    const { customerName, contactNumber, orderDate, services } = updateData;
    
    // Calculate new total amount
    const totalAmount = services.reduce((sum, service) => 
      sum + (service.quantity * service.unitCost), 0
    );

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update order
      const orderQuery = `
        UPDATE orders 
        SET customer_name = $1, contact_number = $2, order_date = $3, total_amount = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      
      const orderResult = await client.query(orderQuery, [
        customerName, contactNumber, orderDate, totalAmount, this.id
      ]);

      // Delete existing services
      await client.query('DELETE FROM order_services WHERE order_id = $1', [this.id]);

      // Insert new services
      const servicePromises = services.map(service => {
        const serviceQuery = `
          INSERT INTO order_services (order_id, service_type, cloth_type, quantity, unit_cost)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        return client.query(serviceQuery, [
          this.id, service.serviceType, service.clothType, service.quantity, service.unitCost
        ]);
      });

      const serviceResults = await Promise.all(servicePromises);

      await client.query('COMMIT');

      // Update current instance
      const updatedOrder = new Order(orderResult.rows[0]);
      this.customerName = updatedOrder.customerName;
      this.contactNumber = updatedOrder.contactNumber;
      this.orderDate = updatedOrder.orderDate;
      this.totalAmount = updatedOrder.totalAmount;
      this.updatedAt = updatedOrder.updatedAt;
      this.services = serviceResults.map(result => result.rows[0]);

      return this;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate bill for completed order
  generateBill() {
    if (this.status !== 'Completed') {
      throw new Error('Bill can only be generated for completed orders');
    }

    return {
      billNumber: `BILL-${this.orderNumber}`,
      orderNumber: this.orderNumber,
      customerName: this.customerName,
      contactNumber: this.contactNumber,
      orderDate: this.orderDate,
      billDate: new Date().toISOString().split('T')[0],
      services: this.services.map(service => ({
        description: `${service.service_type} - ${service.cloth_type}`,
        quantity: service.quantity,
        unitCost: parseFloat(service.unit_cost),
        totalCost: parseFloat(service.total_cost)
      })),
      subtotal: this.totalAmount,
      totalAmount: this.totalAmount,
      paymentStatus: this.paymentStatus || 'Unpaid'
    };
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      customerName: this.customerName,
      contactNumber: this.contactNumber,
      orderDate: this.orderDate,
      status: this.status,
      totalAmount: this.totalAmount,
      paymentStatus: this.paymentStatus,
      services: this.services,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Order;