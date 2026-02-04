import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Edit3, Check, Star, FolderOpen } from 'lucide-react';
import { authenticatedFetch } from '../../utils/api';

export default function AccountsContent() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', configDir: '' });
  const [error, setError] = useState(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.configDir.trim()) {
      setError('Name and config directory are required');
      return;
    }

    try {
      if (editingAccount) {
        const response = await authenticatedFetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to update account');
          return;
        }
      } else {
        const response = await authenticatedFetch('/api/accounts', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (!response.ok) {
          const data = await response.json();
          setError(data.error || 'Failed to create account');
          return;
        }
      }

      setShowForm(false);
      setEditingAccount(null);
      setFormData({ name: '', configDir: '' });
      fetchAccounts();
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    }
  };

  const handleDelete = async (accountId) => {
    try {
      const response = await authenticatedFetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchAccounts();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      console.error('Error deleting account:', err);
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      const response = await authenticatedFetch(`/api/accounts/${accountId}/default`, {
        method: 'PATCH',
      });
      if (response.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error('Error setting default:', err);
    }
  };

  const startEdit = (account) => {
    setEditingAccount(account);
    setFormData({ name: account.name, configDir: account.config_dir });
    setShowForm(true);
    setError(null);
  };

  const startAdd = () => {
    setEditingAccount(null);
    setFormData({ name: '', configDir: '' });
    setShowForm(true);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-foreground">Claude Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Manage multiple Claude accounts with different configuration directories
          </p>
        </div>
        <Button onClick={startAdd} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="text-sm font-medium text-foreground">
            {editingAccount ? 'Edit Account' : 'New Account'}
          </h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Work, Personal, Team"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Config Directory
            </label>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <Input
                value={formData.configDir}
                onChange={(e) => setFormData({ ...formData, configDir: e.target.value })}
                placeholder="e.g., /home/user/.claude"
                className="w-full"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              The CLAUDE_CONFIG_DIR path where this account's Claude credentials and settings are stored
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              {editingAccount ? 'Save' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingAccount(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{account.name}</span>
                  {account.is_default ? (
                    <Badge variant="success" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                      Default
                    </Badge>
                  ) : null}
                </div>
                <div className="text-sm text-muted-foreground truncate" title={account.config_dir}>
                  {account.config_dir}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {!account.is_default && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSetDefault(account.id)}
                  title="Set as default"
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Star className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(account)}
                title="Edit account"
                className="text-gray-500 hover:text-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(account.id)}
                title="Delete account"
                className="text-gray-500 hover:text-red-600"
                disabled={accounts.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No accounts configured. A default account will be created automatically.
          </div>
        )}
      </div>
    </div>
  );
}
