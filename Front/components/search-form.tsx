"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { racesApi } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface Race {
  id: string
  name: string
  date: string
  location?: string
}

const disciplines = [
  { id: "running", name: "Running" },
  { id: "ciclismo", name: "Ciclismo" },
  { id: "enduro", name: "Enduro" },
  { id: "mtb", name: "Mountain Bike" },
  { id: "trail", name: "Trail Running" },
  { id: "triatlon", name: "Triatlón" },
]

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [bibNumber, setBibNumber] = useState(searchParams.get("numero") || "")
  const [discipline, setDiscipline] = useState(searchParams.get("disciplina") || "all") // Updated default value
  const [raceId, setRaceId] = useState(searchParams.get("race") || "all") // Updated default value
  const [races, setRaces] = useState<Race[]>([])
  const [loadingRaces, setLoadingRaces] = useState(false)

  useEffect(() => {
    const fetchRaces = async () => {
      try {
        setLoadingRaces(true)
        const data = await racesApi.getActive()
        setRaces(Array.isArray(data) ? data : data.races || [])
      } catch (error) {
        console.error("Error fetching races:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los eventos",
          variant: "destructive",
        })
      } finally {
        setLoadingRaces(false)
      }
    }
    fetchRaces()
  }, [toast])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!bibNumber) {
      toast({
        title: "Campo requerido",
        description: "Ingresá tu número de dorsal",
        variant: "destructive",
      })
      return
    }

    const params = new URLSearchParams()
    if (bibNumber) params.set("numero", bibNumber)
    if (raceId !== "all") params.set("race", raceId)
    if (discipline !== "all") params.set("disciplina", discipline)
    router.push(`/buscar?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="bibNumber">Número de dorsal *</Label>
        <Input
          id="bibNumber"
          type="number"
          placeholder="Ej: 1234"
          value={bibNumber}
          onChange={(e) => setBibNumber(e.target.value)}
          min="1"
          className="h-12"
          required
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="race">Evento (opcional)</Label>
          <Select value={raceId} onValueChange={setRaceId} disabled={loadingRaces}>
            <SelectTrigger id="race" className="h-12">
              <SelectValue placeholder={loadingRaces ? "Cargando eventos..." : "Seleccioná un evento"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {races.map((race) => (
                <SelectItem key={race.id} value={race.id}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {race.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discipline">Disciplina (opcional)</Label>
          <Select value={discipline} onValueChange={setDiscipline}>
            <SelectTrigger id="discipline" className="h-12">
              <SelectValue placeholder="Seleccioná la disciplina" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {disciplines.map((disc) => (
                <SelectItem key={disc.id} value={disc.id}>
                  {disc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <Search className="mr-2 h-5 w-5" />
        Buscar fotos
      </Button>
    </form>
  )
}
