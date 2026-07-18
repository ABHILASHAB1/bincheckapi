import { Metadata } from 'next';
import Link from 'next/link';

async function getBin(number: string) {
  try {
    const res = await fetch(`https://remitwise.fit/api/bins?q=${number}&limit=1`, { next: { revalidate: 3600 } });
    const bins = await res.json();
    return bins[0] || null;
  } catch(e) {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { number: string } }): Promise<Metadata> {
  const bin = await getBin(params.number);
  
  if (!bin) {
    return { title: 'BIN Not Found | RemitWise' };
  }

  const bankName = bin.bank_name || 'Unknown Bank';
  return {
    title: `BIN ${bin.bin} - ${bankName} | RemitWise`,
    description: `Lookup details for BIN ${bin.bin} issued by ${bankName} in ${bin.country || 'Unknown Country'}.`,
    openGraph: {
      title: `BIN ${bin.bin} Database Record`,
      description: `Verify and lookup information for BIN ${bin.bin}.`
    }
  };
}

export default async function BinProfile({ params }: { params: { number: string } }) {
  const bin = await getBin(params.number);

  if (!bin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">BIN Not Found</h1>
        <p className="text-slate-500 mb-8">We couldn't find a record for BIN "{params.number}".</p>
        <Link href="/bins" className="bg-terminal text-white px-6 py-3 rounded-full font-bold">
            Back to Database
        </Link>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            "name": `BIN ${bin.bin}`,
            "provider": {
              "@type": "BankOrCreditUnion",
              "name": bin.bank_name || "Unknown Issuer"
            },
            "areaServed": bin.country
          })
        }}
      />

      <div className="bg-slate-50 min-h-screen py-16">
        <div className="max-w-4xl mx-auto px-6">
            <Link href="/bins" className="inline-flex items-center text-slate-500 hover:text-terminal mb-8 font-medium transition-colors">
                &larr; Back to Global BIN List
            </Link>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-8">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-8">
                    <div className="w-16 h-16 rounded-2xl bg-terminal text-white flex items-center justify-center shadow-lg">
                        <i className="ph-bold ph-credit-card text-3xl"></i>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black font-mono text-slate-900 tracking-wider">{bin.bin}</h1>
                        <p className="text-slate-500 font-medium">Bank Identification Number Profile</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Issuing Bank</p>
                        <p className="text-2xl font-bold text-slate-800">{bin.bank_name || 'N/A'}</p>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Country</p>
                        <p className="text-2xl font-bold text-slate-800">{bin.country || 'N/A'}</p>
                    </div>

                    <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 opacity-60 relative group overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href="/send_money" className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                <i className="ph-bold ph-key"></i> Get API Key
                            </Link>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Card Scheme <i className="ph-fill ph-lock-key"></i></p>
                        <p className="text-2xl font-bold text-slate-400 blur-sm">VISA</p>
                    </div>

                    <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 opacity-60 relative group overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href="/send_money" className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                <i className="ph-bold ph-key"></i> Get API Key
                            </Link>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Card Type <i className="ph-fill ph-lock-key"></i></p>
                        <p className="text-2xl font-bold text-slate-400 blur-sm">CREDIT</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </>
  );
}
