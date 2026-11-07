import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import {
  Shield,
  Search,
  UserCheck,
  UserX,
  PlusCircle,
  MinusCircle,
  Coins,
  AlertTriangle,
  CheckCircle,
  Lock,
  ArrowRight,
  FileText,
  Clock,
  Eye,
  X,
  QrCode,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    auditLogs,
    depositRequests,
    loginAs,
    adminGrantCredits,
    adminDeductCredits,
    adminToggleSuspension,
    adminProcessDepositRequest,
    ownerPaymentQr,
    updateOwnerPaymentQr,
  } = useGame();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'GRANT' | 'DEDUCT' | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'deposits' | 'scanner'>('users');
  const [newQrInputUrl, setNewQrInputUrl] = useState<string>('');
  const [scannerSuccessMsg, setScannerSuccessMsg] = useState<string | null>(null);


  const isAdmin = currentUser?.role === 'admin';

  // If not admin, show login gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-8 text-center shadow-2xl space-y-6 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="font-cinzel text-xl font-black text-white">
              Administrator Portal Gate
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Role-Based Access Control: Restricted to authorized BITORA supervisors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#121622] border border-[#242c3d] text-left text-xs space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Required Role:</span>
              <span className="font-bold text-amber-400">admin</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Your Current Role:</span>
              <span className="font-bold text-gray-300">{currentUser?.role.toUpperCase() || 'GUEST'}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Your Current ID:</span>
              <span className="font-mono-numbers text-[#f5d061]">{currentUser?.id || '-'}</span>
            </div>
          </div>

          <p className="text-xs text-red-400 font-semibold text-center">
            Access Restricted: Please sign in with an authorized administrator account to manage this portal.
          </p>
        </div>
      </div>
    );
  }

  // Filtered users by ID or username
  const filteredUsers = users.filter(u =>
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCirculating = users.reduce((acc, u) => acc + u.balance, 0);
  const totalSuspended = users.filter(u => u.isSuspended).length;
  const pendingRequests = depositRequests.filter(r => r.status === 'PENDING').length;

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAction || !actionType) return;

    if (adjustAmount <= 0) {
      setFeedback({ type: 'error', text: 'Adjustment amount must be greater than zero.' });
      return;
    }

    if (actionType === 'GRANT') {
      const res = adminGrantCredits(
        selectedUserForAction.id,
        adjustAmount,
        adjustReason || 'Administrator demo credit provision'
      );
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedUserForAction(null);
          setActionType(null);
          setAdjustReason('');
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } else {
      const res = adminDeductCredits(
        selectedUserForAction.id,
        adjustAmount,
        adjustReason || 'Administrator demo credit deduction'
      );
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setTimeout(() => {
          setSelectedUserForAction(null);
          setActionType(null);
          setAdjustReason('');
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0e121a] border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-cinzel text-xl sm:text-2xl font-black text-white">
                Admin Command Suite
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                ACTIVE SUPERVISOR: {currentUser.id}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Audit Logs &bull; User ID Search &bull; Virtual Credit Controls (Max ₹5,000 Enforced)
            </p>
          </div>
        </div>

        {/* Circulating credits */}
        <div className="flex items-center gap-3">
          <div className="bg-[#151b26] border border-[#242c3d] rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] text-gray-400 block uppercase font-semibold">Total Circulating</span>
            <span className="font-mono-numbers text-base sm:text-lg font-black text-[#f5d061]">
              ₹{totalCirculating.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Registered Users</span>
          <span className="font-mono-numbers text-xl font-bold text-white mt-1 block">
            {users.length} Accounts
          </span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Suspended Accounts</span>
          <span className="font-mono-numbers text-xl font-bold text-red-400 mt-1 block">
            {totalSuspended} Locked
          </span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Pending Demo Deposits</span>
          <span className="font-mono-numbers text-xl font-bold text-amber-400 mt-1 block">
            {pendingRequests} Requests
          </span>
        </div>

        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-4">
          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Audit Log Entries</span>
          <span className="font-mono-numbers text-xl font-bold text-emerald-400 mt-1 block">
            {auditLogs.length} Actions
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#242c3d] gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          User Management ({filteredUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Adjustment Audit Log ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'deposits'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Deposit Demo Queue ({depositRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold transition-all ${
            activeTab === 'scanner'
              ? 'border-[#d4af37] text-[#f5d061] bg-[#d4af37]/5'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Owner Payment QR Scanner
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono-numbers">
            {ownerPaymentQr ? 'CUSTOM' : 'DEFAULT'}
          </span>
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by User ID (e.g. BIT-782914) or username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#121622] border border-[#242c3d] rounded-xl pl-10 pr-4 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
            <span className="text-xs text-gray-400">
              Displaying {filteredUsers.length} of {users.length} accounts
            </span>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Demo Balance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">VIP Tier</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">{u.id}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-md object-cover" />
                        <div>
                          <p className="font-bold text-white">{u.username}</p>
                          <p className="text-[10px] text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-300">{u.role.toUpperCase()}</td>
                    <td className="py-3 px-3 font-mono-numbers font-bold text-white">
                      ₹{u.balance.toLocaleString('en-IN')}
                      <span className="text-[10px] text-gray-500 font-normal ml-1">/ 5,000</span>
                    </td>
                    <td className="py-3 px-3">
                      {u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold text-amber-300">{u.vipTier}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Grant Credits */}
                        <button
                          onClick={() => {
                            setSelectedUserForAction(u);
                            setActionType('GRANT');
                            setFeedback(null);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 border border-emerald-500/30 transition-colors"
                          title="Grant Virtual Credits"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>

                        {/* Deduct Credits */}
                        <button
                          onClick={() => {
                            setSelectedUserForAction(u);
                            setActionType('DEDUCT');
                            setFeedback(null);
                          }}
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/30 transition-colors"
                          title="Deduct Virtual Credits"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>

                        {/* Suspend / Unsuspend */}
                        <button
                          onClick={() =>
                            adminToggleSuspension(
                              u.id,
                              u.isSuspended ? 'Account unsuspended by admin' : 'Account suspended for policy check'
                            )
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.isSuspended
                              ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/40 border-amber-500/30'
                              : 'bg-gray-800 text-gray-400 hover:text-red-400 border-gray-700'
                          }`}
                          title={u.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                        >
                          {u.isSuspended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
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

      {/* Tab 2: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-cinzel text-base font-bold text-white">
            Administrative Audit Log (Official Audit Trail)
          </h3>
          <p className="text-xs text-gray-400">
            Every virtual credit grant, deduction, and account suspension is permanently logged with supervisor ID, target user ID, reason, and timestamp.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Audit ID</th>
                  <th className="py-2.5 px-3">Supervisor ID</th>
                  <th className="py-2.5 px-3">Target User ID</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers text-gray-400">{log.id}</td>
                    <td className="py-3 px-3 font-mono-numbers font-bold text-amber-300">{log.adminId}</td>
                    <td className="py-3 px-3 font-mono-numbers text-white">{log.targetUserId}</td>
                    <td className="py-3 px-3 font-bold text-[#f5d061]">{log.action}</td>
                    <td className="py-3 px-3 font-mono-numbers font-semibold text-emerald-400">
                      {log.amount !== undefined ? `₹${log.amount}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-gray-300 text-[11px]">{log.reason}</td>
                    <td className="py-3 px-3 text-gray-500 font-mono-numbers text-[11px]">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Deposit Queue */}
      {activeTab === 'deposits' && (
        <div className="bg-[#0e121a] border border-[#242c3d] rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="font-cinzel text-base font-bold text-white">
            Demo Deposit Requests Queue
          </h3>
          <p className="text-xs text-gray-400">
            Review simulated user deposit requests. Approvals automatically add virtual credits up to the strict ₹5,000 ceiling.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242c3d] text-gray-400 uppercase font-mono-numbers text-[10px]">
                  <th className="py-2.5 px-3">Request ID</th>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reference No</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Created</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2535]">
                {depositRequests.map(r => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono-numbers font-bold text-white">{r.id}</td>
                    <td className="py-3 px-3 text-gray-300">{r.username} ({r.userId})</td>
                    <td className="py-3 px-3 font-mono-numbers font-bold text-[#f5d061]">₹{r.amount}</td>
                    <td className="py-3 px-3 font-mono-numbers text-gray-400">{r.referenceNo}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-mono-numbers text-[11px]">{r.createdAt}</td>
                    <td className="py-3 px-3 text-right">
                      {r.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => adminProcessDepositRequest(r.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 font-bold text-[11px] border border-emerald-500/30"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => adminProcessDepositRequest(r.id, 'REJECT', 'Declined in admin demo review')}
                            className="px-2.5 py-1 rounded bg-red-600/30 text-red-300 hover:bg-red-600/50 font-bold text-[11px] border border-red-500/30"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Owner Payment QR Scanner */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          <div className="bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Shield className="w-3.5 h-3.5" />
                  Restricted RBAC Section: Platform Owner / Administrator Only
                </div>
                <h2 className="font-cinzel text-2xl font-black text-white">
                  Owner Payment Scanner & Official QR Hub
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Manage the official payment scanner photo shown to all users inside the Deposit Cashier. 
                  Any change made here updates dynamically in real-time across the deposit portal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  AUTHENTICATED AS OWNER ({currentUser.id})
                </span>
              </div>
            </div>

            {scannerSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{scannerSuccessMsg}</span>
                <button onClick={() => setScannerSuccessMsg(null)} className="text-emerald-300 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
              {/* Left Column: Live Preview in Cashier Simulation */}
              <div className="lg:col-span-5 bg-[#121622] border border-[#242c3d] rounded-2xl p-5 flex flex-col items-center text-center">
                <div className="w-full flex items-center justify-between text-xs text-gray-400 pb-3 border-b border-[#242c3d] mb-4">
                  <span className="font-semibold text-gray-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-400" />
                    Deposit Portal Live Preview
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#1e2535] text-amber-300 font-mono-numbers">
                    {ownerPaymentQr ? 'CUSTOM PHOTO ACTIVE' : 'SYSTEM DEFAULT QR'}
                  </span>
                </div>

                {/* QR Display Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#182030] to-[#0d121c] border-2 border-dashed border-[#d4af37]/40 shadow-inner flex flex-col items-center max-w-[280px]">
                  <div className="w-56 h-56 rounded-xl overflow-hidden bg-white p-2 shadow-2xl flex items-center justify-center">
                    {ownerPaymentQr ? (
                      <img
                        src={ownerPaymentQr}
                        alt="Owner Official Deposit QR"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi%3A%2F%2Fpay%3Fpa%3Dbitora.vip%40axl%26pn%3DBITORA%2520ROYAL%2520CLUB%26mc%3D7995%26mode%3D02%26purpose%3D00&color=1a162b"
                        alt="Default Bitora VIP Scanner"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Strict Caption */}
                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-[#242c3d] w-full text-center">
                    <p className="text-[11px] font-bold text-amber-300 leading-snug">
                      Scan this QR for more money and complete your payment within 10 minutes.
                    </p>
                  </div>

                  <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    10-Min Clearance Delay Protocol Active
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-gray-400">
                  Visible to players on all 7 preset deposit tiers (₹110, ₹200, ₹400, ₹800, ₹1,000, ₹1,600, ₹5,000).
                </div>
              </div>

              {/* Right Column: Update Controls & Security Specifications */}
              <div className="lg:col-span-7 space-y-5">
                {/* Method 1: Upload File */}
                <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Option 1: Upload QR Photo From Device
                  </div>
                  <p className="text-xs text-gray-400">
                    Upload your UPI QR code, payment screenshot, or company barcode directly from your device.
                  </p>
                  <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-black bg-gradient-to-r from-[#d4af37] via-[#f5d061] to-[#aa820a] hover:from-[#f5d061] hover:to-[#d4af37] cursor-pointer shadow-lg transition-all text-xs active:scale-98">
                    <Upload className="w-4 h-4" />
                    <span>Choose Image File (JPG, PNG, WebP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              const ok = updateOwnerPaymentQr(reader.result);
                              if (ok) {
                                setScannerSuccessMsg('Official Owner QR scanner photo updated successfully!');
                              }
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Method 2: Dynamic Image URL */}
                <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    Option 2: Dynamic Cloud Image URL
                  </div>
                  <p className="text-xs text-gray-400">
                    Paste an image URL hosted on AWS S3, Cloudinary, Imgur, or your custom CDN.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://your-domain.com/official-qr.png"
                      value={newQrInputUrl}
                      onChange={(e) => setNewQrInputUrl(e.target.value)}
                      className="flex-1 bg-[#0e121a] border border-[#242c3d] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    <button
                      onClick={() => {
                        if (!newQrInputUrl.trim()) return;
                        const ok = updateOwnerPaymentQr(newQrInputUrl.trim());
                        if (ok) {
                          setScannerSuccessMsg('Owner payment QR updated via remote URL!');
                          setNewQrInputUrl('');
                        }
                      }}
                      disabled={!newQrInputUrl.trim()}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-[#f5d061] hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Apply URL
                    </button>
                  </div>
                </div>

                {/* Reset to Default */}
                <div className="bg-[#121622] border border-[#242c3d] rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                      Restore System Default VIP QR
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Clears custom photo and reverts deposit cashier back to the standard BITORA Gold VIP QR.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      updateOwnerPaymentQr('');
                      setScannerSuccessMsg('Reset to system default VIP QR scanner photo.');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white bg-[#1e2535] hover:bg-[#283248] border border-[#2d374d] transition-all cursor-pointer whitespace-nowrap"
                  >
                    Reset Default
                  </button>
                </div>

                {/* Security & Access Policies Overview */}
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    Role-Based Access Control (RBAC) Policy Details
                  </div>
                  <ul className="text-[11px] text-gray-400 space-y-1 list-disc list-inside">
                    <li>Strict Authorization: Only accounts with <span className="text-amber-300 font-semibold">role = 'admin'</span> or holders of the Master Owner PIN can replace this photo.</li>
                    <li>Tamper Resistance: Unauthorized client requests to modify the scanner are rejected and logged.</li>
                    <li>Cashier Persistence: Stored in high-priority browser storage with offline failover.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Credit Grant / Deduct Modal */}
      {selectedUserForAction && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0e121a] border border-[#d4af37]/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => {
                setSelectedUserForAction(null);
                setActionType(null);
              }}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  actionType === 'GRANT'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
              >
                {actionType === 'GRANT' ? <PlusCircle className="w-5 h-5" /> : <MinusCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-white">
                  {actionType === 'GRANT' ? 'Grant Virtual Credits' : 'Deduct Virtual Credits'}
                </h3>
                <p className="text-xs text-gray-400">
                  Target: {selectedUserForAction.username} ({selectedUserForAction.id})
                </p>
              </div>
            </div>

            <div className="bg-[#121622] rounded-xl p-3 border border-[#242c3d] text-xs space-y-1">
              <div className="flex justify-between text-gray-400">
                <span>Current Balance:</span>
                <span className="font-mono-numbers font-bold text-white">
                  ₹{selectedUserForAction.balance.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Maximum Allowed:</span>
                <span className="font-mono-numbers font-bold text-[#f5d061]">₹5,000 Cap</span>
              </div>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Credit Amount (₹):
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3.5 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  Audit Reason (Official Log):
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIP goodwill bonus / testing adjustment"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-[#121622] border border-[#242c3d] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {feedback.text}
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold text-black uppercase tracking-wider text-xs transition-all cursor-pointer ${
                  actionType === 'GRANT'
                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300'
                    : 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-300'
                }`}
              >
                Confirm {actionType === 'GRANT' ? 'Credit Grant' : 'Credit Deduction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
