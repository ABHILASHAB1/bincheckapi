import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, CreditCard, Building2, Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your global payment intelligence platform.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,345</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium inline-flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +12.5%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">API Calls (30d)</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium inline-flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +24.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active BINs</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,678</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium inline-flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,543</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium inline-flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> +8.4%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional dashboard content can be placed here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>API Traffic Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg m-4">
              Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Merchant Signups</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {/* Placeholders for list items */}
               {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center mr-3">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">Global Payments Inc {i}</p>
                      <p className="text-sm text-muted-foreground">globalpay{i}@example.com</p>
                    </div>
                    <div className="font-medium text-sm text-emerald-500">Verified</div>
                  </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
