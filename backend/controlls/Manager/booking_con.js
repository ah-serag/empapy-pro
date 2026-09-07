const pool = require("../../config/condb");
const socket = require("../../config/socket");

const generateBookingRef = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BK-${dateStr}-${randomStr}`;
};


const createBooking = async (req, res) => {
  try {
    const {
      zone_id,
      contact_name,
      contact_phone,
      contact_email,
      address,
      latitude,
      longitude,
      preferred_date,
      notes,
      location_url,
      source
    } = req.body;

    const clean_name = contact_name ? String(contact_name).trim() : "";
    const clean_phone = contact_phone ? String(contact_phone).trim() : "";
    const clean_address = address ? String(address).trim() : "";
    const clean_date = preferred_date ? String(preferred_date).trim() : "";
    const clean_email = contact_email ? String(contact_email).trim() : null;
    const clean_notes = notes ? String(notes).trim() : null;
    
    // تم تصحيح الخطأ هنا واستخدام source بدلاً من preferred_date مع وضع قيمة افتراضية web إذا لم يتم إرساله
    const clean_source = source ? String(source).trim() : "web"; 

    // Validate required fields
    if (!clean_name || !clean_phone || !clean_address || !clean_date) {
      return res.status(400).json({
        success: false,
        message: "Contact name, phone, address, and preferred date are required.",
      });
    }

    if (isNaN(Date.parse(clean_date))) {
      return res.status(400).json({ success: false, message: "Invalid date format." });
    }

    // Validate booking source against allowed enum values
    const VALID_SOURCES = ['internal_system', 'web', 'page_booking'];
    if (!VALID_SOURCES.includes(clean_source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking source. Allowed values are: internal_system, web, page_booking",
      });
    }

    let parsed_zone_id = null;
    if (zone_id) {
      parsed_zone_id = parseInt(zone_id, 10);
      if (isNaN(parsed_zone_id)) {
        return res.status(400).json({ success: false, message: "Invalid zone ID format." });
      }
      
      const zoneCheck = await pool.query(`SELECT id FROM zones WHERE id = $1`, [parsed_zone_id]);
      
      if (zoneCheck.rows.length === 0) {
        return res.status(400).json({
            success: false,
            message: "The specified zone ID does not exist.",
          });
      }
    }

    const booking_ref = generateBookingRef();

    const result = await pool.query(
      `INSERT INTO bookings (
        booking_ref, zone_id, contact_name, contact_phone, contact_email,
        address, latitude, longitude, preferred_date, notes, location_url, source, status, payment_status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', 'unpaid')
       RETURNING *`,
      [
        booking_ref,
        parsed_zone_id,
        clean_name,
        clean_phone,
        clean_email,
        clean_address,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        clean_date,
        clean_notes,
        location_url,
        clean_source 
      ]
    );

    const savedBooking = result.rows[0];

   
    if(source != "internal_system"){

 const notificationTitle = "New Booking Received";
    const notificationMessage = `${booking_ref}`;

    const notificationResult = await pool.query(
      `INSERT INTO notifications (title, message, type, is_read) 
       VALUES ($1, $2, 'booking', false) 
       RETURNING *`,
      [notificationTitle, notificationMessage]
    );

    const savedNotification = notificationResult.rows[0];

         const io = socket.getIo();
    io.to('manager-room').emit('notification:new_booking', {
        notification: savedNotification,
    });
    }
 

    return res.status(201).json({ success: true, data: savedBooking });
  } catch (err) {
    console.error("Error creating booking:", err);
    return res.status(500).json({
        success: false,
        message: "Internal server error during booking creation.",
      });
  }
};

const getAdvancedBookings = async (req, res) => {
  try {
    const {
      search,
      status,
      payment_status,
      source,
      zone_id,
      start_date,
      end_date,
    } = req.query;

    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
    const offset = (page - 1) * limit;

    let conditions = `
      FROM bookings b
      LEFT JOIN zones z ON b.zone_id = z.id
      LEFT JOIN governorates g ON z.governorate_id = g.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions += ` AND (b.booking_ref ILIKE $${paramIndex} OR b.contact_name ILIKE $${paramIndex} OR b.contact_phone ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      conditions += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (payment_status) {
      conditions += ` AND b.payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

    if (source) {
      const VALID_SOURCES = ['internal_system', 'web', 'page_booking'];
      if (!VALID_SOURCES.includes(source)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking source. Allowed values are: internal_system, web, page_booking",
        });
      }
      conditions += ` AND b.source = $${paramIndex}`;
      params.push(source);
      paramIndex++;
    }

    if (zone_id) {
      conditions += ` AND b.zone_id = $${paramIndex}`;
      params.push(zone_id);
      paramIndex++;
    }

    if (start_date && end_date) {
      conditions += ` AND DATE(b.created_at) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(start_date, end_date);
      paramIndex += 2;
    }
    
    const countQuery = `SELECT COUNT(*) ` + conditions;
    const countResult = await pool.query(countQuery, params);
    const totalRecords = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalRecords / limit);

    const dataQuery = `
      SELECT 
        b.*, 
        z.name_ar AS zone_name, 
        g.name_ar AS governorate_name
      ${conditions}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataParams = [...params, limit, offset];
    const result = await pool.query(dataQuery, dataParams);

    const cleanedData = result.rows.map((row) => {
      const { zone_id, ...rest } = row;
      return rest;
    });

    return res.status(200).json({
      success: true,
      data: cleanedData,
      pagination: {
        totalRecords,       
        totalPages,        
        currentPage: page, 
        limit,            
        hasNextPage: page < totalPages, 
        hasPrevPage: page > 1         
      },
    });
  } catch (err) {
    console.error("Database error during advanced search fetching:", err);
    return res.status(500).json({
      success: false,
      message: "Database error during advanced search fetching.",
    });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [
      id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Database error during fetching single booking.",
      });
  }
};

const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;


    const result = await pool.query(
      `UPDATE bookings
       SET status = 'confirmed', confirmed_by = $1, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [userId, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Booking not found or it is not in pending status.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Booking confirmed successfully.",
        data: result.rows[0],
      });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Database error during booking confirmation.",
      });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelled_reason } = req.body;

    if (!cancelled_reason) {
      return res
        .status(400)
        .json({ success: false, message: "Cancellation reason is required." });
    }

    const result = await pool.query(
      `UPDATE bookings
       SET status = 'cancelled', cancelled_reason = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status NOT IN ('completed', 'cancelled', 'rejected')
       RETURNING *`,
      [cancelled_reason, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Booking cannot be cancelled or already finished.",
        });
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Booking cancelled successfully.",
        data: result.rows[0],
      });
  } catch (err) {
    return res
      .status(500)
      .json({
        success: false,
        message: "Database error during booking cancellation.",
      });
  }
};





const updateBookingLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_url } = req.body;

    const result = await pool.query(
      `UPDATE bookings 
       SET location_url = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [location_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found to update location." 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Location URL updated successfully.",
      data: result.rows[0] 
    });
  } catch (err) {
    console.error("Database error during location URL update:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Database error during location update." 
    });
  }
};


module.exports = {
  createBooking,
  getAdvancedBookings,
  getBookingById,
  confirmBooking,
  cancelBooking,

  updateBookingLocation
};
