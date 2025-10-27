const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * @swagger
 * /api/modules:
 *   get:
 *     summary: Get all modules
 *     description: Retrieve a list of all available practice modules
 *     tags:
 *       - Modules
 *     responses:
 *       200:
 *         description: List of modules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   total_questions:
 *                     type: integer
 *                   duration_minutes:
 *                     type: integer
 *                   difficulty:
 *                     type: string
 *                   created_at:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     description: Retrieve a specific module by its ID
 *     tags:
 *       - Modules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module found
 *       404:
 *         description: Module not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ 
        success: false,
        error: 'Module not found' 
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('Error fetching module:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/modules:
 *   post:
 *     summary: Create a new module
 *     description: Add a new practice module to the database
 *     tags:
 *       - Modules
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - total_questions
 *               - duration_minutes
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               total_questions:
 *                 type: integer
 *               duration_minutes:
 *                 type: integer
 *               difficulty:
 *                 type: string
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Invalid input
 */
router.post('/', async (req, res) => {
  try {
    const { title, description, total_questions, duration_minutes, difficulty } = req.body;

    // Basic validation
    if (!title || !total_questions || !duration_minutes) {
      return res.status(400).json({ 
        success: false,
        error: 'Title, total_questions, and duration_minutes are required' 
      });
    }

    const { data, error } = await supabase
      .from('modules')
      .insert([{ 
        title, 
        description: description || '', 
        total_questions, 
        duration_minutes,
        difficulty: difficulty || 'medium'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error('Error creating module:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/modules/{id}/progress:
 *   get:
 *     summary: Get user's progress for a module
 *     tags:
 *       - Modules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Progress data
 */
router.get('/:id/progress', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const userId = req.query.user_id || req.body.user_id; // Get from query or body

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    const { data, error } = await supabase
      .from('user_module_progress')
      .select('*')
      .eq('module_id', moduleId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    res.json({
      success: true,
      data: data || null
    });
  } catch (err) {
    console.error('Error fetching progress:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * @swagger
 * /api/modules/{id}/progress:
 *   post:
 *     summary: Save/update user's progress for a module
 *     tags:
 *       - Modules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, paused, completed]
 *               remaining_seconds:
 *                 type: integer
 *               right_answer:
 *                 type: integer
 *               wrong_answer:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Progress saved
 */
router.post('/:id/progress', async (req, res) => {
  try {
    const moduleId = req.params.id;
    const { user_id, status, remaining_seconds, right_answer, wrong_answer } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    // Check if progress already exists
    const { data: existing } = await supabase
      .from('user_module_progress')
      .select('*')
      .eq('module_id', moduleId)
      .eq('user_id', user_id)
      .single();

    let result;

    if (existing) {
      // Update existing progress
      const updateData = {
        status: status || 'in_progress',
        remaining_seconds: remaining_seconds,
        updated_at: new Date().toISOString()
      };

      if (status === 'in_progress' && !existing.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        
        // Save quiz results when completed
        if (right_answer !== undefined) {
          updateData.right_answer = right_answer;
        }
        if (wrong_answer !== undefined) {
          updateData.wrong_answer = wrong_answer;
        }
      }

      const { data, error } = await supabase
        .from('user_module_progress')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new progress
      const insertData = {
        user_id,
        module_id: moduleId,
        status: status || 'in_progress',
        remaining_seconds: remaining_seconds,
        started_at: status === 'in_progress' ? new Date().toISOString() : null
      };

      if (status === 'completed') {
        insertData.completed_at = new Date().toISOString();
        if (right_answer !== undefined) {
          insertData.right_answer = right_answer;
        }
        if (wrong_answer !== undefined) {
          insertData.wrong_answer = wrong_answer;
        }
      }

      const { data, error } = await supabase
        .from('user_module_progress')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('Error saving progress:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * DELETE /api/modules/:id/progress
 * Delete user progress for a module (restart functionality)
 */
router.delete('/:id/progress', async (req, res) => {
  try {
    const { id: moduleId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'user_id is required'
      });
    }

    // Delete progress
    const { error } = await supabase
      .from('user_module_progress')
      .delete()
      .eq('module_id', moduleId)
      .eq('user_id', user_id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Progress deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting progress:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
