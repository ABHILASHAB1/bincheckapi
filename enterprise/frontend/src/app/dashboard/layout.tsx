import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const DashboardLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return ( 
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 h-full flex flex-col bg-slate-50/50 min-h-screen">
        <Header />
        <div className="flex-1 p-6 h-full overflow-auto">
          {children}
        </div>
      </main>
    </div>
   );
}
 
export default DashboardLayout;
