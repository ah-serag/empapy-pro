const db = require('../../config/condb'); 


const teamController = {

   async create(req, res) {
        try {
            const { name, team_type, zone_id, supervisor_id, is_active, max_daily_tasks, notes } = req.body;

            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Name is required' });
            }
                  
            const checkName = await db.query(`SELECT 1 FROM teams WHERE name = $1`, [name.trim()]);
            
            if (checkName.rowCount > 0) {
                return res.status(409).json({ success: false, message: "هذا الاسم متواجد بالفعل" });
            }

            if (supervisor_id) {
                const checkSupervisor = await db.query(`SELECT 1 FROM teams WHERE supervisor_id = $1`, [supervisor_id]);
                
                if (checkSupervisor.rowCount > 0) {
                    return res.status(409).json({ success: false, message: "هذا المشرف مسؤول عن فريق آخر بالفعل" });
                }
            }

            const queryText = `
                INSERT INTO teams (name, team_type, zone_id, supervisor_id, is_active, max_daily_tasks, notes)
                VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), COALESCE($6, 5), $7)
                RETURNING *;
            `;
            const values = [name.trim(), team_type || 'mixed', zone_id || null, supervisor_id || null, is_active, max_daily_tasks, notes];
            
            const result = await db.query(queryText, values);
            return res.status(201).json({ success: true, message: "Team created successfully", data: result.rows[0] });
            
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    } ,

    async getAll(req, res) {
        try {
            const { search, team_type, is_active, zone_id, governorate_id, limit = 10, page = 1 } = req.query;
            
            const parsedLimit = parseInt(limit) || 10;
            const offset = ((parseInt(page) || 1) - 1) * parsedLimit;
            
            let queryText = `
                SELECT 
                    t.*,
                    u.full_name AS supervisor_name,
                    u.email AS supervisor_email,
                    u.phone AS supervisor_phone,
                    z.name_en AS zone_name_en,
                    z.name_ar AS zone_name_ar,
                    g.id AS governorate_id,
                    g.name_en AS governorate_name_en,
                    g.name_ar AS governorate_name_ar,
                    -- جلب الأعضاء النشطين فوراً كـ Array مدمج في ريكويست واحد متضمناً رقم الهاتف
                    COALESCE(
                        (SELECT jsonb_agg(jsonb_build_object(
                            'user_id', um.id,
                            'full_name', um.full_name,
                            'email', um.email,
                            'phone', um.phone,
                            'role_in_team', tm.role_in_team
                        )) 
                         FROM team_members tm 
                         JOIN users um ON tm.user_id = um.id 
                         WHERE tm.team_id = t.id AND tm.is_active = TRUE), 
                        '[]'::jsonb
                    ) AS members,
                    COUNT(*) OVER() AS total_count
                FROM teams t
                LEFT JOIN users u ON t.supervisor_id = u.id
                LEFT JOIN zones z ON t.zone_id = z.id
                LEFT JOIN governorates g ON z.governorate_id = g.id
                WHERE 1=1
            `;
            const values = [];
            let counter = 1;

            // البحث الذكي: يشمل اسم الفريق، اسم/إيميل/تليفون المشرف، واسم/إيميل/تليفون أي عضو في الفريق
            if (search) {
                queryText += ` AND (
                    t.name ILIKE $${counter} OR 
                    u.full_name ILIKE $${counter} OR
                    u.phone ILIKE $${counter} OR
                    EXISTS (
                        SELECT 1 FROM team_members tm
                        JOIN users um ON tm.user_id = um.id
                        WHERE tm.team_id = t.id AND tm.is_active = TRUE 
                        AND (um.full_name ILIKE $${counter} OR um.email ILIKE $${counter} OR um.phone ILIKE $${counter})
                    )
                )`;
                values.push(`%${search.trim()}%`);
                counter++;
            }
            if (team_type && team_type !== 'all') {
                queryText += ` AND t.team_type = $${counter}`;
                values.push(team_type);
                counter++;
            }
            if (is_active !== undefined && is_active !== 'all') {
                queryText += ` AND t.is_active = $${counter}`;
                values.push(is_active === 'true');
                counter++;
            }
            if (zone_id && zone_id !== '0') {
                queryText += ` AND t.zone_id = $${counter}`;
                values.push(parseInt(zone_id));
                counter++;
            }
            if (governorate_id && governorate_id !== '0') {
                queryText += ` AND g.id = $${counter}`;
                values.push(parseInt(governorate_id));
                counter++;
            }

            queryText += ` ORDER BY t.id DESC LIMIT $${counter} OFFSET $${counter + 1}`;
            values.push(parsedLimit, offset);

            const result = await db.query(queryText, values);
            const totalRecords = result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0;

            const cleanData = result.rows.map(row => {
                const { total_count, ...rest } = row;
                return rest;
            });

            return res.status(200).json({ 
                success: true, 
                data: {
                    teams: cleanData,
                    pagination: {
                        total_records: totalRecords,
                        total_pages: Math.ceil(totalRecords / parsedLimit),
                        current_page: parseInt(page) || 1
                    }
                } 
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    async getById(req, res) {
        try {
            const { id } = req.params;
            if (isNaN(Number(id))) {
         return res.status(400).json({ success: false, message: 'Invalid ID format. Must be a number.' });
        }
            const teamQuery = `
                SELECT 
                    t.*,
                    u.full_name AS supervisor_name,
                    u.email AS supervisor_email,
                    u.phone AS supervisor_phone,
                    z.name_en AS zone_name_en,
                    z.name_ar AS zone_name_ar,
                    g.id AS governorate_id,
                    g.name_en AS governorate_name_en,
                    g.name_ar AS governorate_name_ar
                FROM teams t
                LEFT JOIN users u ON t.supervisor_id = u.id
                LEFT JOIN zones z ON t.zone_id = z.id
                LEFT JOIN governorates g ON z.governorate_id = g.id
                WHERE t.id = $1
            `;
            const teamResult = await db.query(teamQuery, [id]);
            
            if (teamResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Team not found' });
            }

            const membersQuery = `
                SELECT 
                    tm.id AS membership_id,
                    tm.role_in_team,
                    tm.joined_at,
                    tm.left_at,
                    tm.is_active AS membership_active,
                    u.id AS user_id,
                    u.full_name,
                    u.email,
                    u.phone,
                    u.role AS user_system_role
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                WHERE tm.team_id = $1
                ORDER BY tm.is_active DESC, tm.joined_at DESC
            `;
            const membersResult = await db.query(membersQuery, [id]);

            const teamData = teamResult.rows[0];
            teamData.members = membersResult.rows;

            return res.status(200).json({ success: true, data: teamData });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },

 async updateTeamStatus (req, res)  {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const teamId = parseInt(id, 10);
    if (isNaN(teamId) || teamId <= 0) {
      return res.status(400).json({
        success: false,
        message: "رقم الفريق غير صالح.",
      });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "يجب إرسال حالة التفعيل (is_active) كـ true أو false.",
      });
    }

    const queryText = `
      UPDATE teams
      SET is_active = $1
      WHERE id = $2
      RETURNING id, name, team_type, is_active;
    `;

    const result = await db.query(queryText, [is_active, teamId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "الفريق غير موجود.",
      });
    }

    const updatedTeam = result.rows[0];

    return res.status(200).json({
      success: true,
      message: `تم ${updatedTeam.is_active ? "تفعيل" : "تعطيل"} الفريق بنجاح.`,
      data: updatedTeam,
    });

  } catch (error) {
    console.error("Error in updateTeamStatus:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر أثناء تغيير حالة الفريق.",
    });
  }
},




 async update(req, res) {
        try {
            const { id } = req.params;
            const fields = req.body;

            if (Object.keys(fields).length === 0) {
                return res.status(400).json({ success: false, message: 'No fields provided' });
            }

            if (fields.name !== undefined) {
                if (typeof fields.name !== 'string' || fields.name.trim().length === 0) {
                    return res.status(400).json({ success: false, message: 'Name is required' });
                }
                
                fields.name = fields.name.trim();

                const checkName = await db.query(`SELECT 1 FROM teams WHERE name = $1 AND id != $2`, [fields.name, id]);
                
                if (checkName.rowCount > 0) {
                    return res.status(409).json({ success: false, message: "هذا الاسم متواجد بالفعل" });
                }
            }

            if (fields.supervisor_id) {
                const checkSupervisor = await db.query(`SELECT 1 FROM teams WHERE supervisor_id = $1 AND id != $2`, [fields.supervisor_id, id]);
                
                if (checkSupervisor.rowCount > 0) {
                    return res.status(409).json({ success: false, message: "هذا المشرف مسؤول عن فريق آخر بالفعل" });
                }
            }

            const setClause = [];
            const values = [];
            let counter = 1;

            for (const [key, value] of Object.entries(fields)) {
                setClause.push(`${key} = $${counter}`);
                values.push(value);
                counter++;
            }
            values.push(id);

            const queryText = `UPDATE teams SET ${setClause.join(', ')} WHERE id = $${counter} RETURNING *`;
            const result = await db.query(queryText, values);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Team not found' });
            }
            
            return res.status(200).json({ success: true, message: 'Team updated successfully', data: result.rows[0] });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    } ,




    async delete(req, res) {
        try {
            const { id } = req.params;

            const checkAssignment = await db.query(`SELECT * FROM assignments a WHERE  a.team_id = $1 ` , [id])
             
              if(checkAssignment.rowCount > 0) {
                 return res.status(404).json({ success: false, message: ' يوجد تكليفات مرتبطه للفريق لا يمكن الحذف ' })
              }

            const result = await db.query('DELETE FROM teams WHERE id = $1 RETURNING *', [id]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Team not found' });
            return res.status(200).json({ success: true, message: 'Team deleted successfully' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    },




// Add Member to a Team
async addMember(req, res) {
        try {
            const team_id = parseInt(req.params.id, 10);
            const user_id = parseInt(req.body.user_id, 10);
            const role_in_team = req.body.role_in_team;

            if (isNaN(team_id) || isNaN(user_id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "بيانات غير صالحة: يجب توفير رقم صحيح للفريق والموظف." 
                });
            }

            const allowedRoles = ['leader', 'member', 'trainee'];
            const assignedRole = role_in_team || 'member';

            if (!allowedRoles.includes(assignedRole)) {
                return res.status(400).json({ 
                    success: false, 
                    message: `صلاحية غير صالحة. القيم المسموحة هي: ${allowedRoles.join(', ')}` 
                });
            }

            const checkMember = await db.query(`SELECT 1 FROM team_members WHERE user_id = $1`, [user_id]);
            
            if (checkMember.rowCount > 0) {
                return res.status(409).json({
                    success: false,
                    message: "هذا الموظف موجود بالفعل في فريق. يجب إزالته من فريقه القديم أولاً."
                });
            }

            const userCheck = await db.query(`SELECT role FROM users WHERE id = $1`, [user_id]);
            
            if (userCheck.rowCount === 0) {
                return res.status(404).json({ success: false, message: "هذا الموظف غير مسجل في النظام." });
            }

            const teamCheck = await db.query(`SELECT supervisor_id FROM teams WHERE id = $1`, [team_id]);
            
            if (teamCheck.rowCount === 0) {
                return res.status(404).json({ success: false, message: "هذا الفريق غير مسجل في النظام." });
            }

            const globalUserRole = userCheck.rows[0].role;
            const teamSupervisorId = teamCheck.rows[0].supervisor_id;

            if (globalUserRole === 'supervisor' && teamSupervisorId !== user_id) {
                return res.status(403).json({
                    success: false,
                    message: "غير مصرح: المشرف لا يمكنه الانضمام كعضو إلا في الفريق الذي يشرف عليه فقط."
                });
            }

            const insertQuery = `
                INSERT INTO team_members (team_id, user_id, role_in_team, joined_at)
                VALUES ($1, $2, $3::team_member_role, CURRENT_DATE)
                RETURNING *;
            `;
            
            const result = await db.query(insertQuery, [team_id, user_id, assignedRole]);
            
            return res.status(201).json({ 
                success: true, 
                message: "تم إضافة الموظف للفريق بنجاح.", 
                data: result.rows[0] 
            });

        } catch (error) {
            console.error("Error in addMember:", error.message); 

            if (error.code === '23503') {
                return res.status(404).json({ 
                    success: false, 
                    message: "الموظف أو الفريق غير مسجل في قاعدة البيانات." 
                });
            }

            return res.status(500).json({ 
                success: false, 
                message: "حدث خطأ داخلي في الخادم." 
            });
        }
    },




async removeMember(req, res) {
        try {
            const { id, memberId } = req.params;
            
            // الحذف النهائي من الجدول
            const queryText = `
                DELETE FROM team_members 
                WHERE team_id = $1 AND user_id = $2 
                RETURNING *;
            `;
            
            const result = await db.query(queryText, [id, memberId]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Member not found in team' });
            }
            
            return res.status(200).json({ success: true, message: 'Member permanently removed from the team' });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
,
  async getTeamsSelector (req, res) {

  try {
    const queryText = "SELECT id, name FROM teams ORDER BY name ASC";
    const result = await db.query(queryText);
    
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getTeams controller:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
}



};



module.exports = teamController;