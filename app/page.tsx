"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Eye, EyeOff, PlusSquare, AlertCircle, Phone, LogOut, Package, RefreshCw
} from 'lucide-react';

// --- 1. ตั้งค่า Supabase Project ID และ Bucket Name ---
const SUPABASE_PROJECT_ID = "aktyghpazejsihdbvrle";
const BUCKET_NAME = "productImage"; 

// --- 2. โลโก้ Dormitory ---
const DormitoryLogo = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 20 L25 75 V170 H175 V75 Z" stroke="#0B3C7B" strokeWidth="12" strokeLinejoin="round" fill="none"/>
    <path d="M15 80 L100 15 L185 80" stroke="#0B3C7B" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="52" y="80" width="96" height="75" stroke="#0B3C7B" strokeWidth="8" rx="4"/>
    <circle cx="72" cy="100" r="7" fill="#0B3C7B"/>
    <rect x="85" y="94" width="50" height="14" rx="3" fill="#0B3C7B"/>
    <line x1="60" y1="112" x2="140" y2="112" stroke="#0B3C7B" strokeWidth="6" strokeLinecap="round"/>
    <circle cx="72" cy="132" r="7" fill="#0B3C7B"/>
    <rect x="85" y="126" width="50" height="14" rx="3" fill="#0B3C7B"/>
    <line x1="60" y1="144" x2="140" y2="144" stroke="#0B3C7B" strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

// --- 3. ไอคอน Fallback สำรอง ---
const CutoutIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="3" width="16" height="13" rx="2" />
    <path d="M8 7h8" />
    <path d="M10 10l2 3l2-3" />
    <path d="M6 16v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-3" />
    <path d="M8 21v1" />
    <path d="M16 21v1" />
  </svg>
);

const WaterHeaterIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="3" width="10" height="15" rx="2" />
    <circle cx="13" cy="7" r="1.5" fill="currentColor" />
    <circle cx="13" cy="12" r="2" />
    <path d="M4 8a2 2 0 0 1 2-2h2" />
    <path d="M4 8v7a3 3 0 0 0 3 3" />
    <circle cx="4" cy="8" r="1" fill="currentColor" />
  </svg>
);

const SinkIcon = () => (
  <svg className="w-8 h-8 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6V9z" />
    <path d="M12 3v6" />
    <path d="M10 3h4" />
    <path d="M12 19v3" />
    <path d="M8 22h8" />
  </svg>
);

const DefaultItemIcon = () => <Package className="w-8 h-8 md:w-9 md:h-9 text-white" />;

const getAssetIcon = (name: string = '') => {
  if (name.includes('น้ำอุ่น')) return WaterHeaterIcon;
  if (name.includes('คัดเอาท์') || name.includes('ไฟ')) return CutoutIcon;
  if (name.includes('อ่าง') || name.includes('ซิงค์')) return SinkIcon;
  return DefaultItemIcon;
};

// --- 4. ฟังก์ชันจัดการ Format วันที่ และ URL รูปภาพ ---
const formatFullDate = (dateStr?: string) => {
  if (!dateStr) return '2026-02-24 00:00:00.000';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.000`;
};

// ฟังก์ชันแปลง URL ปรับปรุงใหม่ รองรับทั้ง Supabase และ External URL
const formatImageUrl = (url?: string) => {
  if (!url || url.trim() === "") return null;

  let cleanUrl = url.trim();

  // 1. ตรวจสอบหากเป็น Full URL (เช่น https://lh3.googleusercontent.com/...)
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    if (cleanUrl.includes("drive.google.com/file/d/")) {
      const fileId = cleanUrl.split("/d/")[1]?.split("/")[0];
      if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}=s1000`;
      }
    }

    if (cleanUrl.includes("sdltpjvwovgjsldrixxi")) {
      cleanUrl = cleanUrl.replace("sdltpjvwovgjsldrixxi", SUPABASE_PROJECT_ID);
    }

    if (!cleanUrl.includes("supabase.co") || cleanUrl.includes("/storage/v1/object/public/")) {
      return cleanUrl;
    }
  }

  // 2. ถ้าเป็น Relative Path / ชื่อไฟล์ใน Supabase Storage
  if (cleanUrl.includes("/public/")) {
    cleanUrl = cleanUrl.split("/public/")[1];
  }

  cleanUrl = cleanUrl.replace(/\/+/g, "/");

  const prefixesToRemove = ["public/", "products/", "productimage/", "productImage/"];
  prefixesToRemove.forEach((prefix) => {
    if (cleanUrl.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleanUrl = cleanUrl.slice(prefix.length);
    }
  });

  cleanUrl = cleanUrl.replace(/^\/+/, "");

  return `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/${BUCKET_NAME}/${cleanUrl}`;
};

// --- 5. Component แสดงรูปภาพพร้อม Fallback ---
const AssetAvatar = ({ imageUrl, name }: { imageUrl?: string; name?: string }) => {
  const [imgError, setImgError] = useState(false);
  const IconComponent = getAssetIcon(name);

  const validUrl = formatImageUrl(imageUrl);

  if (validUrl && !imgError) {
    return (
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
        <img 
          src={validUrl} 
          alt={name || 'ครุภัณฑ์'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error(`[Image Load Failed] URL: ${validUrl}`, e);
            setImgError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#0B3C7B] flex items-center justify-center shrink-0">
      <IconComponent />
    </div>
  );
};

// --- 6. Main App Component ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States สำหรับเก็บข้อมูลจาก View
  const [roomAssets, setRoomAssets] = useState<any[]>([]);
  const [homeUserRequests, setHomeUserRequests] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
      if (session) fetchDashboardData();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchDashboardData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // ดึงข้อมูลจาก View
  const fetchDashboardData = async () => {
    setIsDataLoading(true);
    try {
      const { data: assetsData, error: assetsErr } = await supabase
        .from('view_room_asset')
        .select('*')
        .order('asset_id', { ascending: false });

      if (!assetsErr && assetsData) {
        setRoomAssets(assetsData);
      }

      const { data: homeData, error: homeErr } = await supabase
        .from('view_home_user')
        .select('*')
        .order('reported_date', { ascending: false });

      if (!homeErr && homeData) {
        setHomeUserRequests(homeData);
      }
    } catch (err) {
      console.error("Error fetching data from views:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

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
    <div className="min-h-screen bg-slate-200/80 flex justify-center items-center p-0 md:p-6">
      <div className="w-full max-w-5xl min-h-screen md:min-h-[850px] bg-[#EEF2F6] md:rounded-[28px] shadow-2xl relative flex flex-col overflow-hidden border border-slate-300">
        
        {!session ? (
          /* LOGIN PAGE */
          <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
            <div className="w-full max-w-sm flex flex-col items-center text-center">
              <DormitoryLogo className="w-32 h-32 md:w-40 md:h-40 mb-2" />
              <h1 className="text-3xl font-extrabold text-[#0B3C7B] tracking-wider mb-6">DORMITORY</h1>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">WELCOME</h2>
              <p className="text-slate-600 text-sm mb-6 font-medium">กรุณาเข้าสู่ระบบด้วยบัญชีห้องของท่าน</p>

              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="User"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-base md:text-sm"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-base md:text-sm"
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
                  className="w-full bg-[#1877F2] hover:bg-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors text-base mt-2"
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>

              <div className="text-center text-xs text-slate-400 mt-8">
                Dormitory Management System
              </div>
            </div>
          </div>
        ) : (
          /* HOME PAGE */
          <div className="flex-1 flex flex-col bg-[#EEF2F6] overflow-y-auto">
            <header className="bg-[#0B57D0] text-white px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-20">
              <h1 className="text-xl md:text-2xl font-bold">Home</h1>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchDashboardData} 
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw size={18} className={isDataLoading ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors"
                  title="ออกจากระบบ"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline">ออกจากระบบ</span>
                </button>
              </div>
            </header>

            <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto w-full flex-1">
              
              {/* Profile Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#0B3C7B] flex items-center justify-center overflow-hidden shrink-0">
                    <DormitoryLogo className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-slate-400 text-xs font-medium">บัญชีผู้ใช้</p>
                    <p className="text-slate-800 font-bold text-base md:text-lg truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                    <PlusSquare className="text-emerald-500" size={24} />
                    <span className="text-emerald-600 font-semibold text-xs md:text-sm">เพิ่มครุภัณฑ์</span>
                  </button>
                  <button className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                    <AlertCircle className="text-red-500" size={24} />
                    <span className="text-red-500 font-semibold text-xs md:text-sm">รายงานครุภัณฑ์</span>
                  </button>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* view_room_asset */}
                <div className="bg-white/60 md:bg-transparent rounded-2xl p-4 md:p-0 border md:border-none border-slate-200/60">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span>ครุภัณฑ์ในห้องพัก</span>
                    <span className="text-xs bg-blue-100 text-[#0B57D0] px-2.5 py-1 rounded-full font-semibold">
                      {roomAssets.length} รายการ
                    </span>
                  </h3>

                  {isDataLoading ? (
                    <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
                  ) : roomAssets.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                      ไม่มีรายการครุภัณฑ์ในห้องพัก
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {roomAssets.map((item) => (
                        <div key={item.asset_id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                          <AssetAvatar imageUrl={item.product_image} name={item.product_name} />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">
                              {item.product_name}
                            </h4>
                            <p className="text-[#0B57D0] font-medium text-xs my-0.5">
                              {item.status_name || 'สถานะปกติ'}
                            </p>
                            <p className="text-slate-400 text-[10px] md:text-xs font-mono">
                              {formatFullDate(item.date_add)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* view_home_user */}
                <div className="bg-white/60 md:bg-transparent rounded-2xl p-4 md:p-0 border md:border-none border-slate-200/60">
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mb-3 flex items-center justify-between">
                    <span>ติดตามสถานะครุภัณฑ์</span>
                    <span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">
                      {homeUserRequests.length} รายการ
                    </span>
                  </h3>

                  {isDataLoading ? (
                    <div className="text-center py-8 text-slate-400 text-xs">กำลังโหลดข้อมูล...</div>
                  ) : homeUserRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                      ไม่มีรายการแจ้งซ่อม
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {homeUserRequests.map((item) => (
                        <div key={item.maintenance_request_id} className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                          <AssetAvatar imageUrl={item.image_path || item.product_image} name={item.product_name} />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight truncate">
                              {item.product_name}
                            </h4>
                            <p className="text-red-500 font-medium text-xs my-0.5">
                              {item.status || 'สถานะแจ้งซ่อม'}
                            </p>
                            <p className="text-slate-400 text-[10px] md:text-xs font-mono">
                              {formatFullDate(item.reported_date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Phone Contacts */}
              <div className="pt-2 pb-4">
                <h3 className="text-base font-bold text-slate-900 mb-2">เบอร์โทรติดต่อหอพัก</h3>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0B57D0] flex items-center justify-center shrink-0">
                    <Phone size={22} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">สำนักงานหอพัก</p>
                    <p className="text-sm md:text-base font-bold text-slate-800">02-xxx-xxxx / 08x-xxx-xxxx</p>
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
