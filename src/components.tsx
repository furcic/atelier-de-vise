import { useEffect, useRef, type ReactNode } from 'react';
import {
  ArrowUpRight,
  Clock3,
  MapPin,
  Users,
  X,
  Wine,
  Paintbrush,
  Palette,
  Frame,
  Heart,
} from 'lucide-react';
import { categories, clock, dateFormat, money } from './lib';
import type { AtelierEvent } from './types';
import { assetUrl } from './preview';
export function Flower({ className = '' }: { className?: string }) {
  return (
    <img className={`flower ${className}`} src={assetUrl('/logo.svg')} alt="" aria-hidden="true" />
  );
}
export const categoryIcons = {
  wine: Wine,
  kids: Paintbrush,
  adults: Palette,
  exhibition: Frame,
  art: Heart,
};
export function EventCard({
  event,
  onClick,
  archive = false,
}: {
  event: AtelierEvent;
  onClick: () => void;
  archive?: boolean;
}) {
  const category = categories[event.category];
  const Icon = categoryIcons[event.category];
  return (
    <button className="event-card" onClick={onClick}>
      <div className="event-image">
        <img src={assetUrl(event.cover)} alt={event.title} loading="lazy" />
        <span className={`tag ${category.color}`}>
          <Icon size={13} />
          {category.label}
        </span>
        <span className="date-stamp">
          <b>{dateFormat(event.starts_at, { day: '2-digit' })}</b>
          <span>{dateFormat(event.starts_at, { month: 'short' })}</span>
        </span>
      </div>
      <div className="event-body">
        <div className="event-eyebrow">
          {archive
            ? `${event.photo_count} fotografii · amintiri de la atelier`
            : event.format === 'private'
              ? 'Ședință particulară'
              : event.category === 'exhibition'
                ? 'Expoziție'
                : 'Atelier de grup'}
          <ArrowUpRight size={19} />
        </div>
        <h3>{event.title}</h3>
        <div className="event-meta">
          <span>
            <Clock3 size={14} />
            {clock(event.starts_at)} – {clock(event.ends_at)}
          </span>
          <span>
            <MapPin size={14} />
            {event.location}
          </span>
        </div>
        <div className="event-bottom">
          <span>
            {event.price === 0 ? 'Intrare liberă' : money(event.price)}
            {event.price > 0 && <small> / persoană</small>}
          </span>
          {archive ? (
            <span className="availability">Vezi cum a fost</span>
          ) : event.category === 'exhibition' ? (
            <span className="availability">Descoperă</span>
          ) : (
            <span className={`availability ${event.available === 0 ? 'full' : ''}`}>
              <i />
              {event.available === 0
                ? 'Complet'
                : `${event.available} ${event.available === 1 ? 'loc liber' : 'locuri libere'}`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
export function Modal({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const previous = document.activeElement as HTMLElement;
    el.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? 'wide' : ''}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <button className="icon-button modal-close" onClick={onClose} aria-label="Închide">
          <X size={22} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
export function ErrorMessage({ error }: { error: string }) {
  return error ? (
    <p className="error" role="alert">
      {error}
    </p>
  ) : null;
}
export function Empty({
  title = 'Încă puțin și punem culoare aici.',
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <Flower />
      <h3>{title}</h3>
      <p>{children || 'Revenim curând cu noutăți de la atelier.'}</p>
    </div>
  );
}
export function EventFacts({ event }: { event: AtelierEvent }) {
  return (
    <div className="facts">
      <span>
        <Clock3 />
        {dateFormat(event.starts_at, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
        <small>
          {clock(event.starts_at)} – {clock(event.ends_at)} · ora României
        </small>
      </span>
      <span>
        <MapPin />
        {event.location}
        <small>Locul în care ne întâlnim</small>
      </span>
      {event.category !== 'exhibition' && (
        <span>
          <Users />
          {event.available} din {event.capacity} locuri disponibile
          <small>
            {event.format === 'private' ? 'Ședință individuală' : 'Ne bucurăm de artă împreună'}
          </small>
        </span>
      )}
    </div>
  );
}
