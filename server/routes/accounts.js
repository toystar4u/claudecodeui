import express from 'express';
import { accountsDb } from '../database/db.js';

const router = express.Router();

// Get all accounts for the authenticated user
router.get('/', async (req, res) => {
  try {
    // Ensure user has at least one account
    accountsDb.ensureDefaultAccount(req.user.id);
    const accounts = accountsDb.getAccounts(req.user.id);
    res.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Create a new account
router.post('/', async (req, res) => {
  try {
    const { name, configDir } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    if (!configDir || !configDir.trim()) {
      return res.status(400).json({ error: 'Config directory is required' });
    }

    const result = accountsDb.createAccount(req.user.id, name.trim(), configDir.trim(), false);
    res.json({ success: true, account: result });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Update an account
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, configDir } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Account name is required' });
    }

    if (!configDir || !configDir.trim()) {
      return res.status(400).json({ error: 'Config directory is required' });
    }

    // Verify the account belongs to this user
    const account = accountsDb.getAccount(parseInt(id));
    if (!account || account.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const success = accountsDb.updateAccount(parseInt(id), name.trim(), configDir.trim());
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Delete an account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the account belongs to this user
    const account = accountsDb.getAccount(parseInt(id));
    if (!account || account.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = accountsDb.deleteAccount(req.user.id, parseInt(id));
    if (result.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Set an account as default
router.patch('/:id/default', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the account belongs to this user
    const account = accountsDb.getAccount(parseInt(id));
    if (!account || account.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const success = accountsDb.setDefaultAccount(req.user.id, parseInt(id));
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Account not found' });
    }
  } catch (error) {
    console.error('Error setting default account:', error);
    res.status(500).json({ error: 'Failed to set default account' });
  }
});

export default router;
