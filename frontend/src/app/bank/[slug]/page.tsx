import { Metadata } from 'next';
import Link from 'next/link';

async function getBank(slug: string) {
  // In a real app we'd query the DB directly to prevent double hopping, 
  // but this is fine for SSR since it caches
  try {
    const res = await fetch(`https://remitwise.fit/api/banks/search?q=${slug}`, { next: { revalidate: 3600 } });
    const banks = await res.json();
    // We try to match exactly, or just take the first result
    return banks[0] || null;
  } catch(e) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const bank = await getBank(params.slug);
  
  if (!bank) {
    return { title: 'Bank Not Found | RemitWise' };
  }

  const bankName = bank.official_name || bank.short_name;
  return {
    title: `${bankName} SWIFT Code & Details | RemitWise`,
    description: `Get the SWIFT code, routing information, and complete profile for ${bankName} in ${bank.country || 'Global'}.`,
    openGraph: {
      title: `${bankName} SWIFT Code & Routing Data`,
      description: `Official details and SWIFT code for ${bankName}.`
    }
  };
}

export default async function BankProfile({ params }: { params: { slug: string } }) {
  const bank = await getBank(params.slug);

  if (!bank) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Bank Not Found</h1>
        <p className="text-slate-500 mb-8">We couldn't find a bank matching "{params.slug}".</p>
        <Link href="/directory" className="bg-terminal text-white px-6 py-3 rounded-full font-bold">
            Back to Directory
        </Link>
      </div>
    );
  }

  const bankName = bank.official_name || bank.short_name;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BankOrCreditUnion",
            "name": bankName,
            "alternateName": bank.short_name,
            "url": bank.website,
            "logo": bank.logo_url,
            "address": {
              "@type": "PostalAddress",
              "addressCountry": bank.country
            },
            "contactPoint": bank.customer_service ? {
              "@type": "ContactPoint",
              "telephone": bank.customer_service,
              "contactType": "customer service"
            } : undefined
          })
        }}
      />

      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-6">
            <Link href="/directory" className="inline-flex items-center text-slate-500 hover:text-terminal mb-8 font-medium transition-colors">
                &larr; Back to Directory
            </Link>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 w-full" style={{ backgroundColor: bank.brand_color || '#2563EB' }}></div>
                
                <div className="px-8 pb-10 relative">
                    <div 
                        className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-xl absolute -top-12 border-4 border-white"
                        style={{ backgroundColor: bank.brand_color || '#2563EB', color: bank.brand_text_color || '#FFFFFF' }}
                    >
                        {bank.logo_url ? <img src={bank.logo_url} alt={bank.short_name} className="w-16 h-16 object-contain" /> : bank.short_name?.substring(0, 1) || 'B'}
                    </div>

                    <div className="mt-16">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">{bankName}</h1>
                        <p className="text-lg text-slate-500 mb-8">{bank.country ? `Located in ${bank.country}` : 'Global Bank'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Details */}
                            {bank.swift_code && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">SWIFT / BIC Code</p>
                                <p className="text-2xl font-mono font-bold text-slate-800">{bank.swift_code}</p>
                            </div>
                            )}

                            {bank.website && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Official Website</p>
                                <a href={bank.website} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-terminal hover:underline">
                                    {bank.website.replace(/^https?:\/\//i, '')}
                                </a>
                            </div>
                            )}

                            {bank.customer_service && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Customer Service</p>
                                <a href={`tel:${bank.customer_service}`} className="text-xl font-medium text-slate-800">
                                    {bank.customer_service}
                                </a>
                            </div>
                            )}

                            {bank.email && (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Email Contact</p>
                                <a href={`mailto:${bank.email}`} className="text-xl font-medium text-slate-800">
                                    {bank.email}
                                </a>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
