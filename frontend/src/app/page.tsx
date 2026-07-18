import ActiveUsersWidget from '../components/ActiveUsersWidget';
import AdUnit from '../components/AdUnit';

export default function Home() { return (<>


    
    <div className="ticker-wrap pt-20 pb-0">
        <div id="ticker-main" className="ticker-content animate-marquee text-[13px] font-mono font-bold text-accentBlue tracking-widest py-2.5 uppercase flex gap-16 items-center">
            <span>LIVE INTELLIGENCE FEED</span>
            <span>AED/INR: 22.754</span>
            <span>SAR/INR: 22.281</span>
            <span>BIN: 411111 [VISA/CREDIT/US]</span>
            <span>EUR/USD: 1.084</span>
            <span>SYS_STATUS: OPTIMAL</span>
            <span>LIVE INTELLIGENCE FEED</span>
            <span>AED/INR: 22.754</span>
            <span>SAR/INR: 22.281</span>
            <span>BIN: 411111 [VISA/CREDIT/US]</span>
            <span>EUR/USD: 1.084</span>
            <span>SYS_STATUS: OPTIMAL</span>
        </div>
        <div id="ticker-clone" className="ticker-content animate-marquee text-[13px] font-mono font-bold text-accentBlue tracking-widest py-2.5 uppercase flex gap-16 items-center" aria-hidden="true">
            <span>LIVE INTELLIGENCE FEED</span>
            <span>AED/INR: 22.754</span>
            <span>SAR/INR: 22.281</span>
            <span>BIN: 411111 [VISA/CREDIT/US]</span>
            <span>EUR/USD: 1.084</span>
            <span>SYS_STATUS: OPTIMAL</span>
            <span>LIVE INTELLIGENCE FEED</span>
            <span>AED/INR: 22.754</span>
            <span>SAR/INR: 22.281</span>
            <span>BIN: 411111 [VISA/CREDIT/US]</span>
            <span>EUR/USD: 1.084</span>
            <span>SYS_STATUS: OPTIMAL</span>
        </div>
    </div>

    
    <section className="relative pt-24 pb-32 overflow-hidden border-b border-black/5">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accentBlue/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                
                
                <div className="w-full lg:w-1/2 space-y-8">

                    <h1 className="text-5xl md:text-7xl font-light text-slate-900 leading-[1.1] tracking-tight">
                        Global Financial <br />
                        <span className="editorial text-6xl md:text-8xl italic text-slate-700">Intelligence.</span>
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed font-light">
                        Compare exchange rates, verify card BINs, analyze global currencies, and execute international transfers—from one unified terminal.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <a href="/send_money" className="bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-gray-200 transition-colors font-bold flex items-center justify-center gap-2">
                            Compare Live Rates <i className="ph-bold ph-arrow-up-right"></i>
                        </a>
                        <a href="#products" className="bg-white border border-divider text-slate-900 px-8 py-4 rounded-xl hover:bg-border transition-colors font-medium flex items-center justify-center gap-2">
                            Explore Tools
                        </a>
                    </div>
                    
                    <div className="pt-8 flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-divider"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-divider"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-600 border-2 border-divider"></div>
                        </div>
                        <p>Trusted by <strong className="text-slate-700">10,000+</strong> global businesses & developers.</p>
                    </div>
                </div>

                
                <div className="w-full lg:w-1/2 relative animate-float">
                    <div className="absolute -inset-1 bg-gradient-to-r from-terminal/20 to-blue-500/20 rounded-2xl blur-lg"></div>
                    <div className="relative bg-white border border-divider rounded-2xl p-6 shadow-2xl scanlines overflow-hidden">
                        
                        
                        <div className="flex items-center justify-between border-b border-divider pb-4 mb-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">remitwise_core.exe</div>
                        </div>
                        
                        
                        <div className="font-mono text-xs md:text-sm space-y-3 text-slate-600">
                            <p className="text-accentBlue">~$ connect_gateway --region=global</p>
                            <p>&gt; Initializing routing matrix...</p>
                            <p>&gt; Fetching live FX margins (SAR/INR) ... <span className="text-slate-900">SUCCESS</span></p>
                            <p>&gt; Validating Card BIN [411111] ... <span className="text-slate-900">VALID: VISA CREDIT</span></p>
                            
                            <div className="mt-6 p-4 border border-accentBlue/20 bg-accentBlue/5 rounded text-accentBlue">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-slate-600 text-[10px] uppercase tracking-widest">Optimal Route Found</span>
                                    <span className="text-lg font-bold">22.840</span>
                                </div>
                                <div className="w-full bg-accentBlue/20 h-1 rounded overflow-hidden">
                                    <div className="w-[85%] h-full bg-accentBlue"></div>
                                </div>
                            </div>

                            <p className="animate-pulse">_</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <section className="bg-bgSecondary w-full pt-10">
        <AdUnit type="banner" />
    </section>
    
    <section id="products" className="py-32 bg-bgSecondary relative">
        <div className="max-w-7xl mx-auto px-6">
            
            <div className="mb-16 md:mb-24 max-w-2xl">
                <h2 className="text-sm font-mono text-accentBlue tracking-widest uppercase mb-4">Infrastructure</h2>
                <h3 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight">
                    One platform. <br />
                    <span className="editorial italic text-slate-600">Total global control.</span>
                </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                
                
                <a href="/global_transfer" className="bento-card col-span-1 md:col-span-2 lg:col-span-8 bg-white border border-divider rounded-3xl p-8 md:p-12 flex flex-col justify-between group min-h-[380px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                            <i className="ph-fill ph-paper-plane-right text-2xl"></i>
                        </div>
                        <h4 className="text-2xl md:text-3xl font-medium text-slate-900 mb-3">Send Money Globally</h4>
                        <p className="text-slate-600 max-w-md font-light">Execute international transfers with institutional-grade exchange rates. Compare real-time provider margins before you send.</p>
                    </div>
                    
                    <div className="z-10 relative flex items-center text-sm font-bold text-slate-900 mt-8 group-hover:text-accentBlue transition-colors">
                        Start Transfer <i className="ph-bold ph-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                    </div>
                    
                    
                    <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-gradient-to-tl from-white/5 to-transparent rounded-tl-full pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"></div>
                </a>

                
                <div className="bento-card col-span-1 md:col-span-1 lg:col-span-4 bg-white border border-divider rounded-3xl p-8 flex flex-col justify-between group min-h-[380px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-accentBlue/10 border border-accentBlue/30 rounded-2xl flex items-center justify-center mb-6 text-accentBlue group-hover:bg-accentBlue group-hover:text-white transition-colors">
                            <i className="ph-fill ph-credit-card text-2xl"></i>
                        </div>
                        <h4 className="text-xl md:text-2xl font-medium text-slate-900 mb-3">BIN Intelligence</h4>
                        <p className="text-slate-600 text-sm font-light mb-6">Instantly verify card networks, issuer banks, and country of origin using the first 6 digits.</p>
                    </div>
                    
                    <div className="z-10 relative flex flex-col gap-3 mt-auto">
                        <a href="/bincheck" className="flex items-center text-sm font-bold text-slate-700 hover:text-accentBlue transition-colors group/link1">
                            Lookup a BIN <i className="ph-bold ph-arrow-right ml-2 group-hover/link1:translate-x-1 transition-transform"></i>
                        </a>
                        <a href="/bin_list.html" className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group/link2 border-t border-slate-100 pt-3">
                            Browse Global BIN Directory <i className="ph-bold ph-list ml-2 group-hover/link2:translate-x-1 transition-transform"></i>
                        </a>
                    </div>
                </div>

                
                <a href="/send_money" className="bento-card col-span-1 md:col-span-1 lg:col-span-3 bg-white border border-divider rounded-3xl p-8 flex flex-col justify-between group min-h-[300px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:bg-blue-500 group-hover:text-slate-900 transition-colors">
                            <i className="ph-fill ph-chart-line-up text-2xl"></i>
                        </div>
                        <h4 className="text-xl font-medium text-slate-900 mb-3">Live FX Dashboard</h4>
                        <p className="text-slate-600 text-sm font-light">Monitor mid-market rates and actual remittance sell rates in real-time.</p>
                    </div>
                </a>

                
                <a href="/send_money" className="bento-card col-span-1 md:col-span-1 lg:col-span-3 bg-white border border-divider rounded-3xl p-8 flex flex-col justify-between group min-h-[300px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-900 transition-colors">
                            <i className="ph-fill ph-scales text-2xl"></i>
                        </div>
                        <h4 className="text-xl font-medium text-slate-900 mb-3">Provider Comparison</h4>
                        <p className="text-slate-600 text-sm font-light">See hidden markups and true costs across top remittance platforms before you commit.</p>
                    </div>
                </a>

                
                <a href="/send_money#calculator" className="bento-card col-span-1 md:col-span-1 lg:col-span-3 bg-white border border-divider rounded-3xl p-8 flex flex-col justify-between group min-h-[300px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-900 transition-colors">
                            <i className="ph-fill ph-arrows-left-right text-2xl"></i>
                        </div>
                        <h4 className="text-xl font-medium text-slate-900 mb-3">Currency Converter</h4>
                        <p className="text-slate-600 text-sm font-light">Instantly convert between 150+ global fiat currencies using live institutional data.</p>
                    </div>
                </a>

                
                <a href="/swift-codes/countries" className="bento-card col-span-1 md:col-span-1 lg:col-span-3 bg-white border border-divider rounded-3xl p-8 flex flex-col justify-between group min-h-[300px] h-full shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)] hover:shadow-[0_32px_64px_-16px_rgba(37,99,235,0.12)] hover:-translate-y-1.5 transition-all duration-500 ease-out">
                    <div className="z-10 relative">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <i className="ph-fill ph-globe-hemisphere-west text-2xl"></i>
                        </div>
                        <h4 className="text-xl font-medium text-slate-900 mb-3">Global SWIFT/BIC</h4>
                        <p className="text-slate-600 text-sm font-light">Search and verify official SWIFT/BIC routing codes for thousands of banks worldwide.</p>
                    </div>
                </a>

            </div>
        </div>
    </section>

    
    
    <section id="services" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
            <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
                <h2 className="text-sm font-mono text-accentBlue tracking-widest uppercase mb-4">Our Services</h2>
                <h3 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight">
                    Premium financial <br />
                    <span className="editorial italic text-slate-600">solutions for global citizens.</span>
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-graduation-cap text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Education Fee Remittance</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Pay tuition fees to universities worldwide safely and instantly.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-users text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Family Maintenance</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Support your loved ones back home with recurring, low-fee transfers.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-heartbeat text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Medical Treatment Abroad</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Fast-track urgent funds directly to international hospitals.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-airplane-tilt text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Travel Remittance</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Fund your travels seamlessly with the best multi-currency rates.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-gift text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Gift Transfers</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Send monetary gifts internationally with zero hidden markups.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-buildings text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Property Purchase Abroad</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Securely wire large sums for real estate investments.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-trend-up text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Investment Abroad</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Route capital to foreign markets with institutional pricing.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-currency-circle-dollar text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Foreign Exchange Consultation</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Get expert guidance on hedging and large volume transfers.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-identification-card text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">KYC Assistance</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">Streamlined compliance for complex international payments.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
                <a href="/contact" className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-accentBlue/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-4 text-slate-700 group-hover:text-accentBlue group-hover:border-accentBlue/30 transition-colors">
                        <i className="ph-fill ph-radar text-xl"></i>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-2">Transfer Tracking</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-3">End-to-end tracking of your funds across the SWIFT network.</p>
                    <div className="text-xs font-bold text-accentBlue flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Get Started <i className="ph-bold ph-arrow-right ml-1"></i>
                    </div>
                </a>
    
            </div>
        </div>
    </section>

    
    <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
        <div className="scanlines"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div>
                    <h2 className="text-sm font-mono text-accentBlue tracking-widest uppercase mb-4">Process Timeline</h2>
                    <h3 className="text-4xl md:text-5xl font-light leading-tight mb-8">
                        How your money <br />
                        <span className="editorial italic text-slate-400">moves across borders.</span>
                    </h3>
                    <p className="text-slate-400 font-light max-w-md">We've eliminated the friction of traditional banking. Our routing engine optimizes the SWIFT network to deliver your funds in record time.</p>
                </div>
                
                <div className="space-y-12 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                    
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-900 bg-accentBlue text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <i className="ph-bold ph-magnifying-glass"></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
                            <h4 className="font-bold text-lg mb-1">1. Intelligent Routing</h4>
                            <p className="text-sm text-slate-400">We analyze real-time market data to find the lowest-fee transfer path for your specific currency pair.</p>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <i className="ph-bold ph-shield-check"></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
                            <h4 className="font-bold text-lg mb-1">2. Secure Funding</h4>
                            <p className="text-sm text-slate-400">Fund your transfer locally. Your money is secured in safeguarded accounts with tier-1 banking partners.</p>
                        </div>
                    </div>

                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <i className="ph-bold ph-paper-plane-tilt"></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur">
                            <h4 className="font-bold text-lg mb-1">3. Instant Payout</h4>
                            <p className="text-sm text-slate-400">The destination account is credited instantly or within minutes, bypassing archaic correspondent banks.</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </section>

    
    <section className="py-24 bg-bgSecondary border-y border-divider">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-divider/50">
                <div className="px-4">
                    <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">$1B+</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Processed Annually</div>
                </div>
                <div className="px-4">
                    <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">150+</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Countries Supported</div>
                </div>
                <div className="px-4">
                    <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">99.9%</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Uptime</div>
                </div>
                <div className="px-4">
                    <div className="text-4xl md:text-5xl font-light text-slate-900 mb-2">ISO</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">27001 Certified</div>
                </div>
            </div>
        </div>
    </section>

    
    <section className="py-32 bg-white relative">
        <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light text-slate-900 mb-4">Frequently Asked Questions</h2>
                <p className="text-slate-500">Everything you need to know about the product and billing.</p>
            </div>
            
            <div className="space-y-4">
                <details className="group border border-slate-200 rounded-2xl bg-slate-50 p-6 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-slate-900">
                        <h2 className="text-lg">How long do international transfers take?</h2>
                        <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-900 sm:p-3 shadow-sm group-open:-rotate-180 transition duration-300">
                            <i className="ph-bold ph-caret-down"></i>
                        </span>
                    </summary>
                    <p className="mt-4 leading-relaxed text-slate-600 font-light">
                        Over 60% of our transfers arrive instantly. For some currency pairs or specific banks, it may take 1-2 business days depending on local clearing systems.
                    </p>
                </details>

                <details className="group border border-slate-200 rounded-2xl bg-slate-50 p-6 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-slate-900">
                        <h2 className="text-lg">Is my money safe?</h2>
                        <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-900 sm:p-3 shadow-sm group-open:-rotate-180 transition duration-300">
                            <i className="ph-bold ph-caret-down"></i>
                        </span>
                    </summary>
                    <p className="mt-4 leading-relaxed text-slate-600 font-light">
                        Absolutely. We are fully regulated and use tier-1 banking partners to safeguard your funds. We employ bank-level 256-bit encryption for all data transit.
                    </p>
                </details>

                <details className="group border border-slate-200 rounded-2xl bg-slate-50 p-6 [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-medium text-slate-900">
                        <h2 className="text-lg">Are there any hidden markup fees?</h2>
                        <span className="shrink-0 rounded-full bg-white p-1.5 text-slate-900 sm:p-3 shadow-sm group-open:-rotate-180 transition duration-300">
                            <i className="ph-bold ph-caret-down"></i>
                        </span>
                    </summary>
                    <p className="mt-4 leading-relaxed text-slate-600 font-light">
                        Never. Unlike traditional banks, we use the real mid-market exchange rate and charge a small, transparent, upfront fee so you know exactly what you are paying.
                    </p>
                </details>
            </div>
        </div>
    </section>

    

    <section className="py-32 border-t border-black/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-terminal/5 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="editorial italic text-5xl md:text-7xl text-slate-900 mb-8">Ready to route?</h2>
            <p className="text-slate-600 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto">
                Stop guessing on exchange rates and card routing. Get institutional transparency on your very next transaction.
            </p>
            <a href="/send_money" className="inline-flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-full font-bold hover:scale-105 transition-transform">
                Open The Platform <i className="ph-bold ph-arrow-right"></i>
            </a>
        </div>
        <AdUnit type="banner" className="mt-16" />
    </section>

    
    
</>); }