import { useEffect, useState } from 'react'
import { Calendar, Clock, Plus, Save, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import {
  useSupervisorAvailability,
  useSaveAvailability,
  type AvailabilityEntry,
} from '@/lib/hooks/useSupervisor'

const DAYS: AvailabilityEntry['dayOfWeek'][] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const DAY_LABEL: Record<AvailabilityEntry['dayOfWeek'], string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

function normaliseTime(t: string): string {
  // accept HH:mm or HH:mm:ss → return HH:mm
  if (!t) return ''
  return t.length >= 5 ? t.slice(0, 5) : t
}

export function MyAvailability() {
  const { data: serverEntries, isLoading } = useSupervisorAvailability()
  const saveMutation = useSaveAvailability()
  const [entries, setEntries] = useState<AvailabilityEntry[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (serverEntries) {
      setEntries(
        serverEntries.map((e) => ({
          ...e,
          startTime: normaliseTime(e.startTime),
          endTime: normaliseTime(e.endTime),
        }))
      )
    }
  }, [serverEntries])

  const addEntry = (day: AvailabilityEntry['dayOfWeek']) => {
    setEntries((prev) => [
      ...prev,
      {
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '12:00',
        slotDurationMinutes: 30,
        isActive: true,
      },
    ])
  }

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, patch: Partial<AvailabilityEntry>) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const validate = (): string | null => {
    for (const e of entries) {
      if (!e.startTime || !e.endTime) return `${DAY_LABEL[e.dayOfWeek]}: time is required`
      if (e.startTime >= e.endTime) {
        return `${DAY_LABEL[e.dayOfWeek]}: end time must be after start time`
      }
      const [sh, sm] = e.startTime.split(':').map(Number)
      const [eh, em] = e.endTime.split(':').map(Number)
      const minutes = eh * 60 + em - (sh * 60 + sm)
      if (minutes < e.slotDurationMinutes) {
        return `${DAY_LABEL[e.dayOfWeek]}: window is shorter than the slot length`
      }
    }
    return null
  }

  const handleSave = async () => {
    setSaveError(null)
    const err = validate()
    if (err) {
      setSaveError(err)
      return
    }
    try {
      await saveMutation.mutateAsync(entries)
      setSavedAt(Date.now())
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || e?.message || 'Failed to save availability')
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const entriesByDay: Record<string, { entry: AvailabilityEntry; index: number }[]> = {}
  DAYS.forEach((d) => (entriesByDay[d] = []))
  entries.forEach((e, i) => {
    entriesByDay[e.dayOfWeek].push({ entry: e, index: i })
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-stone-900">
          <Calendar className="h-6 w-6 text-primary" />
          My Availability
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Publish the weekly timeslots students can book for supervision meetings. Each row creates
          bookable slots of the chosen length.
        </p>
      </div>

      {saveError && (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {saveError}
        </div>
      )}
      {savedAt && !saveError && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Availability saved. Students will see the new slots.
        </div>
      )}

      <Card>
        <div className="space-y-3 p-4">
          {DAYS.map((day) => {
            const dayRows = entriesByDay[day]
            return (
              <div key={day} className="border-b border-stone-100 pb-3 last:border-b-0 last:pb-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-stone-800">{DAY_LABEL[day]}</span>
                  <button
                    type="button"
                    onClick={() => addEntry(day)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add slot range
                  </button>
                </div>
                {dayRows.length === 0 ? (
                  <p className="text-sm italic text-stone-400">No slots — students cannot book on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {dayRows.map(({ entry, index }) => (
                      <div key={index} className="flex flex-wrap items-end gap-3">
                        <div className="flex items-center gap-1 text-sm text-stone-500">
                          <Clock className="h-4 w-4" />
                        </div>
                        <Input
                          label="From"
                          type="time"
                          value={entry.startTime}
                          onChange={(ev) => updateEntry(index, { startTime: ev.target.value })}
                          className="w-32"
                        />
                        <Input
                          label="To"
                          type="time"
                          value={entry.endTime}
                          onChange={(ev) => updateEntry(index, { endTime: ev.target.value })}
                          className="w-32"
                        />
                        <div>
                          <label className="mb-1 block text-xs font-medium text-stone-700">
                            Slot length
                          </label>
                          <select
                            value={entry.slotDurationMinutes}
                            onChange={(ev) =>
                              updateEntry(index, { slotDurationMinutes: Number(ev.target.value) })
                            }
                            className="rounded-md border border-stone-300 px-2 py-2 text-sm"
                          >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          className="mb-1 inline-flex items-center gap-1 rounded-md p-2 text-rose-600 hover:bg-rose-50"
                          aria-label="Remove timeslot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2"
        >
          {saveMutation.isPending ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
          Save weekly availability
        </Button>
      </div>
    </div>
  )
}
