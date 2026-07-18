"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, ExternalLink, ShieldCheck, ShieldAlert } from "lucide-react";

// Mocking the FastAPI response type
type Merchant = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: string;
};

export default function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Fetch from FastAPI backend
    fetch("http://localhost:8000/api/v1/merchants/")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch merchants");
        return res.json();
      })
      .then(data => {
        setMerchants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.legal_name && m.legal_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Merchant Intelligence</h2>
          <p className="text-muted-foreground">Manage and analyze your global merchant portfolio.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Merchant
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search merchants by name or legal entity..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant Name</TableHead>
              <TableHead>Legal Entity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Profile</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredMerchants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No merchants found.
                </TableCell>
              </TableRow>
            ) : (
              filteredMerchants.map((merchant) => (
                <TableRow key={merchant.id}>
                  <TableCell className="font-medium">{merchant.name}</TableCell>
                  <TableCell className="text-muted-foreground">{merchant.legal_name || "N/A"}</TableCell>
                  <TableCell>
                    {merchant.is_active ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-100">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {merchant.is_active ? (
                       <span className="flex items-center text-emerald-600 text-sm font-medium"><ShieldCheck className="w-4 h-4 mr-1"/> Low Risk</span>
                    ) : (
                       <span className="flex items-center text-red-600 text-sm font-medium"><ShieldAlert className="w-4 h-4 mr-1"/> High Risk</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/merchants/${merchant.id}`}>
                      <Button variant="outline" size="sm">
                        View Details <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
