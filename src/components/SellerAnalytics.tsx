import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { ShowcaseProduct, AppView } from '../types';
import { mediaStorageService } from '../services/cloudinaryService';
import { AppUser, isAdminUser } from '../services/firebase';

interface SellerAnalyticsProps {
  currentUser?: AppUser | null;
  onNotify: (msg: string) => void;
  go: (view: AppView | string) => void;
}

export const SellerAnalytics: React.FC<SellerAnalyticsProps> = ({
  currentUser,
  onNotify,
  go,
}) => {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadProducts = async () => {
    setLoading(true);
    const data = await mediaStorageService.getShowcaseProducts();
    // If not admin, filter by current user's products
    if (currentUser && !isAdminUser(currentUser)) {
      setProducts(
        data.filter(
          (p) => p.userId === currentUser.uid || p.artisanName?.toLowerCase() === (currentUser.displayName || '').toLowerCase()
        )
      );
    } else {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [currentUser]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await mediaStorageService.deleteShowcaseProduct(id);
      onNotify('Product removed successfully.');
      loadProducts();
    }
  };

  const totalViews = products.reduce((acc, p) => acc + (p.viewsCount || 15), 0);
  const totalProducts = products.length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-6">
      {/* Top Summary Header */}
      <div className="bg-[#17365D] text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-[#287D73] animate-pulse" />
            <span>Seller &amp; Artisan Analytics Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            विक्रेता एवं उत्पाद विश्लेषण (Seller Analytics)
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            {isAdminUser(currentUser)
              ? 'Super Admin View: Cumulative performance across all registered artisan and SHG products.'
              : `Viewing analytics for ${currentUser?.displayName || 'Registered Artisan'}.`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => go('business-upload')}
            className="px-4 py-3 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Icon name="plus" size={16} />
            <span>+ Add New Product</span>
          </button>
          <button
            onClick={() => go('home')}
            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm transition-all"
          >
            View Showcase
          </button>
        </div>
      </div>

      {/* Cumulative Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
            Total Active Products
          </span>
          <div className="text-3xl font-extrabold text-[#17365D]">{totalProducts}</div>
          <div className="text-xs text-[#287D73] font-semibold">Live in Rural Showcase</div>
        </div>

        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
            Cumulative Views Count
          </span>
          <div className="text-3xl font-extrabold text-[#245A91]">{totalViews}</div>
          <div className="text-xs text-[#5F6B76] font-medium">Customer engagement views</div>
        </div>

        <div className="bg-white border border-[#DCE3EA] rounded-2xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5F6B76]">
            Average Views per Product
          </span>
          <div className="text-3xl font-extrabold text-[#287D73]">
            {totalProducts > 0 ? Math.round(totalViews / totalProducts) : 0}
          </div>
          <div className="text-xs text-[#5F6B76] font-medium">High rural market reach</div>
        </div>
      </div>

      {/* Active Products List */}
      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
          <h3 className="font-extrabold text-base text-[#17365D]">
            Active Products &amp; Performance Breakdown ({products.length})
          </h3>
          <button
            onClick={loadProducts}
            className="text-xs font-bold text-[#245A91] hover:underline flex items-center gap-1"
          >
            <Icon name="refresh" size={13} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#5F6B76]">
            No active products found. Click "+ Add New Product" to publish your first item!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-[#F5F7FA] border border-[#DCE3EA] rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="h-44 relative bg-slate-200">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-black/70 text-white backdrop-blur-md">
                    {p.category}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-xs font-black bg-[#17365D] text-white shadow-md">
                    👁️ {p.viewsCount || 15} views
                  </span>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-[#17365D] line-clamp-1">{p.title}</h4>
                    <p className="text-xs text-[#5F6B76] line-clamp-2 mt-0.5">{p.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#DCE3EA] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#17365D]">{p.artisanName}</div>
                      <div className="text-[10px] text-slate-500">{p.location}</div>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
