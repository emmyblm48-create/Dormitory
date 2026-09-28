"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Bell, Droplet, Lightbulb, Snowflake } from "lucide-react";
import styles from "./AppShowcase.module.css";

// Design size of the stage in AppShowcase.module.css; scaled to fit the parent.
const STAGE_W = 1000;
const STAGE_H = 760;

const REPAIRS = [
  { icon: Snowflake, name: "แอร์ไม่เย็น", status: "กำลังซ่อม", width: "75%", delay: "2.1s" },
  { icon: Droplet, name: "ก๊อกน้ำรั่ว", status: "รอช่าง", width: "40%", delay: "2.3s" },
  { icon: Lightbulb, name: "หลอดไฟห้องน้ำ", status: "เสร็จแล้ว", width: "100%", delay: "2.5s" },
];

const GRAPH_POINTS: [number, number][] = [
  [10, 100], [50, 82], [90, 88], [130, 50], [170, 62], [210, 28], [250, 38],
];
const MONTHS = ["ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค."];

// Animated three-phone mockup of the app: the dashboard pops in, two side
// screens fan out behind it, then the ring, bars and graph fill in.
export function AppShowcase({ className = "" }: { className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setScale(Math.min(width / STAGE_W, height / STAGE_H));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = GRAPH_POINTS.map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div ref={frameRef} className={`${styles.frame} ${className}`} aria-hidden="true">
      {/* Only mount once measured, so the timeline starts at the right size */}
      {scale != null && (
        <div
          className={styles.stage}
          style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
        >
          <div className={styles.glow} />
          <div className={styles.inner}>
            {/* Left — lifestyle */}
            <div className={`${styles.phone} ${styles.phoneLeft}`}>
              <div className={styles.bezel}>
                <div className={styles.notch} />
                <div className={`${styles.screen} ${styles.screenLeft}`}>
                  <div className={styles.leftArt}>
                    <svg viewBox="0 0 220 300" fill="none">
                      {/* Geometric dorm building */}
                      <rect x="50" y="60" width="120" height="170" rx="6" fill="#0850B0" opacity="0.14" />
                      <path d="M42 64 L110 22 L178 64 Z" fill="#0850B0" opacity="0.2" />
                      {[0, 1, 2, 3].map((row) =>
                        [0, 1, 2].map((col) => (
                          <rect
                            key={`${row}-${col}`}
                            x={66 + col * 32}
                            y={80 + row * 32}
                            width="20"
                            height="18"
                            rx="3"
                            fill={row === 1 && col === 1 ? "#3C8CF6" : "#0850B0"}
                            opacity={row === 1 && col === 1 ? 0.8 : 0.18}
                          />
                        ))
                      )}
                      <rect x="96" y="198" width="28" height="32" rx="3" fill="#0850B0" opacity="0.25" />
                      <path d="M20 262 Q110 212 200 262" stroke="#3C8CF6" strokeWidth="3" opacity="0.6" />
                      <path d="M4 288 Q110 228 216 288" stroke="#3C8CF6" strokeWidth="2" opacity="0.35" />
                    </svg>
                  </div>
                  <div className={styles.leftBottom}>
                    <div className={styles.tagline}>
                      อยู่สบาย
                      <br />
                      แจ้งซ่อมง่าย
                    </div>
                    <div className={styles.cta}>แจ้งซ่อมเลย</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center — dashboard */}
            <div className={`${styles.phone} ${styles.phoneCenter}`}>
              <div className={styles.bezel}>
                <div className={styles.notch} />
                <div className={`${styles.screen} ${styles.screenCenter}`}>
                  <div className={styles.header}>
                    <div className={styles.avatar}>204</div>
                    <div className={styles.userInfo}>
                      <div className={styles.name}>ห้อง 204</div>
                      <div className={styles.subtitle}>ผู้เช่า · อาคาร A</div>
                    </div>
                    <div className={styles.bell}>
                      <Bell size={20} strokeWidth={1.6} />
                      <span className={styles.bellDot} />
                    </div>
                  </div>

                  <div className={styles.goal}>
                    <div className={styles.cardLabel}>เช็คอุปกรณ์ในห้อง</div>
                    <div className={styles.ringWrap}>
                      <svg viewBox="0 0 140 140">
                        <circle cx="70" cy="70" r="52" fill="none" stroke="#1B3A66" strokeWidth="10" />
                        <circle
                          className={styles.ringFill}
                          cx="70"
                          cy="70"
                          r="52"
                          fill="none"
                          stroke="#80B4F9"
                          strokeWidth="10"
                          strokeLinecap="round"
                          pathLength={100}
                          transform="rotate(-90 70 70)"
                        />
                      </svg>
                      <div className={styles.ringCount}>
                        <span className={styles.ringNum}>8</span>
                        <span className={styles.ringDen}>/12</span>
                      </div>
                    </div>
                    <div className={styles.ringCaption}>เช็คแล้ว 8 จาก 12 ชิ้น</div>
                  </div>

                  <div className={styles.progress}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressTitle}>สถานะแจ้งซ่อม</span>
                      <span className={styles.progressLink}>ดูทั้งหมด</span>
                    </div>
                    {REPAIRS.map(({ icon: Icon, name, status, width, delay }) => (
                      <div key={name} className={styles.barRow}>
                        <div className={styles.barIcon}>
                          <Icon size={14} />
                        </div>
                        <div className={styles.barInfo}>
                          <span className={styles.barName}>{name}</span>
                          <span className={styles.barVal}>{status}</span>
                        </div>
                        <div className={styles.barTrack}>
                          <div
                            className={styles.barValue}
                            style={{ "--w": width, "--d": delay } as CSSProperties}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right — stats */}
            <div className={`${styles.phone} ${styles.phoneRight}`}>
              <div className={styles.bezel}>
                <div className={styles.notch} />
                <div className={`${styles.screen} ${styles.screenRight}`}>
                  <div>
                    <div className={styles.rightTitle}>งานซ่อมที่เสร็จแล้ว</div>
                    <div className={styles.rightValue}>
                      48 <span className={styles.rightUnit}>งาน</span>
                    </div>
                  </div>

                  <div className={styles.graphWrap}>
                    <svg className={styles.graph} viewBox="0 0 260 130">
                      {[25, 55, 85, 115].map((y) => (
                        <line key={y} x1="10" y1={y} x2="250" y2={y} stroke="#DDEBFD" strokeWidth="1" />
                      ))}
                      <path
                        className={styles.graphArea}
                        d={`M${points.replace(/ /g, " L")} L250,115 L10,115 Z`}
                        fill="#0B68E5"
                      />
                      <polyline
                        className={styles.graphLine}
                        points={points}
                        pathLength={1}
                        fill="none"
                        stroke="#0B68E5"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {GRAPH_POINTS.map(([x, y], i) => (
                        <circle
                          key={x}
                          className={styles.graphDot}
                          cx={x}
                          cy={y}
                          r="3.5"
                          fill="#0B68E5"
                          style={{ "--d": `${3 + i * 0.06}s` } as CSSProperties}
                        />
                      ))}
                    </svg>
                    <div className={styles.graphLabels}>
                      {MONTHS.map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.stats}>
                    <div className={styles.pill}>
                      <span className={styles.pillDot} style={{ background: "#0B68E5" }} />
                      <span className={styles.pillLabel}>เสร็จ</span>
                      <span className={styles.pillNum}>42</span>
                    </div>
                    <div className={styles.pill}>
                      <span className={styles.pillDot} style={{ background: "#94A3B8" }} />
                      <span className={styles.pillLabel}>รอ</span>
                      <span className={styles.pillNum}>6</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
