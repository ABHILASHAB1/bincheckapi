import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Globe, Phone, Mail, ShieldAlert, CheckCircle2, ArrowLeft, BrainCircuit, FileText } from "lucide-react";
import Link from "next/link";

export default function MerchantDetailPage({ params }: { params: { id: string } }) {
  // Mock data for UI development
  const merchant = {
    id: params.id,
    name: "Global Payments Inc",
    legal_name: "Global Payments Holdings LLC",
    status: "Active",
    risk_score: 12,
    risk_level: "Low",
    mcc: "5411",
    mcc_description: "Grocery Stores, Supermarkets",
    website: "https://globalpayments.example.com",
    email: "compliance@globalpayments.example.com",
    phone: "+1 (555) 123-4567",
    location: {
      address: "123 Financial District Blvd",
      city: "New York",
      state: "NY",
      country: "USA",
      postal_code: "10004"
    },
    verification: {
      status: "Verified",
      verified_at: "2026-05-12T10:00:00Z",
      method: "Automated KYC"
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/merchants">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{merchant.name}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-muted-foreground">{merchant.legal_name}</span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              {merchant.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>Edit Merchant</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Merchant Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">MCC {merchant.mcc}</p>
                  <p className="text-sm text-muted-foreground">{merchant.mcc_description}</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Headquarters</p>
                  <p className="text-sm text-muted-foreground">
                    {merchant.location.address}<br/>
                    {merchant.location.city}, {merchant.location.state} {merchant.location.postal_code}<br/>
                    {merchant.location.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <a href={merchant.website} className="text-sm text-blue-600 hover:underline">
                  {merchant.website.replace('https://', '')}
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm">{merchant.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm">{merchant.phone}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <div>
                  <p className="font-medium text-emerald-700">{merchant.verification.status}</p>
                  <p className="text-xs text-muted-foreground">via {merchant.verification.method}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">Request Re-verification</Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Tabs defaultValue="intelligence" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-12 bg-transparent p-0 space-x-6">
              <TabsTrigger 
                value="intelligence" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 bg-transparent"
              >
                Intelligence & Risk
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 bg-transparent"
              >
                Processing History
              </TabsTrigger>
              <TabsTrigger 
                value="locations" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none h-12 bg-transparent"
              >
                Branches & Aliases
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="intelligence" className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-slate-700">
                      <ShieldAlert className="w-4 h-4 mr-2" />
                      Risk Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-bold text-emerald-600">{merchant.risk_score}</span>
                      <span className="text-sm text-muted-foreground mb-1">/ 100 ({merchant.risk_level})</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-indigo-50 border-indigo-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center text-indigo-700">
                      <BrainCircuit className="w-4 h-4 mr-2" />
                      AI Confidence Index
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-2">
                      <span className="text-4xl font-bold text-indigo-600">98%</span>
                      <span className="text-sm text-indigo-600/70 mb-1">Match Accuracy</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>AI Enrichment Data</CardTitle>
                  <CardDescription>Data gathered by RemitWise intelligence crawlers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 border-b pb-4">
                      <div className="text-sm font-medium text-muted-foreground">Social Footprint</div>
                      <div className="col-span-2 text-sm flex gap-2">
                        <Badge variant="outline">Twitter: Active</Badge>
                        <Badge variant="outline">LinkedIn: Verified</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 border-b pb-4">
                      <div className="text-sm font-medium text-muted-foreground">Operating Hours</div>
                      <div className="col-span-2 text-sm">Mon-Fri: 09:00 AM - 05:00 PM EST</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-sm font-medium text-muted-foreground">Accepted Payment Methods</div>
                      <div className="col-span-2 text-sm flex gap-2 flex-wrap">
                        <Badge variant="secondary">Visa</Badge>
                        <Badge variant="secondary">Mastercard</Badge>
                        <Badge variant="secondary">Amex</Badge>
                        <Badge variant="secondary">Discover</Badge>
                        <Badge variant="secondary">Apple Pay</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="pt-6">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-muted-foreground h-64">
                  <p>Transaction history will be connected in a future phase.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="pt-6">
              <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-muted-foreground h-64">
                  <p>Branch network and alias mapping will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
