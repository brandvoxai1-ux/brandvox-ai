// client/src/pages/Credits.jsx
import React, { useState, useEffect } from 'react';
import { useCredits } from '../hooks/useCredits';
import { useAuth } from '../hooks/useAuth';
import Topbar from '../components/layout/Topbar';
import { formatCredits, formatDate } from '../lib/utils';
import { Coins, Check, History, Calendar, PlaySquare, RefreshCw, QrCode, Clipboard, Upload, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';

const UPI_ID = import.meta.env.VITE_UPI_ID || 'brandvox@upi';
const PAYEE_NAME = import.meta.env.VITE_PAYEE_NAME || 'BrandVox AI SaaS Solutions';

export default function Credits() {
  const { profile } = useAuth();
  const { transactions, upiSubmissions, loading, fetchTransactions, fetchUpiSubmissions, submitUpiPayment } = useCredits();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Checkout Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [generatedRef, setGeneratedRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTransactionsData = async (page = 1) => {
    try {
      const res = await fetchTransactions(page, 15);
      if (res && res.pagination) {
        setTotalPages(res.pagination.pages || 1);
        setCurrentPage(page);
      }
      await fetchUpiSubmissions();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadTransactionsData(1);
    }
  }, [profile?.id]);

  // Approved Packages
  const packages = [
    { id: 'starter', name: 'Starter Pack', price: 99, credits: 99.00, bonus: null, desc: 'Ideal for trying model motions.', features: ['99.00 🪙 Balance', 'Standard WAN 2.2 Access', 'Supports text and image input'] },
    { id: 'creator', name: 'Creator Pack', price: 249, credits: 274.00, bonus: '10% Bonus', desc: 'Unlock extra rendering experiments.', features: ['274.00 🪙 Balance', 'All standard models access', 'Synchronized Native Audio', '24/7 Server status alerts'] },
    { id: 'pro', name: 'Pro Pack', price: 499, credits: 574.00, bonus: '15% Bonus', desc: 'Pristine assets compiling choice.', features: ['574.00 🪙 Balance', 'Watermark-free outputs', 'Priority queue status'] },
    { id: 'studio', name: 'Studio Pack', price: 999, credits: 1199.00, bonus: '20% Bonus', desc: 'Supreme capacity for studio works.', features: ['1,199.00 🪙 Balance', 'Pristine Watermark-Free video player', 'Instant multi-aspect renders', 'Dedicated billing controls'] }
  ];

  const handleOpenCheckout = (pack) => {
    setSelectedPack(pack);
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    setGeneratedRef(`BV${pack.price}${rand}`);
    setIsModalOpen(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied to clipboard!');
  };

  const handleSubmitVerification = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    try {
      await submitUpiPayment({
        utr_id: generatedRef,
        email: profile?.email || 'user@example.com',
        package_id: selectedPack.id,
        screenshot_url: null
      });

      // Attempt to launch UPI deep link if mobile environment
      const upiDeepLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPack.price}&tn=${encodeURIComponent(generatedRef)}&cu=INR`;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        window.open(upiDeepLink, '_blank');
      }

      toast.success('Payment registered! Our admin will review and grant credits.');
      setIsModalOpen(false);
      await loadTransactionsData(1);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getTxTypeBadge = (type) => {
    const types = {
      purchase: { label: 'Purchase', variant: 'success' },
      usage: { label: 'Usage', variant: 'primary' },
      refund: { label: 'Refund', variant: 'warning' },
      admin_grant: { label: 'Admin Gift', variant: 'featured' }
    };
    const t = types[type] || { label: type, variant: 'secondary' };
    return <Badge variant={t.variant}>{t.label}</Badge>;
  };

  const getSubStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'Pending Verification', variant: 'warning' },
      approved: { label: 'Approved', variant: 'success' },
      rejected: { label: 'Rejected', variant: 'error' }
    };
    const s = statuses[status] || { label: status, variant: 'secondary' };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  return (
    <div className="flex flex-col flex-grow h-full bg-darkBg text-white overflow-hidden">
      <Topbar title="Credits & Billing" />

      <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 select-none">
        
        {/* Warning banner */}
        <div className="bg-amber-500/10 border border-amber-500/25 px-4 py-3.5 rounded-xl flex items-start space-x-3 text-amber-200">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Manual Verification Workflow Active</h4>
            <p className="text-[10.5px] mt-0.5 font-semibold text-amber-200/80 leading-relaxed">
              Payments are manually verified. Balance activation may take some time (usually 15-30 minutes). Please ensure you enter the correct 12-digit UTR ID.
            </p>
          </div>
        </div>

        {/* TOP ROW: Balance Indicator Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface border border-white/5 p-4 sm:p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-premium relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Circulating Balance</span>
              <h3 className="text-2xl sm:text-3xl font-black text-warning tracking-wide">
                {formatCredits(profile?.credits || 0)}
              </h3>
            </div>
            <div className="text-[10.5px] text-white/40 font-bold uppercase tracking-wider flex items-center">
              <Coins className="w-4 h-4 text-warning mr-1.5" />
              <span>Manual verification active</span>
            </div>
          </div>

          <div className="bg-surface border border-white/5 p-4 sm:p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-premium">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Total Videos Compiled</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                {profile?.total_videos || 0}
              </h3>
            </div>
            <div className="text-[10.5px] text-white/40 font-bold uppercase tracking-wider flex items-center">
              <PlaySquare className="w-4 h-4 text-primary-hover mr-1.5" />
              <span>Studio usage records</span>
            </div>
          </div>

          <div className="bg-surface border border-white/5 p-4 sm:p-6 rounded-xl space-y-4 flex flex-col justify-between shadow-premium">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Total Capital Spent</span>
              <h3 className="text-2xl sm:text-3xl font-black text-primary-hover tracking-wide">
                {formatCredits(profile?.total_spent || 0)}
              </h3>
            </div>
            <div className="text-[10.5px] text-white/40 font-bold uppercase tracking-wider flex items-center">
              <Calendar className="w-4 h-4 text-success mr-1.5" />
              <span>Member since {formatDate(profile?.created_at).slice(0, 11)}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE: Purchase Credit Packs Grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Buy Credits Package (UPI Only)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {packages.map((pack) => (
              <div
                key={pack.id}
                className="bg-surface border border-white/5 rounded-xl p-5 hover-scale flex flex-col justify-between relative overflow-hidden shadow-premium"
              >
                {pack.bonus && (
                  <div className="absolute top-3.5 right-[-35px] bg-primary text-white text-[8px] font-black uppercase py-1 px-10 rotate-45 tracking-widest shadow-premium">
                    {pack.bonus}
                  </div>
                )}
                
                <div>
                  <h4 className="text-[10.5px] font-black text-white/40 uppercase tracking-widest mb-3.5">{pack.name}</h4>
                  <div className="flex items-baseline space-x-1 mb-2">
                    <span className="text-xl font-black text-white">₹{pack.price}</span>
                  </div>
                  <p className="text-[9.5px] text-primary-hover font-extrabold uppercase tracking-widest mb-5">
                    Receive {formatCredits(pack.credits)}
                  </p>
                  
                  <ul className="space-y-3 mb-6 text-[10.5px] font-semibold text-white/50">
                    {pack.features.map((feat, i) => (
                      <li key={i} className="flex items-center">
                        <Check className="w-3.5 h-3.5 text-success mr-2 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  variant={pack.id === 'creator' ? 'primary' : 'secondary'}
                  className="w-full text-xs font-bold py-2 shadow-premium cursor-pointer"
                  onClick={() => handleOpenCheckout(pack)}
                >
                  Buy Now
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM: Pending Manual Submissions History */}
        {upiSubmissions.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center space-x-2 text-sm font-extrabold text-white uppercase tracking-widest">
              <Clock className="w-4 h-4 text-warning" />
              <span>Manual Verification Requests Queue</span>
            </div>
            
            <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-premium">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-white/40 uppercase font-black tracking-wider text-[10px] bg-surface-elevated/30">
                      <th className="p-4">Submitted At</th>
                      <th className="p-4">UTR Transaction ID</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Package</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Admin Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="font-semibold text-white/80 divide-y divide-white/5">
                    {upiSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white/40">{formatDate(sub.created_at)}</td>
                        <td className="p-4 font-mono font-bold text-white">{sub.utr_id}</td>
                        <td className="p-4 text-warning">₹{sub.amount}</td>
                        <td className="p-4 uppercase text-[10px] text-primary-hover">{sub.package_id}</td>
                        <td className="p-4">{getSubStatusBadge(sub.status)}</td>
                        <td className="p-4 text-white/50 max-w-xs truncate" title={sub.admin_notes || '-'}>
                          {sub.admin_notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM: System Transactions history */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center space-x-2 text-sm font-extrabold text-white uppercase tracking-widest">
            <History className="w-4 h-4 text-white/40" />
            <span>Transaction Logs Ledger</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-6 h-6 animate-spin text-white/30" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 bg-surface border border-white/5 rounded-xl text-xs text-white/30 tracking-wider">
              No billing logs recorded in ledger.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-surface border border-white/5 rounded-xl overflow-hidden shadow-premium">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-white/40 uppercase font-black tracking-wider text-[10px] bg-surface-elevated/30">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Credit Delta</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Reference ID</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-white/80 divide-y divide-white/5">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white/40">{formatDate(tx.created_at)}</td>
                          <td className="p-4">{getTxTypeBadge(tx.type)}</td>
                          <td className={`p-4 font-black ${tx.amount > 0 ? 'text-success' : 'text-error'}`}>
                            {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                          </td>
                          <td className="p-4 text-white/60 max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="p-4 font-mono text-[9px] text-white/30 truncate" title={tx.gateway_payment_id || tx.gateway_order_id}>
                            {tx.gateway_payment_id || tx.gateway_order_id || 'manual_grant'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 select-none">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => loadTransactionsData(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-white/40">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => loadTransactionsData(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simplified premium UPI checkout Modal matching the user's wireframe */}
      {isModalOpen && selectedPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fadeIn">
          <div className="bg-[#0F0A1E] border border-purple-500/10 rounded-3xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl relative p-4 sm:p-6 space-y-4 sm:space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4">
              <div className="flex-grow text-center pr-6">
                <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-widest">Pay Using UPI</h3>
                <span className="text-[9px] font-extrabold uppercase text-purple-300/80 tracking-widest block mt-0.5">
                  {selectedPack.name} — ₹{selectedPack.price} ({formatCredits(selectedPack.credits)})
                </span>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                Close
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleSubmitVerification} className="space-y-4 sm:space-y-6">
              
              {/* Centered Large QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-3 sm:p-4 rounded-3xl shadow-premium flex items-center justify-center relative overflow-hidden group select-none border-4 border-purple-500/20">
                  <QRCode
                    value={`upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${selectedPack?.price || ''}&tn=${encodeURIComponent(generatedRef)}&cu=INR`}
                    size={136}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Centered Client's UPI ID and Copy Button */}
              <div className="flex flex-col items-center space-y-2 sm:space-y-2.5 w-full">
                <div className="flex items-center justify-between w-full max-w-sm space-x-2 bg-white/5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest shrink-0">Client's UPI ID:</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-warning tracking-wide select-all truncate">{UPI_ID}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="p-1.5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy UPI ID"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mandated note for matching ledgers */}
                <div className="flex items-center justify-between w-full max-w-sm space-x-2 bg-purple-950/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-purple-500/10">
                  <span className="text-[10px] font-bold text-purple-300/60 uppercase tracking-widest shrink-0">Payment Note:</span>
                  <span className="font-mono text-xs sm:text-sm font-black text-purple-300 tracking-wider select-all truncate">{generatedRef}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRef);
                      toast.success('Payment note copied!');
                    }}
                    className="p-1.5 hover:bg-white/10 text-purple-300/60 hover:text-purple-300 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Copy Note"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description instruction text matching wireframe exactly */}
              <p className="text-[10px] leading-relaxed text-white/40 text-center font-bold max-w-sm mx-auto tracking-normal px-2">
                You can pay using the QR or Copy the UPI ID and paste it on your UPI app and make payment.
                <span className="text-warning block mt-1.5 font-extrabold uppercase text-[8.5px] tracking-wider">
                  ⚠️ IMPORTANT: Add the Payment Note "{generatedRef}" in your UPI app message before paying.
                </span>
              </p>

              {/* Large premium Centered "Pay" button */}
              <div className="flex justify-center pt-1 sm:pt-2">
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="w-full sm:w-2/3 font-black text-xs uppercase py-3 shadow-premium tracking-widest rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary-hover border border-primary/20 cursor-pointer"
                >
                  Pay
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
