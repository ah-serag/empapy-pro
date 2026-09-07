const pool = require('../../config/condb'); 
const crypto = require('crypto');

const generateVoucherRef = (type) => {
    const prefix = type === 'RECEIPT' ? 'REC' : 'PAY';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase(); 
    return `${prefix}-${dateStr}-${randomPart}`;
};

exports.createVoucher = async (req, res) => {
    const client = await pool.connect();

    try {
        const { 
            voucher_type,
            safe_id, 
            account_id,
            amount, 
            party_type, 
            party_id, 
            description 
        } = req.body;
        
        const user_id = req.user.id; 

        if (!['RECEIPT', 'PAYMENT'].includes(voucher_type)) throw new Error("نوع السند غير صالح.");
        if (!safe_id) throw new Error("يجب تحديد الخزنة.");
        if (!account_id) throw new Error("يجب تحديد البند المحاسبي.");
        if (amount <= 0) throw new Error("المبلغ يجب أن يكون أكبر من الصفر.");
        if (!description || description.trim().length === 0) throw new Error("يجب إدخال البيان.");

    
        await client.query('BEGIN');


        const safeQuery = await client.query(`SELECT balance, name FROM safes WHERE id = $1 FOR UPDATE`, [safe_id]);
        
        if (safeQuery.rows.length === 0) {
            throw new Error("الخزنة المحددة غير موجودة.");
        }

        const currentBalance = parseFloat(safeQuery.rows[0].balance);
        const safeName = safeQuery.rows[0].name;

        if (voucher_type === 'PAYMENT' && currentBalance < amount) {
            throw new Error(`عملية مرفوضة: رصيد خزنة "${safeName}" (${currentBalance} ج.م) لا يكفي لصرف مبلغ (${amount} ج.م).`);
        }

        let voucher_number = generateVoucherRef(voucher_type);
        let isVoucherInserted = false;
        let newVoucherId = null;

        while (!isVoucherInserted) {
            await client.query('SAVEPOINT voucher_insert_point');
            
            try {
                const voucherResult = await client.query(`
                    INSERT INTO treasury_vouchers (
                        voucher_number, voucher_type, safe_id, amount, party_type, 
                        party_id, description, status, created_by, approved_by, approved_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'POSTED', $8, $9, CURRENT_TIMESTAMP)
                    RETURNING id
                `, [
                    voucher_number, 
                    voucher_type, 
                    safe_id, 
                    amount, 
                    party_type || 'OTHER', 
                    party_id || null, 
                    description, 
                    user_id, 
                    user_id
                ]);
                
                newVoucherId = voucherResult.rows[0].id;
                isVoucherInserted = true;
            } catch (err) {
                if (err.code === '23505' && err.constraint === 'treasury_vouchers_voucher_number_key') {
                    await client.query('ROLLBACK TO SAVEPOINT voucher_insert_point');
                    voucher_number = generateVoucherRef(voucher_type);
                } else {
                    throw err; 
                }
            }
        }

        const transactionType = voucher_type === 'RECEIPT' ? 'IN' : 'OUT';
        const transactionNotes = `سند يدوي رقم: ${voucher_number} - ${description}`;

        await client.query(`
            INSERT INTO treasury_transactions (
                safe_id, account_id, transaction_type, amount, 
                reference_type, reference_id, notes, created_by
            ) VALUES ($1, $2, $3, $4, 'VOUCHER', $5, $6, $7)
        `, [
            safe_id, 
            account_id, 
            transactionType, 
            amount, 
            newVoucherId, 
            transactionNotes, 
            user_id
        ]);

        if (transactionType === 'IN') {
            await client.query(`UPDATE safes SET balance = balance + $1 WHERE id = $2`, [amount, safe_id]);
        } else {
            await client.query(`UPDATE safes SET balance = balance - $1 WHERE id = $2`, [amount, safe_id]);
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'تم إصدار السند وترحيله للخزينة بنجاح.',
            data: { voucher_id: newVoucherId, voucher_number }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("VOUCHER_CREATE_ERROR:", error);
        res.status(400).json({ success: false, message: error.message });
    } finally {
        client.release(); // تحرير الاتصال بقاعدة البيانات
    }
};


exports.getVouchers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 15, 
            search = '', 
            status = '', 
            voucher_type = '', 
            start_date, 
            end_date 
        } = req.query;

        // حساب الـ Offset للـ Pagination
        const offset = (page - 1) * limit;

        // مصفوفات لبناء الاستعلام الديناميكي الآمن
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        // 1. فلتر البحث الشامل (يبحث في كل شيء)
        if (search) {
            conditions.push(`(
                v.voucher_number ILIKE $${paramIndex} OR 
                v.description ILIKE $${paramIndex} OR 
                s.name ILIKE $${paramIndex} OR 
                a.name ILIKE $${paramIndex} OR 
                u.full_name ILIKE $${paramIndex}
            )`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        // 2. فلتر الحالة (POSTED, DRAFT)
        if (status) {
            conditions.push(`v.status = $${paramIndex}`);
            values.push(status);
            paramIndex++;
        }

        // 3. فلتر نوع السند (RECEIPT, PAYMENT)
        if (voucher_type) {
            conditions.push(`v.voucher_type = $${paramIndex}`);
            values.push(voucher_type);
            paramIndex++;
        }

        // 4. فلاتر التاريخ (من - إلى)
        if (start_date) {
            conditions.push(`v.voucher_date >= $${paramIndex}`);
            values.push(`${start_date} 00:00:00`);
            paramIndex++;
        }
        if (end_date) {
            conditions.push(`v.voucher_date <= $${paramIndex}`);
            values.push(`${end_date} 23:59:59`);
            paramIndex++;
        }

        // تجميع الشروط
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // الاستعلام الرئيسي لجلب البيانات
        const query = `
            SELECT 
                v.id, 
                v.voucher_number, 
                v.voucher_type, 
                v.amount, 
                v.party_type, 
                v.description, 
                v.voucher_date, 
                v.status,
                u.full_name AS created_by_name,
                s.name AS safe_name,
                a.name AS account_name,
                t.id AS transaction_id
            FROM treasury_vouchers v
            JOIN users u ON v.created_by = u.id
            LEFT JOIN safes s ON v.safe_id = s.id
            -- الربط مع العمليات لجلب البند المحاسبي
            LEFT JOIN treasury_transactions t ON t.reference_id = v.id AND t.reference_type = 'VOUCHER'
            LEFT JOIN accounts a ON t.account_id = a.id
            ${whereClause}
            ORDER BY v.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        // استعلام لحساب العدد الإجمالي للصفحات (لـ Pagination)
        const countQuery = `
            SELECT COUNT(*) 
            FROM treasury_vouchers v
            JOIN users u ON v.created_by = u.id
            LEFT JOIN safes s ON v.safe_id = s.id
            LEFT JOIN treasury_transactions t ON t.reference_id = v.id AND t.reference_type = 'VOUCHER'
            LEFT JOIN accounts a ON t.account_id = a.id
            ${whereClause}
        `;

        // إضافة متغيرات الـ Pagination للمصفوفة
        const queryValues = [...values, limit, offset];

        // تنفيذ الاستعلامات بالتوازي لسرعة الأداء
        const [result, countResult] = await Promise.all([
            pool.query(query, queryValues),
            pool.query(countQuery, values)
        ]);

        const totalRecords = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalRecords / limit);

        res.status(200).json({ 
            success: true, 
            data: result.rows,
            pagination: {
                total_records: totalRecords,
                total_pages: totalPages,
                current_page: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error("GET_VOUCHERS_ERROR:", error);
        res.status(500).json({ success: false, message: 'حدث خطأ غير متوقع أثناء جلب السندات.' });
    }
};