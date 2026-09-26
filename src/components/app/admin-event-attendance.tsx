import { useEffect, useMemo, useState } from "react";
import { Check, LoaderCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { getAdminEventAttendanceOnServer, recordEventAttendanceOnServer } from "@/lib/blossom/domain.api";
import type { AdminEventAttendanceRow } from "@/lib/blossom/event-attendance.server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow, Surface } from "@/components/app/primitives";

export function AdminEventAttendance() {
  const [rows, setRows] = useState<AdminEventAttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try { setRows(await getAdminEventAttendanceOnServer()); }
    catch { setRows([]); toast("Le registre de présence n’est pas disponible."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminEventAttendanceRow[]>();
    for (const row of rows) (map.get(row.eventId) ?? map.set(row.eventId, []).get(row.eventId)!).push(row);
    return [...map.entries()];
  }, [rows]);

  async function record(row: AdminEventAttendanceRow) {
    const key = row.eventId + ":" + row.learnerUserId;
    if (row.attendanceRecorded || busy) return;
    setBusy(key);
    try {
      await recordEventAttendanceOnServer({ data: { eventId: row.eventId, learnerUserId: row.learnerUserId } });
      setRows((current) => current.map((item) => item.eventId === row.eventId && item.learnerUserId === row.learnerUserId ? { ...item, attendanceRecorded: true, recordedAt: new Date().toISOString() } : item));
    } catch { toast("La présence n’a pas été enregistrée."); }
    finally { setBusy(""); }
  }

  return (
    <Surface className="mt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Présence · événements</Eyebrow>
          <h2 className="mt-2 font-display text-2xl">Registre réel</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Seules les inscriptions confirmées apparaissent. La présence est enregistrée par un compte d’administration.</p>
        </div>
        <Users className="size-5 text-primary" />
      </div>
      {loading ? <div className="mt-5 flex items-center gap-2 text-sm text-muted"><LoaderCircle className="size-4 animate-spin" /> Chargement…</div> :
       grouped.length === 0 ? <p className="mt-5 text-sm text-muted">Aucune inscription confirmée à pointer.</p> :
       <div className="mt-5 space-y-5">
         {grouped.map(([eventId, eventRows]) => (
           <section key={eventId} className="rounded-2xl border border-border bg-surface-2/30">
             <div className="border-b border-border p-4">
               <p className="font-medium">{eventRows[0]?.eventTitle}</p>
               <p className="mt-1 text-xs text-muted">{eventRows[0]?.eventDate} · {eventRows[0]?.eventTime}</p>
             </div>
             <div className="divide-y divide-border/60">
               {eventRows.map((row) => {
                 const key = row.eventId + ":" + row.learnerUserId;
                 return <div key={key} className="flex flex-wrap items-center gap-3 p-4">
                   <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{row.learnerName}</span><span className="mt-1 block text-xs text-subtle">{row.learnerUserId}</span></span>
                   {row.attendanceRecorded ? <Badge variant="outline"><Check className="mr-1 size-3" /> Présent</Badge> :
                     <Button size="sm" variant="secondary" disabled={busy === key} onClick={() => void record(row)}>{busy === key ? "Enregistrement…" : "Pointer présent"}</Button>}
                 </div>;
               })}
             </div>
           </section>
         ))}
       </div>}
    </Surface>
  );
}
