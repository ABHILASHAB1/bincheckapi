"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CreditCard, Globe, Building2, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BinLookupPage() {
  const [bin, setBin] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (bin.length < 6) {
      setError("Please enter at least the first 6 digits of the BIN.");
      setResult(null);
      return;
    }
    
    setError(null);
    setLoading(true);
    setResult(null);

    // Mock API Call targeting the FastAPI backend endpoint logic
    setTimeout(() => {
      const firstDigit = bin[0];
      let brand = "Unknown";
      let bank = "Universal Bank";
      
      if (firstDigit === "4") {
        brand = "Visa";
        bank = bin.startsWith("400000") ? "Chase Bank" : "Bank of America";
      } else if (firstDigit === "5") {
        brand = "Mastercard";
        bank = bin.startsWith("510000") ? "Citi" : "Capital One";
      } else if (firstDigit === "3") {
        brand = "American Express";
        bank = "American Express";
      } else if (firstDigit === "6") {
        brand = "Discover";
        bank = "Discover Financial";
      } else {
        setError("BIN not recognized or invalid format.");
        setLoading(false);
        return;
      }

      setResult({
        bin: bin.substring(0, 6),
        brand: brand,
        type: "Credit",
        level: "Platinum",
        issuer: bank,
        country_code: "US",
        country_name: "United States",
        currency: "USD",
        is_prepaid: false,
        is_commercial: false
      });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">BIN Intelligence</h2>
        <p className="text-muted-foreground">Decode Bank Identification Numbers instantly using the RemitWise engine.</p>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter 6 to 8 digit BIN (e.g., 400000)"
                className="pl-10 h-12 text-lg font-mono bg-slate-50"
                value={bin}
                onChange={(e) => setBin(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-md" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
              Lookup
            </Button>
          </form>
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                Card Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">BIN Number</p>
                  <p className="text-xl font-mono font-bold">{result.bin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Card Brand</p>
                  <Badge variant="secondary" className="text-base px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200">
                    {result.brand}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Card Type</p>
                  <p className="font-medium">{result.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Card Level</p>
                  <p className="font-medium">{result.level}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Building2 className="w-5 h-5 mr-2 text-emerald-600" />
                Issuer Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-y-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Issuing Bank</p>
                  <p className="text-xl font-bold text-slate-800">{result.issuer}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1 flex items-center">
                    <Globe className="w-4 h-4 mr-1" /> Country
                  </p>
                  <p className="font-medium">{result.country_name} ({result.country_code})</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Currency</p>
                  <p className="font-medium">{result.currency}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {result.is_prepaid && <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Prepaid</Badge>}
                {result.is_commercial && <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Commercial</Badge>}
                {!result.is_prepaid && !result.is_commercial && <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">Consumer</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
