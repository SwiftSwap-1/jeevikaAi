import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { ShowcaseProduct } from '../types';
import { mediaStorageService, uploadToCloudinary } from '../services/cloudinaryService';

interface LocalBusinessShowcaseProps {
  onNotify: (msg: string) => void;
  userPhone?: string;
  userName?: string;
  userLocation?: string;
}

export const LocalBusinessShowcase: React.FC<LocalBusinessShowcaseProps> = ({
  onNotify,
  userPhone,
  userName,
  userLocation,
}) => {
  const [products, setProducts] = useState<ShowcaseProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for adding an artisan product
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('हस्तशिल्प व कपड़े');
  const [artisanName, setArtisanName] = useState(userName || '');
  const [location, setLocation] = useState(userLocation || '');
  const [contactPhone, setContactPhone] = useState(userPhone || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const loadProducts = async () => {
    setLoading(true);
    const data = await mediaStorageService.getShowcaseProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artisanName.trim()) {
      onNotify('कृपया उत्पाद का नाम और कारीगर का नाम दर्ज करें।');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    try {
      let finalImageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
      if (imageFile) {
        finalImageUrl = await uploadToCloudinary(imageFile, 'showcase', (pct) => {
          setUploadProgress(Math.max(20, pct));
        });
      }

      await mediaStorageService.addShowcaseProduct({
        title: title.trim(),
        description: description.trim(),
        imageUrl: finalImageUrl,
        price: price.trim() || 'कीमत संपर्क पर',
        category,
        artisanName: artisanName.trim(),
        location: location.trim() || 'भारत',
        contactPhone: contactPhone.trim(),
        createdAt: new Date().toISOString(),
      });

      onNotify('आपका उत्पाद बाज़ार में सफलतापूर्वक जुड़ गया!');
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setImageFile(null);
      setPreviewUrl('');
      loadProducts();
    } catch (err: any) {
      onNotify('अपलोड विफल: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <section className="py-12 bg-slate-50/70 border-b border-[#DCE3EA]" id="local-showcase">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#287D73]/10 text-[#287D73] mb-2">
              <Icon name="check" size={13} />
              <span>ग्रामीण उत्पाद प्रदर्शनी · Local Business Showcase</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17365D] tracking-tight">
              स्थानीय स्वरोजगार व हस्तशिल्प बाज़ार
            </h2>
            <p className="text-sm text-[#5F6B76] max-w-xl mt-1">
              ग्रामीण हुनरमंद, स्वयं सहायता समूह एवं महिला उद्यमी अपने उत्पादों की तस्वीरें यहाँ सीधे अपलोड कर सकते हैं।
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold text-sm shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <span>+ अपना उत्पाद जोड़ें</span>
          </button>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#DCE3EA] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                {/* Product Image */}
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md">
                    {p.category}
                  </span>
                  {p.price && (
                    <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl text-xs font-black bg-[#17365D] text-white shadow-md">
                      {p.price}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#17365D] leading-snug line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-[#5F6B76] mt-1.5 line-clamp-2 leading-relaxed">
                      {p.description || 'हस्तनिर्मित ग्रामीण उत्पाद।'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5F6B76]">
                    <div>
                      <div className="font-bold text-[#17365D]">{p.artisanName}</div>
                      <div className="text-[11px] flex items-center gap-1 text-slate-500">
                        <Icon name="pin" size={11} />
                        <span>{p.location}</span>
                      </div>
                    </div>
                    {p.contactPhone && (
                      <a
                        href={`tel:${p.contactPhone.replace(/\s+/g, '')}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#287D73] hover:text-white font-bold text-xs text-[#17365D] transition-colors flex items-center gap-1"
                        title="संपर्क करें"
                      >
                        <span>संपर्क</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Product Modal (Cloudinary Upload) */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE3EA] space-y-4 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA]">
                <div>
                  <h3 className="text-lg font-black text-[#17365D]">
                    उत्पाद जोड़ें (Add Product to Showcase)
                  </h3>
                  <p className="text-xs text-[#5F6B76]">
                    Cloudinary सुरक्षित इमेज अपलोड द्वारा अपनी कारीगरी दिखाएं
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
                {/* Photo Upload with Cloudinary Preview */}
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">
                    उत्पाद की तस्वीर (Product Image):
                  </label>
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#DCE3EA] flex-shrink-0">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <Icon name="camera" size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#17365D] file:text-white hover:file:bg-[#245A91] cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">PNG, JPG या WEBP (Cloudinary पर सुरक्षित)</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#17365D] mb-1">
                    उत्पाद का नाम / शीर्षक:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="उदा. हस्तनिर्मित कढ़ाई कुर्ती, मिट्टी के कुल्हड़"
                    required
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17365D] mb-1">कीमत (वैकल्पिक):</label>
                    <input
                      type="text"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="उदा. ₹ 450"
                      className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17365D] mb-1">श्रेणी:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold bg-white"
                    >
                      <option value="हस्तशिल्प व कपड़े">हस्तशिल्प व कपड़े</option>
                      <option value="खाद्य प्रसंस्करण">खाद्य प्रसंस्करण (अचार, पापड़)</option>
                      <option value="मिट्टी शिल्प">मिट्टी शिल्प व टेराकोटा</option>
                      <option value="घरेलू व अन्य">घरेलू व अन्य उत्पाद</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#17365D] mb-1">कारीगर / SHG का नाम:</label>
                    <input
                      type="text"
                      value={artisanName}
                      onChange={(e) => setArtisanName(e.target.value)}
                      placeholder="सुनीता देवी"
                      required
                      className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17365D] mb-1">फ़ोन नंबर (ग्राहकों हेतु):</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="98391XXXXX"
                      className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#17365D] mb-1">स्थान (गाँव / ज़िला):</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="महाराजगंज, उत्तर प्रदेश"
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17365D] mb-1">उत्पाद विवरण:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="हाथ से बना शुद्ध सूती सामान..."
                    className="w-full p-2.5 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium resize-none"
                  />
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-[#287D73]">
                      <span>Cloudinary पर अपलोड हो रहा है...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#287D73] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl border border-[#DCE3EA] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold shadow-md disabled:opacity-50"
                  >
                    {uploading ? 'सहेज रहे हैं...' : 'प्रकाशित करें (Publish)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
