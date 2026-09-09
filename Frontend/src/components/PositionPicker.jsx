import React, { useRef, useState } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, MapPin, Briefcase, Check, Volume2, Loader2, X } from 'lucide-react';
import BriefingPlayer from './BriefingPlayer';

// The position a new joiner picks while registering.
//
// One carousel per specialization they chose, six live openings in each. They
// pick exactly one — it is assigned to them the moment the account is created,
// so it is waiting on their Assigned Positions page when they first sign in.
//
// Where the client has recorded a briefing they can hear it here, before
// committing: /api/briefing/public/:posId needs no login, and only ever returns
// the ClientSPOC's own briefing.
export default function PositionPicker({
  groups,            // [{ category, positions: [...] }]
  selected,          // the chosen position, or null
  onSelect,
  closed,            // the band chosen against it
  onClosedChange,
  bands,
}) {
  const [briefingFor, setBriefingFor] = useState(null);   // position whose briefing is open
  const [items, setItems] = useState([]);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const openBriefing = async (pos) => {
    setBriefingFor(pos);
    setItems([]);
    setLoadingBriefing(true);
    try {
      const r = await axios.get(`/api/briefing/public/${pos.pos_id}`);
      setItems(r.data?.briefings?.[0]?.items || []);
    } catch { setItems([]); }
    finally { setLoadingBriefing(false); }
  };

  return (
    <div className="space-y-5">
      {groups.map(g => (
        <Carousel key={g.category} category={g.category} positions={g.positions}
          selected={selected} onSelect={onSelect} onBriefing={openBriefing} />
      ))}

      {/* The track-record question, asked only about the one they picked. */}
      {selected && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
          <p className="text-sm font-semibold text-gray-800">
            How many roles like <span className="text-blue-700">{selected.position}</span> have you closed?
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {bands.map(band => {
              const on = closed === band;
              return (
                <button type="button" key={band} onClick={() => onClosedChange(on ? '' : band)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    on ? 'border-blue-500 bg-blue-600 text-white'
                       : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>
                  {band} closed
                </button>
              );
            })}
          </div>
        </div>
      )}

      {briefingFor && (
        <BriefingModal position={briefingFor} items={items} loading={loadingBriefing}
          onClose={() => setBriefingFor(null)} />
      )}
    </div>
  );
}

function Carousel({ category, positions, selected, onSelect, onBriefing }) {
  const track = useRef(null);
  const scroll = (dir) => {
    if (!track.current) return;
    track.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (!positions.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-bold text-gray-700">{category}
          <span className="ml-2 font-normal text-gray-400">{positions.length} open</span>
        </p>
        {positions.length > 1 && (
          <div className="flex gap-1">
            <button type="button" onClick={() => scroll(-1)} aria-label={`Scroll ${category} left`}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
              <ChevronLeft size={15} />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={`Scroll ${category} right`}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      <div ref={track}
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'thin' }}>
        {positions.map(p => {
          const on = selected?.pos_id === p.pos_id;
          return (
            <div key={p.pos_id}
              className={`snap-start flex-shrink-0 w-[260px] rounded-xl border-2 p-3.5 transition-all ${
                on ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-800 text-[13.5px] leading-snug line-clamp-2">
                  {p.position}
                </p>
                {on && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 grid place-items-center">
                    <Check size={12} className="text-white" />
                  </span>
                )}
              </div>

              <p className="text-[12px] text-gray-500 mt-1.5 truncate">{p.client}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11.5px] text-gray-400">
                {p.location && <span className="inline-flex items-center gap-1 truncate max-w-[120px]"><MapPin size={10} />{p.location}</span>}
                {p.experience && <span className="inline-flex items-center gap-1"><Briefcase size={10} />{p.experience}</span>}
              </div>

              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => onSelect(on ? null : p)}
                  className={`flex-1 px-3 py-2 rounded-lg text-[12.5px] font-bold transition-all ${
                    on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'}`}>
                  {on ? 'Selected' : 'Select'}
                </button>
                {p.hasBriefing && (
                  <button type="button" onClick={() => onBriefing(p)} title="Hear the client's briefing"
                    className="px-2.5 py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100">
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BriefingModal({ position, items, loading, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold tracking-wide text-orange-600">CLIENT BRIEFING</p>
            <p className="font-bold text-gray-900 text-[15px] leading-snug">{position.position}</p>
            <p className="text-xs text-gray-500">{position.client}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={15} className="animate-spin" /> Loading the briefing…
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-500">No briefing available for this position.</p>
          ) : (
            items.map(item => <BriefingPlayer key={item.key} item={item} dark={false} />)
          )}
        </div>
      </div>
    </div>
  );
}
