// src/app/dashboard/DashboardClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, Search, MoreHorizontal, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

type Entry = {
  id: number;
  status: number | string;
  content: Record<string, string>;
  updated_at: string;
  offer_price?: number; // Legg til offer_price
  vehicle?: {
    make: string;
    model: string;
    mileage: string;
    fuel: string;
    color: string;
    next_eu: string;
  };
};

// Helper function to format kilometers with spaces
const formatKilometers = (km: string | number | undefined): string => {
  if (!km) return "";
  
  // Convert to string and remove any existing spaces or non-digits
  const cleanKm = String(km).replace(/\D/g, "");
  
  // Convert to number and format with spaces
  const number = parseInt(cleanKm, 10);
  if (isNaN(number)) return "";
  
  return number.toLocaleString("no-NO").replace(/,/g, " ");
};

// Helper function to format price
const formatPrice = (price: number | undefined): string => {
  if (!price) return "";
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>();
  const [page, setPage] = useState(1);

  // Send-offer dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [sending, setSending] = useState(false);

  // Confirm-finish dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [entryToConfirm, setEntryToConfirm] = useState<Entry | null>(null);

  // Confirm-delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);

  const perPage = 10;

  // Fetch entries
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      window.location.href = "/api/auth/signin?callbackUrl=/dashboard";
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/entries`, {
      headers: { Authorization: `Bearer ${(session as any).wpToken}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data: any) => setEntries(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error("Failed to load entries:", err);
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [session, status]);

  // Request delete confirmation
  const requestDelete = (entry: Entry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  // Perform deletion
  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/entries/${entryToDelete.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${(session as any).wpToken}` } }
      );
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== entryToDelete.id));
      } else {
        console.error("Failed to delete entry", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  // Status badges
  const statusLabels: Record<number, React.ReactNode> = {
    1: <Badge variant="outline" className="bg-gray-100">Ikke håndtert</Badge>,
    2: <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock size={14} className="mr-1" />Tilbud sendt</Badge>,
    3: <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle size={14} className="mr-1" />Fullført</Badge>,
    4: <Badge variant="outline" className="bg-blue-100 text-blue-800"><CheckCircle size={14} className="mr-1" />Akseptert</Badge>,
    5: <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle size={14} className="mr-1" />Ikke interessert</Badge>,
  };

  // Filters
  const filtered = entries
    .filter((e) => (statusFilter && statusFilter !== "alle" ? String(e.status) === statusFilter : true))
    .filter((e) =>
      search ? JSON.stringify(e.content).toLowerCase().includes(search.toLowerCase()) : true
    )
    .filter((e) => {
      if (!dateRange?.from && !dateRange?.to) return true;
      const d = new Date(e.updated_at);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      return true;
    });

  const total = filtered.length;
  const pages = Math.ceil(total / perPage);
  const slice = filtered.slice((page - 1) * perPage, page * perPage);

  // Open send-offer dialog
  const openOfferDialog = (entry: Entry) => {
    setSelectedEntry(entry);
    setOfferPrice("");
    setOpenDialog(true);
  };

  // Send offer
  const sendOffer = async () => {
    if (!selectedEntry) return;
    setSending(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/offer/${selectedEntry.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session as any).wpToken}`,
          },
          body: JSON.stringify({ 
            price: parseInt(offerPrice, 10), 
            email: selectedEntry.content["E-post"] || selectedEntry.content["contact-email"]
          }),
        }
      );
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === selectedEntry.id ? { 
            ...e, 
            status: 2,
            offer_price: parseInt(offerPrice, 10) 
          } : e))
        );
      } else {
        console.error("Send offer failed", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      setOpenDialog(false);
    }
  };

  // Prompt finish-offer dialog
  const promptFinishOffer = (entry: Entry) => {
    setEntryToConfirm(entry);
    setConfirmDialogOpen(true);
  };

  // Confirm finish
  const confirmFinishOffer = async () => {
    if (!entryToConfirm) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_WP_URL}/wp-json/easydeals/v1/offer/${entryToConfirm.id}/status`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${(session as any).wpToken}` 
          },
          body: JSON.stringify({ status: 3 }),
        }
      );
      if (res.ok) {
        setEntries((prev) =>
          prev.map((e) => (e.id === entryToConfirm.id ? { ...e, status: 3 } : e))
        );
      } else {
        console.error("Finish offer failed", await res.text());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDialogOpen(false);
      setEntryToConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Filter bar skeleton */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-9 w-40 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-9 w-64 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="overflow-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="h-4 w-8 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-20 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-16 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                  <TableHead>
                    <div className="h-4 w-12 bg-gray-300 rounded animate-pulse"></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({length: 5}).map((_, i) => (
                  <TableRow key={i} className="hover:bg-gray-50">
                    {/* Bil kolonne */}
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    
                    {/* Kontaktinfo kolonne */}
                    <TableCell className="min-w-[150px]">
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    
                    {/* Melding kolonne */}
                    <TableCell className="max-w-[300px]">
                      <div className="space-y-1">
                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    
                    {/* Status kolonne */}
                    <TableCell className="whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                    
                    {/* Sist oppdatert kolonne */}
                    <TableCell className="whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    
                    {/* Handling kolonne */}
                    <TableCell className="whitespace-nowrap">
                      <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                    
                    {/* Meny kolonne */}
                    <TableCell className="whitespace-nowrap">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* Metrics cards skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({length: 5}).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow border">
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Henvendelser</h1>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="lg" className="cursor-pointer">
              {dateRange?.from && dateRange.to
                ? `${format(dateRange.from, "dd.MM.yyyy")} – ${format(dateRange.to, "dd.MM.yyyy")}`
                : "Velg dato"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} />
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 cursor-pointer">
            <SelectValue placeholder="Alle status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="alle">Alle status</SelectItem>
            <SelectItem value="1">Ikke håndtert</SelectItem>
            <SelectItem value="2">Tilbud sendt</SelectItem>
            <SelectItem value="3">Fullført</SelectItem>
            <SelectItem value="4">Akseptert</SelectItem>
            <SelectItem value="5">Ikke interessert</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative w-64">
          <Input placeholder="Søk..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        </div>

        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => {
            setStatusFilter("alle");
            setSearch("");
            setDateRange(undefined);
            setPage(1);
          }}
          className="text-gray-600 hover:text-gray-800 cursor-pointer"
        >
          Nullstill filtre
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bil</TableHead>
              <TableHead>Kontaktinfo</TableHead>
              <TableHead>Melding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sist oppdatert</TableHead>
              <TableHead>Handling</TableHead>
              <TableHead>Meny</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((entry) => {
              const c = entry.content;
              const v = entry.vehicle;
              const s = Number(entry.status);
              
              return (
                <TableRow key={entry.id} className="hover:bg-gray-50">
                  <TableCell className="min-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-medium text-sm text-gray-900">
                        {(c.vehicle_make || c.Merke || c.merke)?.toUpperCase()} {(c.vehicle_model || c.Model || c.model)?.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-600">{c.Registreringsnummer || c.regnr}</p>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <div>{c.vehicle_color || c.Farge || 'Ukjent farge'} • {c.vehicle_fuel || c.Drivstoff || 'Ukjent drivstoff'}</div>
                        <div>{formatKilometers(c.vehicle_mileage || c.Kilometerstand)} km</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <div>
                      <p>
                      <span className="font-medium">{c.Navn}</span>
                      {c["Område (by)"] && <span className="ml-2 text-gray-500 bg-[#f0f0f0] text-[10px] p-1 space-x-1 rounded-sm"> {c["Område (by)"]}</span>}
                      </p>
                      <p className="text-xs text-gray-600">{c["E-post"] || c["contact-email"]}</p>
                      <p className="text-xs text-gray-600">{c.Telefon}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    {c.Melding ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-sm text-gray-700 cursor-help line-clamp-2">
                            {c.Melding.length > 100 ? `${c.Melding.substring(0, 100)}...` : c.Melding}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md p-3 text-sm">
                          {c.Melding}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-xs text-gray-400">Ingen melding</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="space-y-1">
                      {/* Status badge */}
                      <div>{statusLabels[s]}</div>
                      
                      {/* Pristilbud info */}
                      {entry.offer_price ? (
                        <div className="">
                          <p className="font-medium text-green-700 text-xs">Pristilbud: {formatPrice(entry.offer_price)}</p>
                        </div>
                      ) : s === 1 ? (
                        <span className="text-xs text-gray-400">Ingen tilbud sendt</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-gray-600">
                    {new Date(entry.updated_at).toLocaleDateString("no-NO", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {s === 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOfferDialog(entry)}
                        className="bg-[#27ae60] cursor-pointer hover:bg-green-600 text-white hover:text-white text-xs"
                      >
                        Send tilbud
                      </Button>
                    )}
                    {s === 2 && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="text-yellow-600" />
                        <span>Venter på svar</span>
                      </div>
                    )}
                    {s === 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promptFinishOffer(entry)}
                        className="cursor-pointer"
                      >
                        Marker som fullført
                      </Button>
                    )}
                    {s === 5 && ( 
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openOfferDialog(entry)}
                        className="text-gray-700"
                      >
                        Send nytt tilbud
                      </Button>
                    )}
                    {s === 3 && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle size={16} />
                        <span>Fullført</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="cursor-pointer">
                          <MoreHorizontal />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="space-y-1 p-2">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-600 cursor-pointer"
                          onClick={() => requestDelete(entry)}
                        >
                          Slett
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-600">
          Viser {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} av {total}
        </p>
        <div className="space-x-2">
          <Button
            size="icon"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            disabled={page === pages}
            onClick={() => setPage((p) => Math.min(p + 1, pages))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", fn: (e: Entry[]) => e.length },
          { label: "Tilbud sendt", fn: (e: Entry[]) => e.filter((x) => Number(x.status) === 2).length },
          { label: "Akseptert", fn: (e: Entry[]) => e.filter((x) => Number(x.status) === 4).length },
          { label: "Fullført", fn: (e: Entry[]) => e.filter((x) => Number(x.status) === 3).length },
          { label: "Ikke interessert", fn: (e: Entry[]) => e.filter((x) => Number(x.status) === 5).length },
        ].map((m, i) => (
          <div key={i} className="p-4 bg-white rounded-lg shadow border">
            <p className="text-sm text-gray-500 mb-1">{m.label}</p>
            <p className="text-2xl font-semibold text-gray-900">{m.fn(entries)}</p>
          </div>
        ))}
      </div>

      {/* DIALOG: Send pristilbud */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send pristilbud</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedEntry?.content["Navn"]}</p>
              <p className="text-sm text-gray-600">
                {selectedEntry?.vehicle?.make || selectedEntry?.content["Merke"] || selectedEntry?.content["merke"]} {selectedEntry?.vehicle?.model || selectedEntry?.content["Model"] || selectedEntry?.content["model"]}
              </p>
              <p className="text-sm text-gray-600">
                {selectedEntry?.content["Registreringsnummer"] || selectedEntry?.content["regnr"]}
              </p>
              {selectedEntry?.offer_price && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <p className="text-blue-700">Tidligere tilbud: <strong>{formatPrice(selectedEntry.offer_price)}</strong></p>
                </div>
              )}
            </div>
            <Input
              placeholder="Pris i NOK"
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
            />
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              💡 Kunden vil motta en e-post med tilbudet og kan velge å akseptere eller avslå. Du får automatisk beskjed når de svarer.
            </div>
          </div>
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Avbryt
            </Button>
            <Button onClick={sendOffer} disabled={sending || !offerPrice}>
              {sending ? "Sender..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Bekreft fullført */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bekreft fullført</DialogTitle>
          </DialogHeader>
          <p className="px-6">
            Er du sikker på at du vil markere <strong>{entryToConfirm?.content["Navn"]}</strong> som fullført?
          </p>
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={confirmFinishOffer}>Ja, fullfør</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Bekreft sletting */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bekreft sletting</DialogTitle>
          </DialogHeader>
          <p className="px-6">
            Er du sikker på at du vil slette{" "}
            <strong>{entryToDelete?.content["Navn"]}</strong>?
          </p>
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Ja, slett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}