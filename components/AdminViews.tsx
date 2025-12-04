import React, { useState, useMemo } from 'react';
import { 
  Users, BookOpen, DollarSign, TrendingUp, Search, 
  Filter, MoreVertical, Edit2, Trash2, Plus, Download, 
  CheckCircle, XCircle, Shield, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { User, UserRole, Course, FeeRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

// --- MOCK DATA EXTENDED FOR ADMIN ---

const MOCK_ALL_USERS: User[] = [
  { id: 's1', name: 'Alex Student', role: UserRole.STUDENT, email: 'alex@zenro.jp', avatar: 'https://ui-avatars.com/api/?name=Alex&background=BC002D&color=fff', batch: '2024-A', phone: '+91 98765 43210' },
  { id: 't1', name: 'Tanaka Sensei', role: UserRole.TEACHER, email: 'tanaka@zenro.jp', avatar: 'https://ui-avatars.com/api/?name=Tanaka&background=0f172a&color=fff', phone: '+81 90 1234 5678' },
  { id: 's2', name: 'Riya Patel', role: UserRole.STUDENT, email: 'riya@zenro.jp', avatar: 'https://ui-avatars.com/api/?name=Riya&background=C5A059&color=fff', batch: '2024-B', phone: '+91 98765 11111' },
  { id: 's3', name: 'Kenji Sato', role: UserRole.STUDENT, email: 'kenji@zenro.jp', avatar: 'https://ui-avatars.com/api/?name=Kenji&background=BC002D&color=fff', batch: '2024-A', phone: '+91 98765 22222' },
  { id: 'a1', name: 'System Admin', role: UserRole.ADMIN, email: 'admin@zenro.jp', avatar: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff' },
];

const REVENUE_DATA = [
  { month: 'Jan', phase1: 4000, phase2: 2400 },
  { month: 'Feb', phase1: 3000, phase2: 1398 },
  { month: 'Mar', phase1: 2000, phase2: 9800 },
  { month: 'Apr', phase1: 2780, phase2: 3908 },
  { month: 'May', phase1: 1890, phase2: 4800 },
  { month: 'Jun', phase1: 2390, phase2: 3800 },
];

// --- SHARED COMPONENTS ---

const AdminHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
    <div>
      <h1 className="text-3xl font-bold text-white font-sans">{title}</h1>
      <p className="text-gray-400 text-sm mt-1">Super User Control Panel</p>
    </div>
    {action}
  </div>
);

const SearchBar = ({ value, onChange, placeholder }: { value: string, onChange: (s: string) => void, placeholder: string }) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <input 
      type="text" 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="bg-dark-900 border border-dark-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none w-64 transition"
    />
  </div>
);

// --- DASHBOARD ---

export const AdminDashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <AdminHeader 
        title="Admin Overview" 
        action={
          <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg text-sm">
            <Download className="w-4 h-4" /> Export Report
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', value: '¥12.5M', icon: DollarSign, color: 'text-accent-gold', sub: '+12% vs last month' },
          { label: 'Active Students', value: '1,240', icon: Users, color: 'text-brand-500', sub: '98% Retention' },
          { label: 'Pending Visas', value: '45', icon: Shield, color: 'text-blue-500', sub: 'Action Required' },
          { label: 'Course Completion', value: '89%', icon: TrendingUp, color: 'text-green-500', sub: 'Avg N4 Pass Rate' },
        ].map((stat, i) => (
          <div key={i} className="bg-dark-800 p-6 rounded-xl border border-dark-700 hover:border-brand-500/30 transition shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-lg bg-dark-900 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono text-gray-500 bg-dark-900 px-2 py-1 rounded">2024-FY</span>
            </div>
            <p className="text-gray-400 text-sm uppercase tracking-wider font-bold">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white mt-1">{stat.value}</h3>
            <p className="text-xs text-gray-500 mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-dark-800 p-6 rounded-xl border border-dark-700">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Overview (Phase 1 vs Phase 2)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={REVENUE_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend />
                <Bar dataKey="phase1" name="Domestic Training" fill="#be123c" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="phase2" name="Placement Success" fill="#C5A059" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
           <h3 className="text-lg font-bold text-white mb-6">Batch Distribution</h3>
           <div className="space-y-4">
              {[
                { name: 'Batch 2024-A (N4)', count: 450, color: 'bg-brand-500' },
                { name: 'Batch 2024-B (N5)', count: 320, color: 'bg-blue-600' },
                { name: 'Batch 2023-C (Placed)', count: 280, color: 'bg-accent-gold' },
                { name: 'Batch 2024-C (New)', count: 190, color: 'bg-gray-600' },
              ].map((batch, i) => (
                <div key={i} className="group cursor-pointer">
                   <div className="flex justify-between text-sm text-gray-300 mb-1">
                      <span className="font-bold group-hover:text-white transition">{batch.name}</span>
                      <span>{batch.count} Students</span>
                   </div>
                   <div className="w-full bg-dark-900 rounded-full h-2">
                      <div style={{ width: `${(batch.count / 450) * 100}%` }} className={`h-full rounded-full ${batch.color}`}></div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="mt-8 p-4 bg-dark-900 rounded-lg border border-dark-700">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" /> System Alerts
              </h4>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-center gap-2">• 12 Payment verifications pending</li>
                <li className="flex items-center gap-2">• 3 Teachers absent today</li>
                <li className="flex items-center gap-2">• Server load at 45%</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- USER MANAGEMENT ---

export const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>(MOCK_ALL_USERS);
  const [filter, setFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User, direction: 'asc' | 'desc' } | null>(null);

  // Sorting Logic
  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredUsers = useMemo(() => {
    let result = users.filter(u => 
      (u.name.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase())) &&
      (roleFilter === 'ALL' || u.role === roleFilter)
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key]! < b[sortConfig.key]!) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key]! > b[sortConfig.key]!) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [users, filter, roleFilter, sortConfig]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <AdminHeader 
        title="User Management" 
        action={
          <button className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
            <Plus className="w-5 h-5" /> Add New User
          </button>
        }
      />

      {/* Controls */}
      <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4 w-full md:w-auto">
             <SearchBar value={filter} onChange={setFilter} placeholder="Search users..." />
             
             <div className="relative">
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                  className="appearance-none bg-dark-900 border border-dark-700 text-white pl-4 pr-10 py-2 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer"
                >
                  <option value="ALL">All Roles</option>
                  <option value={UserRole.STUDENT}>Students</option>
                  <option value={UserRole.TEACHER}>Teachers</option>
                  <option value={UserRole.ADMIN}>Admins</option>
                </select>
                <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
             </div>
         </div>
         <div className="text-gray-400 text-sm">
           Showing {filteredUsers.length} users
         </div>
      </div>

      {/* Data Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden shadow-xl">
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-gray-400">
             <thead className="bg-dark-900 text-gray-200 uppercase font-bold text-xs">
               <tr>
                 <th className="px-6 py-4 cursor-pointer hover:text-brand-500 select-none" onClick={() => handleSort('name')}>
                   User Profile {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp className="inline w-3 h-3"/> : <ChevronDown className="inline w-3 h-3"/>)}
                 </th>
                 <th className="px-6 py-4 cursor-pointer hover:text-brand-500 select-none" onClick={() => handleSort('role')}>Role</th>
                 <th className="px-6 py-4">Contact</th>
                 <th className="px-6 py-4">Batch/ID</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-dark-700">
               {filteredUsers.map(user => (
                 <tr key={user.id} className="hover:bg-dark-700/50 transition group">
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                       <img src={user.avatar} alt="" className="w-10 h-10 rounded-full bg-dark-900 border border-dark-600" />
                       <div>
                         <p className="text-white font-bold">{user.name}</p>
                         <p className="text-xs">{user.email}</p>
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                       user.role === UserRole.ADMIN ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                       user.role === UserRole.TEACHER ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                       'bg-green-500/20 text-green-500 border border-green-500/30'
                     }`}>
                       {user.role}
                     </span>
                   </td>
                   <td className="px-6 py-4 font-mono text-xs">{user.phone || 'N/A'}</td>
                   <td className="px-6 py-4">
                     {user.batch ? (
                       <span className="bg-dark-900 px-2 py-1 rounded border border-dark-600 text-xs text-gray-300">{user.batch}</span>
                     ) : (
                       <span className="text-gray-600">-</span>
                     )}
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                       <span className="text-green-500 font-medium text-xs">Active</span>
                     </div>
                   </td>
                   <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button className="p-2 bg-dark-900 hover:bg-blue-900/30 text-blue-500 rounded border border-dark-600 hover:border-blue-500/30 transition" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 bg-dark-900 hover:bg-red-900/30 text-red-500 rounded border border-dark-600 hover:border-red-500/30 transition" 
                          title="Delete"
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
         <div className="p-4 border-t border-dark-700 bg-dark-900/50 flex justify-between items-center text-xs text-gray-500">
            <span>Displaying 1-{filteredUsers.length} of {filteredUsers.length} records</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-dark-800 border border-dark-600 hover:text-white disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 rounded bg-dark-800 border border-dark-600 hover:text-white disabled:opacity-50" disabled>Next</button>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- FINANCIALS ---

export const AdminFinancials = () => {
  return (
    <div className="space-y-6 animate-fade-in">
       <AdminHeader title="Financial Control Center" />
       
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-brand-900 to-dark-800 p-6 rounded-xl border border-brand-500/30">
              <h3 className="text-xl font-bold text-white mb-2">Phase 1 Collections</h3>
              <p className="text-brand-200 text-sm mb-6">Domestic Training (N5-N3)</p>
              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-xs text-gray-300 uppercase">Total Collected</p>
                      <p className="text-4xl font-bold text-white">¥8.2M</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-red-300 uppercase">Outstanding</p>
                      <p className="text-xl font-bold text-red-400">¥1.2M</p>
                  </div>
              </div>
              <div className="mt-4 w-full bg-dark-900/50 rounded-full h-3">
                  <div style={{width: '85%'}} className="bg-brand-500 h-full rounded-full"></div>
              </div>
              <p className="text-xs text-right mt-1 text-brand-200">85% Collection Rate</p>
          </div>

          <div className="bg-gradient-to-br from-accent-gold/20 to-dark-800 p-6 rounded-xl border border-accent-gold/30">
              <h3 className="text-xl font-bold text-white mb-2">Phase 2 Collections</h3>
              <p className="text-yellow-200 text-sm mb-6">Placement & Visa Success Fees</p>
              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-xs text-gray-300 uppercase">Total Collected</p>
                      <p className="text-4xl font-bold text-accent-gold">¥4.5M</p>
                  </div>
                  <div className="text-right">
                      <p className="text-xs text-gray-400 uppercase">Projected</p>
                      <p className="text-xl font-bold text-white">¥15.0M</p>
                  </div>
              </div>
              <div className="mt-4 w-full bg-dark-900/50 rounded-full h-3">
                  <div style={{width: '30%'}} className="bg-accent-gold h-full rounded-full"></div>
              </div>
              <p className="text-xs text-right mt-1 text-yellow-200">30% Realized (Based on Placements)</p>
          </div>
       </div>

       {/* Transaction Table */}
       <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
          <div className="p-6 border-b border-dark-700 flex justify-between items-center">
             <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
             <button className="text-xs text-brand-500 border border-brand-500 px-3 py-1 rounded hover:bg-brand-500 hover:text-white transition">View All</button>
          </div>
          <table className="w-full text-left text-sm text-gray-400">
             <thead className="bg-dark-900 text-gray-200 uppercase font-bold text-xs">
               <tr>
                 <th className="px-6 py-4">Transaction ID</th>
                 <th className="px-6 py-4">Student</th>
                 <th className="px-6 py-4">Date</th>
                 <th className="px-6 py-4">Category</th>
                 <th className="px-6 py-4">Amount</th>
                 <th className="px-6 py-4">Status</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-dark-700">
                {[
                  { id: 'TXN-9981', student: 'Alex Student', date: '2023-10-01', cat: 'Phase 1 - Month 3', amt: 9000, status: 'SUCCESS' },
                  { id: 'TXN-9982', student: 'Riya Patel', date: '2023-10-01', cat: 'Phase 1 - Month 3', amt: 9000, status: 'FAILED' },
                  { id: 'TXN-9983', student: 'Kenji Sato', date: '2023-09-28', cat: 'Phase 2 - Installment 1', amt: 75000, status: 'SUCCESS' },
                ].map((txn, i) => (
                  <tr key={i} className="hover:bg-dark-700/50 transition">
                     <td className="px-6 py-4 font-mono text-xs">{txn.id}</td>
                     <td className="px-6 py-4 text-white font-bold">{txn.student}</td>
                     <td className="px-6 py-4">{txn.date}</td>
                     <td className="px-6 py-4">{txn.cat}</td>
                     <td className="px-6 py-4 font-mono text-white">¥{txn.amt.toLocaleString()}</td>
                     <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${txn.status === 'SUCCESS' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                          {txn.status}
                        </span>
                     </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};
