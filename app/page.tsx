"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Building2, Mail, Lock, LogIn, LogOut, 
  PieChart, Wrench, CreditCard, Plus, 
  Camera, X, Box, FileText, CheckCircle 
} from 'lucide-react';

export default function DormCareApp() {
  const [session, setSession] = useState<any>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // States สำหรับข้อมูล
  const [repairs, setRepairs] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [repairCount, setRepairCount] = useState(0);

  // States สำหรับฟอร์มแจ้งซ่อม
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repairTitle, setRepairTitle] = useState('');
  const [repairDesc, setRepairDesc] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      if (session) fetchAllData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchAllData();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    // ดึงข้อมูลแจ้งซ่อม
    const { data: repairData, count } = await supabase
      .from('maintenance_request')
      .select('*, products(*)', { count: 'exact' })
      .order('reported_date', { ascending: false });
    
    if (repairData) {
      setRepairs(repairData);
      setRepairCount(count || 0);
    }

    // ดึงข้อมูลบิล
    const { data: billData } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (billData) setBills(billData);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value;
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let imageUrl = null;
      const file = fileInputRef.current?.files?.[0];
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('productImage')
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        imageUrl = fileName;
      }

      const { error } = await supabase.from('maintenance_request').insert([{
        title: repairTitle,
        description: repairDesc,
        status: 'pending',
        image_url: imageUrl,
        resident_id: session?.user?.id
      }]);

      if (error) throw error;
      
      setIsModalOpen(false);
      setRepairTitle('');
      setRepairDesc('');
      setImagePreview(null);
      fetchAllData();
      alert("ส่งข้อมูลแจ้งซ่อมสำเร็จ");

    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !session) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-blue-900 text-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-blue-900 mb-2">DormCare</h1>
          <p className="text-slate-500 text-sm mb-8">ลงชื่อเข้าใช้งานแพลตฟอร์มจัดการหอพักดิจิทัล</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมลบัญชีผู้ใช้</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input name="email" type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all" placeholder="yourname@domain.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input name="password" type="password" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-6">
              เข้าสู่ระบบ <LogIn size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center items-center">
      <div className="w-full max-w-md h-screen md:h-[850px] md:max-h-[95vh] bg-white md:rounded-[30px] md:border border-slate-200 shadow-xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-lg">
            <Building2 size={24} />
            <span>DormCare</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-800 w-24 truncate">{session.user.email}</div>
              <div className="text-[10px] text-slate-500">ผู้พักอาศัย</div>
            </div>
            <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-5 pb-24">
          
          {/* View: Dashboard */}
          {activeView === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-blue-900">ภาพรวมหอพัก</h2>
                <p className="text-sm text-slate-500">ยินดีต้อนรับสู่ระบบรายงานข้อมูลเรียลไทม์</p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-xs text-slate-500 font-medium mb-1">สถานะบิลล่าสุด</h4>
                    <p className="text-lg font-bold text-slate-800">
                      {bills.length > 0 && bills[0].status === 'paid' ? 'ชำระเงินเสร็จสิ้น' : 'มียอดค้างชำระ'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                </div>
                
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="text-xs text-slate-500 font-medium mb-1">งานแจ้งซ่อมของฉัน</h4>
                    <p className="text-lg font-bold text-slate-800">{repairCount} รายการ</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
                    <Wrench size={24} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View: Repairs */}
          {activeView === 'repairs' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-blue-900">การแจ้งซ่อม</h2>
                  <p className="text-sm text-slate-500">จัดการและติดตามสถานะ</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-blue-900 text-white text-xs px-3 py-2 rounded-lg font-medium flex items-center gap-1 shadow-sm hover:bg-blue-800 transition-colors">
                  <Plus size={14} /> แจ้งซ่อมใหม่
                </button>
              </div>

              <div className="space-y-4">
                {repairs.length === 0 ? (
                  <div className="text-center text-slate-400 py-10 text-sm">ไม่มีข้อมูลรายการแจ้งซ่อม</div>
                ) : (
                  repairs.map((item) => {
                    const statusText = item.status === 'defect resolved' || item.status === 'เสร็จสิ้น' ? 'เสร็จสิ้น' : 
                                       item.status === 'in progress' || item.status === 'กำลังดำเนินการ' ? 'กำลังดำเนินการ' : 'แจ้งปัญหา';
                    const isDone = statusText === 'เสร็จสิ้น';
                    
                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-[10px] text-slate-400 font-mono tracking-wider">TICKET #{item.id}</div>
                            <h4 className="font-semibold text-blue-900 text-sm">{item.title || 'ไม่ระบุชื่อ'}</h4>
                          </div>
                          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${isDone ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                            {statusText}
                          </span>
                        </div>
                        <div className="flex gap-3 mb-4">
                          <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <img src={`https://aktyghpazejsihdbvrle.supabase.co/storage/v1/object/public/productImage/${item.image_url}`} alt="หลักฐาน" className="w-full h-full object-cover" />
                            ) : (
                              <Box size={20} className="text-slate-400" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{item.description}</p>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-3 flex items-center gap-2 text-[10px] text-slate-400">
                           <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-slate-300' : 'bg-green-500 animate-pulse'}`}></div>
                           อัปเดตล่าสุด: {new Date(item.reported_date || item.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* View: Billing */}
          {activeView === 'billing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-bold text-blue-900">บิลค่าเช่า</h2>
                <p className="text-sm text-slate-500">ตรวจสอบประวัติใบแจ้งหนี้</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 font-medium">รอบบิล</th>
                        <th className="px-4 py-3 font-medium">ยอดสุทธิ</th>
                        <th className="px-4 py-3 font-medium">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bills.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">ไม่มีข้อมูลใบแจ้งหนี้</td>
                        </tr>
                      ) : (
                        bills.map((bill) => (
                          <tr key={bill.id}>
                            <td className="px-4 py-4 font-medium text-slate-700">{bill.billing_month || '-'}</td>
                            <td className="px-4 py-4 font-semibold text-blue-900">{(bill.amount || 0).toLocaleString()} ฿</td>
                            <td className="px-4 py-4">
                              <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${bill.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {bill.status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-slate-100 pb-safe pt-2 px-4 z-20">
          <ul className="flex justify-between items-center h-16">
            {[
              { id: 'dashboard', icon: PieChart, label: 'ภาพรวม' },
              { id: 'repairs', icon: Wrench, label: 'แจ้งซ่อม' },
              { id: 'billing', icon: CreditCard, label: 'บิลค่าเช่า' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id} className="flex-1">
                  <button 
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex flex-col items-center justify-center gap-1 transition-all duration-200 ${isActive ? 'text-blue-900 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Modal: แจ้งซ่อมใหม่ */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-blue-900">แจ้งซ่อมแซมคุรุภัณฑ์</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={submitRepair} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">หัวข้อปัญหา</label>
                  <input type="text" value={repairTitle} onChange={(e) => setRepairTitle(e.target.value)} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none" placeholder="เช่น แอร์ไม่เย็น" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">รายละเอียด</label>
                  <textarea value={repairDesc} onChange={(e) => setRepairDesc(e.target.value)} required rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none resize-none" placeholder="ระบุอาการเพิ่มเติม..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1"><Camera size={14} /> แนบรูปภาพ</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-900 hover:file:bg-blue-100 transition-colors" />
                  {imagePreview && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-slate-200">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover" />
                      <button type="button" onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-800 text-white py-2.5 rounded-lg text-sm font-medium mt-2 transition-colors disabled:opacity-70">
                  {isLoading ? 'กำลังประมวลผล...' : 'ส่งเรื่องแจ้งซ่อม'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
