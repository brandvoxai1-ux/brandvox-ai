// client/src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { formatCredits, formatDate } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Search, UserCheck, Shield, Ban, Trash2, Coins, RefreshCw, X } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Modals state
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditAction, setCreditAction] = useState('grant'); // 'grant' | 'deduct'
  const [creditReason, setCreditReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${search}&filter=${filter}`);
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to sync users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const handleRoleToggle = async (userId, currentRole) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.patch(`/admin/users/${userId}/role`, { role: targetRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: res.data.role } : u));
      toast.success(`Role updated to ${targetRole}.`);
    } catch (err) {
      toast.error('Failed to modify role privileges.');
    }
  };

  const handleBanToggle = async (userId, currentBanStatus) => {
    const targetStatus = !currentBanStatus;
    try {
      const res = await api.patch(`/admin/users/${userId}/ban`, { is_banned: targetStatus });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: res.data.is_banned } : u));
      toast.success(targetStatus ? 'User account banned.' : 'User account unbanned.');
    } catch (err) {
      toast.error('Failed to update ban configuration.');
    }
  };

  const handleUserDelete = async (userId) => {
    if (window.confirm('Erase this profile permanently from Supabase database?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast.success('Account successfully removed.');
      } catch (err) {
        toast.error('Failed to delete account.');
      }
    }
  };

  const handleCreditAdjustment = async (e) => {
    e.preventDefault();
    if (!creditAmount || isNaN(creditAmount) || parseFloat(creditAmount) <= 0) {
      toast.error('Please enter a positive numeric credit value.');
      return;
    }

    setAdjusting(true);
    try {
      const res = await api.patch(`/admin/users/${activeUser.id}/credits`, {
        amount: parseFloat(creditAmount),
        action: creditAction,
        reason: creditReason
      });

      if (res.data.success) {
        setUsers(prev => prev.map(u => u.id === activeUser.id ? { ...u, credits: res.data.updatedCredits } : u));
        toast.success(`Credits balance updated successfully.`);
        setCreditModalOpen(false);
        setActiveUser(null);
        setCreditAmount('');
        setCreditReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply balance shift.');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-purple-500/10 pb-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider">Users Management</h1>
          <p className="text-[10.5px] text-purple-300 font-bold uppercase tracking-widest mt-1">
            Grant manual bonuses, alter roles, and manage site security
          </p>
        </div>
      </div>

      {/* Lookups panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F0A1E] border border-purple-500/10 p-4 rounded-2xl">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-purple-300/40 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            id="admin-search-users"
            name="adminSearchUsers"
            aria-label="Search users by email or full name"
            placeholder="Search email or full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="bg-[#130E26] text-xs rounded-lg px-9 py-2.5 border border-purple-500/10 w-full focus:outline-none focus:border-purple-500 text-white/80"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#130E26] text-white border border-purple-500/10 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          >
            <option value="all">All Accounts</option>
            <option value="admin">Administrators</option>
            <option value="banned">Banned profiles</option>
          </select>
          
          <button
            onClick={fetchUsers}
            className="p-2 bg-[#130E26] hover:bg-purple-600/20 text-purple-300 rounded-lg border border-purple-500/15 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Users table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-[#0F0A1E] border border-purple-500/10 rounded-2xl text-xs text-purple-300/40 tracking-wider">
          No registered user profiles found.
        </div>
      ) : (
        <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-2xl overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/10 text-purple-300/40 uppercase font-black tracking-wider text-[10px] bg-[#130E26]/40">
                  <th className="p-4">Avatar</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Credits</th>
                  <th className="p-4">Privileges</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions Ledger</th>
                </tr>
              </thead>
              <tbody className="font-semibold text-white/70 divide-y divide-purple-500/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-300 font-extrabold text-xs flex items-center justify-center border border-purple-500/10">
                        {u.full_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-white">{u.full_name || 'BrandVox User'}</td>
                    <td className="p-4 text-purple-300/60">{u.email}</td>
                    <td className="p-4 text-warning font-black">{formatCredits(u.credits || 0)}</td>
                    <td className="p-4">
                      <Badge variant={u.role === 'admin' ? 'featured' : 'primary'}>{u.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={u.is_banned ? 'error' : 'success'}>
                        {u.is_banned ? 'Banned' : 'Active'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Adjust credits */}
                        <button
                          onClick={() => {
                            setActiveUser(u);
                            setCreditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-warning hover:bg-warning/10 transition-all cursor-pointer"
                          title="Adjust balance"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        
                        {/* Toggle administrative role */}
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
                          title="Alter privileges"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        
                        {/* Ban / Unban toggles */}
                        <button
                          onClick={() => handleBanToggle(u.id, u.is_banned)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            u.is_banned ? 'text-success hover:bg-success/10' : 'text-error hover:bg-error/10'
                          }`}
                          title={u.is_banned ? 'Unban' : 'Ban Account'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>

                        {/* Erase account profile */}
                        <button
                          onClick={() => handleUserDelete(u.id)}
                          className="p-1.5 rounded-lg text-white/30 hover:text-error hover:bg-white/5 transition-all cursor-pointer"
                          title="Erase Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANUAL CREDIT ADJUSTMENTS MODAL */}
      <Modal
        isOpen={creditModalOpen}
        onClose={() => {
          setCreditModalOpen(false);
          setActiveUser(null);
          setCreditAmount('');
          setCreditReason('');
        }}
        title={`Balance Adjustment: ${activeUser?.full_name || 'User'}`}
      >
        <form onSubmit={handleCreditAdjustment} className="space-y-4">
          
          {/* Action toggle */}
          <div className="flex bg-[#130E26] p-0.5 rounded-lg border border-purple-500/10 text-xs font-bold uppercase select-none">
            <button
              type="button"
              onClick={() => setCreditAction('grant')}
              className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                creditAction === 'grant' ? 'bg-purple-600 text-white shadow-glow' : 'text-purple-300/40'
              }`}
            >
              Grant Credits
            </button>
            <button
              type="button"
              onClick={() => setCreditAction('deduct')}
              className={`flex-1 py-2 rounded-md transition-all cursor-pointer ${
                creditAction === 'deduct' ? 'bg-purple-600 text-white shadow-glow' : 'text-purple-300/40'
              }`}
            >
              Deduct Credits
            </button>
          </div>

          <Input
            label="Credit Amount (INR)"
            type="number"
            placeholder="e.g. 50"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
            required
          />

          <Input
            label="Adjustment Reason"
            type="text"
            placeholder="e.g. Welcome promo bonus / usage audit adjustment"
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
            required
          />

          <Button type="submit" isLoading={adjusting} className="w-full uppercase font-bold text-xs py-2.5 shadow-premium">
            Apply Balance Adjustment
          </Button>
        </form>
      </Modal>

    </div>
  );
}
