'use client';
import type { ReactNode } from 'react';
import { ArrowUpRight, Info, LoaderCircle } from 'lucide-react';
export function Panel({
  children,
  className = '',
  title,
  eyebrow,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`panel ${className}`}>
      {title && (
        <div className="panel-head">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            <h3>{title}</h3>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Notice({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warning' | 'error';
}) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}
export function Busy({ text = 'Calculating your landscape…' }: { text?: string }) {
  return (
    <div className="busy">
      <LoaderCircle className="spin" size={23} />
      {text}
    </div>
  );
}
export function Stat({
  label,
  value,
  unit,
  detail,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat-label">
        {label}
        {icon}
      </div>
      <div className="stat-value">
        {value}
        <span>{unit}</span>
      </div>
      <small>{detail}</small>
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function LinkOut({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export const fmt = (v: number | null | undefined, d = 0) =>
  v == null ? 'Unavailable' : v.toLocaleString(undefined, { maximumFractionDigits: d });
