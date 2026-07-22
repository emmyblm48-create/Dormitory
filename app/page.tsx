"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Eye, EyeOff, PlusSquare, AlertCircle, Phone, LogOut 
} from 'lucide-react';

// --- โลโก้ Dormitory (ไอคอนบ้านและเตียงสองชั้น) ---
const DormitoryLogo = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 20 L25 75 V170 H175 V75 Z" stroke="#0B3C7B" strokeWidth="12" strokeLinejoin="round" fill="none"/>
    <path d="M15 80 L100 15 L185 80" stroke="#0B3C7B" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="52" y="80" width="96" height="75" stroke="#0B3C7B" strokeWidth="8" rx="4"/>
    {/* เตียงบน */}
    <circle cx="72" cy="100" r="7" fill="#0B3C7B"/>
    <rect x="85" y="94" width="50" height="14" rx="3" fill="#0B3C7B"/>
    <line x1="60" y1="112" x2="140" y2="112" stroke="#0B3C7B" strokeWidth="6" strokeLinecap="round"/>
    {/* เตียงล่าง */}
    <circle cx="72" cy="132" r="7" fill="#0B3C7B"/>
    <rect x="85" y="126" width="50" height="14" rx="3" fill="#0B3C7B"/>
    <line x1="60" y1="144" x2="140" y2="144" stroke="#0B3C7B" strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

// --- ไอคอนครุภัณฑ์ประเภทต่างๆ ---
const CutoutIcon = () => (
  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M8 7h8" />
    <path d="M10 10l2 3l2-3" />
    <path d="M6 16v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
    <path d="M8 21v1" />
    <path d="M16 21v1" />
  </svg>
);

const WaterHeaterIcon = () => (
  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="3" width="10" height="15" rx="2" />
    <circle cx="13" cy="7" r="1.5" fill="currentColor" />
    <circle cx="13" cy="12" r="2" />
    <path d="M4 8a2 2 0 0 1 2-2h2" />
    <path d="M4 8v7a3 3 0 0 0 3 3" />
    <circle cx="4" cy="8" r="1" fill="currentColor" />
  </svg>
);

const SinkIcon = () => (
  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V9z" />
    <path d="M12 3v6" />
    <path d="M10 3h4" />
    <path d="M12 19v3" />
    <path d="M8 22h8" />
  </svg>
);

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mock หรือ ข้อมูลครุภัณฑ์จริง
  const normalItems = [
    { id: 1, name: 'คัดเอาท์', status: 'สถานะปกติ', date: '2026-02-19 00:00:00.000', icon: CutoutIcon },
    { id: 2, name: 'เครื่องทำน้ำอุ่น', status: 'สถานะปกติ', date: '2026-02-22 00:00:00.000', icon: WaterHeaterIcon },
  ];

  const repairItems = [
    { id: 3, name: 'อ่างล้างหน้า', status: 'สถานะแจ้งซ่อม', date: '2026-02-24 00:00:00.000', icon: SinkIcon },
    { id: 4, name: 'เครื่องทำน้ำอุ่น', status: 'สถานะแจ้งซ่อม', date: '2026-02-24 00:00:00.000', icon: WaterHeaterIcon },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-4 border-[#0B3C7B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 md:p-4">
      {/* Container จำลองจอมือถือสัดส่วน 393 x 852 */}
      <div className="w-full max-w-[393px] h-screen md:h-[852px] bg-[#EEF2F6] md:rounded-[36px] shadow-2xl relative flex flex-col overflow-hidden border border-slate-300">
        
        {/* ==================== 1. หน้า LOGIN ==================== */}
        {!session ? (
          <div className="flex-1 flex flex-col justify-between p-6 pt-12">
            <div className="flex flex-col items-center text-center">
              {/* โลโก้ และ ชื่อแบรนด์ */}
              <DormitoryLogo className="w-36 h-36 mb-1" />
              <h1 className="text-3xl font-extrabold text-[#0B3C7B] tracking-wider mb-8">DORMITORY</h1>

              {/* ข้อความต้อนรับ */}
              <h2 className="text-2xl font-bold text-slate-900 mb-1">WELCOME</h2>
              <p className="text-slate-600 text-sm mb-8 font-medium">กรุณาเข้าสู่ระบบด้วยบัญชีห้องของท่าน</p>

              {/* ฟอร์มเข้าสู่ระบบ */}
              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="User"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1877F2] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors text-base mt-4"
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>
            </div>

            <div className="text-center text-xs text-slate-400 pb-2">
              Dormitory Management System
            </div>
          </div>
        ) : (

        /* ==================== 2. หน้า HOME ==================== */
          <div className="flex-1 flex flex-col bg-[#EEF2F6] overflow-y-auto">
            {/* Header แถบสีน้ำเงิน */}
            <header className="bg-[#0B57D0] text-white px-5 py-3.5 flex justify-between items-center shadow-md sticky top-0 z-10">
              <h1 className="text-xl font-bold">Home</h1>
              <button 
                onClick={handleLogout} 
                className="text-white hover:text-red-200 transition-colors p-1"
                title="ออกจากระบบ"
              >
                <LogOut size={20} />
              </button>
            </header>

            <div className="p-4 space-y-5 flex-1">
              {/* การ์ดโปรไฟล์ผู้ใช้ */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#0B3C7B] flex items-center justify-center overflow-hidden shrink-0">
                  <DormitoryLogo className="w-12 h-12 text-white" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-800 font-semibold text-base truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>

              {/* ปุ่มทางลัด เมนูดำเนินการ */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <button className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <PlusSquare className="text-emerald-500" size={22} />
                  <span className="text-emerald-600 font-semibold text-sm">เพิ่มครุภัณฑ์</span>
                </button>
                <button className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <AlertCircle className="text-red-500" size={22} />
                  <span className="text-red-500 font-semibold text-sm">รายงานครุภัณฑ์</span>
                </button>
              </div>

              <hr className="border-slate-300 my-2" />

              {/* ส่วนที่ 1: ครุภัณฑ์ในห้องพัก */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">ครุภัณฑ์ในห้องพัก</h3>
                <div className="space-y-3">
                  {normalItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-2xl bg-[#0B3C7B] flex items-center justify-center shrink-0">
                          <IconComponent />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.name}</h4>
                          <p className="text-[#0B57D0] font-medium text-xs my-0.5">{item.status}</p>
                          <p className="text-slate-400 text-[10px] font-mono">{item.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-300 my-2" />

              {/* ส่วนที่ 2: ติดตามสถานะครุภัณฑ์ */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">ติดตามสถานะครุภัณฑ์</h3>
                <div className="space-y-3">
                  {repairItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={item.id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3.5">
                        <div className="w-16 h-16 rounded-2xl bg-[#0B3C7B] flex items-center justify-center shrink-0">
                          <IconComponent />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{item.name}</h4>
                          <p className="text-red-500 font-medium text-xs my-0.5">{item.status}</p>
                          <p className="text-slate-400 text-[10px] font-mono">{item.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <hr className="border-slate-300 my-2" />

              {/* ส่วนที่ 3: เบอร์โทรติดต่อหอพัก */}
              <div className="pt-1 pb-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">เบอร์โทรติดต่อหอพัก</h3>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">สำนักงานหอพัก</p>
                    <p className="text-sm font-bold text-slate-800">02-xxx-xxxx / 08x-xxx-xxxx</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
