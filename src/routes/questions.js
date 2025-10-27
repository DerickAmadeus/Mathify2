const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/questions?module_id=1
router.get('/', async (req, res) => {
    // Ubah string dari query menjadi angka (integer)
    const moduleId = parseInt(req.query.module_id, 10);
    
    if (!moduleId || isNaN(moduleId)) {
        return res.status(400).json({ error: 'module_id required and must be a number' });
    }

    try {
        const { data, error } = await supabase
            .from('questions')
            .select('id, title, formula, instruction, correct_answer')
            .eq('module_id', moduleId)
            .order('id', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch questions', details: err.message });
    }
});

module.exports = router;
