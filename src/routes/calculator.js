// src/routes/calculator.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.get('/', (req, res) => {
  res.json({ message: 'Calculator API is running' });
});

router.post('/history', async (req, res) => {
  try {
    const { user_id, expression, result } = req.body;

    if (!user_id || !expression || result === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('calculator_history')
      .insert([{ user_id, expression, result }]);

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ History saved to Supabase:', data);
    res.status(200).json({ message: 'History saved successfully', data });
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
});

module.exports = router;
