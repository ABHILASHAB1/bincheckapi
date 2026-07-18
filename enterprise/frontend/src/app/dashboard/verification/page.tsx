"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, AlertCircle, Building, CheckCircle2, XCircle, Loader2, Globe } from "lucide-react";

export default function VerificationPage() {
  const [routing, setRouting] = useState("");
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(false);
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [ibanResult, setIbanResult] = useState<any>(null);

  const handleRoutingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRoutingResult(null);

    // Call FastAPI Backend
    fetch("http://localhost:8000/api/v1/intelligence/validate/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ routing_number: routing }),
    })
      .then(res => res.json())
      .then(data => {
        setRoutingResult(data);
        setLoading(false);
      })
      .catch(err => {
        setRoutingResult({ is_valid: false, routing_number: routing, error: "Network Error: Could not connect to validation server." });
        setLoading(false);
      });
  };

  const handleIbanSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIbanResult(null);

    // Call FastAPI Backend
    fetch("http://localhost:8000/api/v1/intelligence/validate/iban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iban: iban }),
    })
      .then(res => res.json())
      .then(data => {
        setIbanResult(data);
        setLoading(false);
      })
      .catch(err => {
        setIbanResult({ is_valid: false, iban: iban, error: "Network Error: Could not connect to validation server." });
        setLoading(false);
      });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payment Verification</h2>
        <p className="text-muted-foreground">Validate Global Payment Instructions instantly.</p>
      </div>

      <Tabs defaultValue="routing" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="routing" className="rounded-lg text-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            US Routing Number
          </TabsTrigger>
          <TabsTrigger value="iban" className="rounded-lg text-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
            International IBAN
          </TabsTrigger>
        </TabsList>

        <TabsContent value="routing" className="mt-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Building className="w-5 h-5 mr-2 text-slate-700" />
                ABA Routing Validator
              </CardTitle>
              <CardDescription>
                Verify ABA routing transit numbers using standard Modulus 10 checksum algorithms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRoutingSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter 9-digit Routing Number"
                    className="h-12 text-lg font-mono bg-slate-50"
                    value={routing}
                    onChange={(e) => setRouting(e.target.value.replace(/\D/g, ''))}
                    maxLength={9}
                    required
                  />
                </div>
                <Button type="submit" className="h-12 px-8 bg-slate-900 text-md" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                  Verify
                </Button>
              </form>

              {routingResult && (
                <div className={`mt-6 p-6 rounded-xl border ${routingResult.is_valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} animate-in fade-in`}>
                  <div className="flex items-start">
                    {routingResult.is_valid ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mr-4 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600 mr-4 shrink-0" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${routingResult.is_valid ? 'text-emerald-900' : 'text-red-900'}`}>
                        {routingResult.is_valid ? 'Valid Routing Number' : 'Validation Failed'}
                      </h3>
                      <p className={`mt-1 ${routingResult.is_valid ? 'text-emerald-700' : 'text-red-700'}`}>
                        {routingResult.is_valid 
                          ? `The routing number ${routingResult.routing_number} passes checksum validation.` 
                          : routingResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iban" className="mt-6">
          <Card className="border-indigo-100">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Globe className="w-5 h-5 mr-2 text-indigo-700" />
                IBAN Validator
              </CardTitle>
              <CardDescription>
                Verify International Bank Account Numbers using ISO 13616 standard verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIbanSearch} className="flex gap-4">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Enter IBAN (e.g., GB29XXXXX...)"
                    className="h-12 text-lg font-mono bg-slate-50 uppercase"
                    value={iban}
                    onChange={(e) => setIban(e.target.value.replace(/\s/g, '').toUpperCase())}
                    maxLength={34}
                    required
                  />
                </div>
                <Button type="submit" className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-md" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                  Verify
                </Button>
              </form>

              {ibanResult && (
                <div className={`mt-6 p-6 rounded-xl border ${ibanResult.is_valid ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'} animate-in fade-in`}>
                  <div className="flex items-start">
                    {ibanResult.is_valid ? (
                      <CheckCircle2 className="w-8 h-8 text-indigo-600 mr-4 shrink-0" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600 mr-4 shrink-0" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${ibanResult.is_valid ? 'text-indigo-900' : 'text-red-900'}`}>
                        {ibanResult.is_valid ? 'Valid IBAN' : 'Validation Failed'}
                      </h3>
                      <p className={`mt-1 ${ibanResult.is_valid ? 'text-indigo-700' : 'text-red-700'}`}>
                        {ibanResult.is_valid 
                          ? `The IBAN structure for country [${ibanResult.country_code}] passes the ISO 13616 modulus 97 check.` 
                          : ibanResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
