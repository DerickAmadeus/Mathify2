// src/routes/graph.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get graph history for a user
router.get('/history', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data, error } = await supabase
      .from('graph_history')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(20); // Ambil 20 history terakhir

    if (error) throw error;
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save new graph history
router.post('/history', async (req, res) => {
  try {
    const { user_id, function_expression } = req.body;

    if (!user_id || !function_expression) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('graph_history')
      .insert([{ user_id, function_expression }])
      .select();

    if (error) throw error;
    res.status(200).json({ message: 'Graph history saved', data: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete graph history for a user
router.delete('/history', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { error } = await supabase
      .from('graph_history')
      .delete()
      .eq('user_id', user_id);

    if (error) throw error;
    res.status(200).json({ message: 'Graph history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;