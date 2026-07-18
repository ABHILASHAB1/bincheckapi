import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemitWise | Live Exchange Rates, BIN Checker, and SWIFT Codes",
  description: "RemitWise provides institutional-grade exchange rates, an advanced BIN Checker API, and a global SWIFT code directory for cross-border financial operations.",
  keywords: "Remittance Rates, Live Exchange Rates, BIN Checker, SWIFT Codes, Send Money, RemitWise",
  authors: [{ name: "RemitWise" }],
  openGraph: {
    type: "website",
    url: "https://remitwise.fit/",
    title: "RemitWise | Live Exchange Rates & Financial Intelligence",
    description: "Access institutional-grade exchange rates, validate credit cards via BIN checker, and look up SWIFT codes globally.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RemitWise | Live Exchange Rates & Financial Intelligence",
    description: "Access institutional-grade exchange rates, validate credit cards via BIN checker, and look up SWIFT codes globally.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap" rel="stylesheet" />
        {/* Phosphor Icons */}
        <script src="https://unpkg.com/@phosphor-icons/web" defer></script>
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#F8FAFC] text-[#0F172A] overflow-x-hidden">
        {/* Glass Nav */}
        <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-black/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-12">
                        <a href="/" className="flex items-center gap-2">
                            <i className="ph-fill ph-planet text-3xl text-terminal"></i>
                            <span className="font-sans font-bold text-xl tracking-tight text-offwhite">RemitWise</span>
                        </a>
                        <div className="hidden md:flex gap-8">
                            <a href="/directory" className="text-sm font-medium text-slate-500 hover:text-terminal transition-colors">Bank Directory</a>
                            <a href="/bincheck" className="text-sm font-medium text-slate-500 hover:text-terminal transition-colors">BIN Checker</a>
                            <a href="/bins" className="text-sm font-medium text-terminal">Public BIN List</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="#" className="hidden md:block text-sm font-medium text-slate-500 hover:text-terminal transition-colors">Documentation</a>
                        <a href="/send_money" className="px-5 py-2.5 bg-terminal text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
                            Get API Key
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <main className="flex-1 pt-20">
          {children}
        </main>

        <footer className="bg-offwhite text-slate-400 py-12 mt-20 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <p className="font-sans text-sm font-medium">© 2026 RemitWise Financial Intelligence. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-6">
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">API Status</a>
                </div>
            </div>
        </footer>
      </body>
    </html>
  );
}
