import React, { useState } from 'react';
import { Icon } from './Icons';
import { uploadToCloudinary, mediaStorageService } from '../services/cloudinaryService';
import { AppView } from '../types';
import { AppUser } from '../services/firebase';

interface LocalBusinessUploadProps {
  onNotify: (msg: string) => void;
  go: (view: AppView | string) => void;
  currentUser?: AppUser | null;
  onOpenGoogleLogin?: () => void;
  userName?: string;
  userPhone?: string;
  userLocation?: string;
  onClose?: () => void;
}

export const LocalBusinessUpload: React.FC<LocalBusinessUploadProps> = ({
  onNotify,
  go,
  currentUser,
  onOpenGoogleLogin,
  userName = '',
  userPhone = '',
  userLocation = '',
  onClose,
}) => {
  const isLogged = Boolean(currentUser && !currentUser.isAnonymous);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('हस्तशिल्प व कपड़े');
  const [artisanName, setArtisanName] = useState(currentUser?.displayName || userName || '');
  const [location, setLocation] = useState(userLocation || 'महाराजगंज, उत्तर प्रदेश');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || userPhone || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogged) {
      onNotify('उत्पाद प्रकाशित करने के लिए कृपया पहले लॉगिन करें।');
      return;
    }
    if (!title.trim() || !artisanName.trim()) {
      onNotify('कृपया उत्पाद का नाम और कारीगर/विक्रेता का नाम दर्ज करें।');
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

      onNotify('आपका उत्पाद ' + title.trim() + ' सफलतापूर्वक ग्रामीण उत्पाद प्रदर्शनी में प्रकाशित कर दिया गया है!');
      if (onClose) {
        onClose();
      } else {
        go('home');
      }
    } catch (err: any) {
      onNotify('उत्पाद अपलोड विफल: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-fade-in">
      <div className="bg-white rounded-3xl border border-[#DCE3EA] shadow-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#DCE3EA]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#287D73]/10 text-[#287D73] mb-1">
              <Icon name="check" size={13} />
              <span>Seller Portal · स्थानीय विक्रेता पोर्टल</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17365D]">
              + अपना उत्पाद जोड़ें (Local Business Upload)
            </h2>
            <p className="text-xs text-[#5F6B76] mt-0.5">
              ग्रामीण हुनरमंद, स्वयं सहायता समूह एवं महिला उद्यमी अपने उत्पादों की तस्वीरें यहाँ अपलोड करें।
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* If NOT logged in: Show Login Gate ONLY and hide the upload form */}
        {!isLogged ? (
          <div className="bg-[#F5F7FA] border border-[#DCE3EA] rounded-2xl p-6 sm:p-8 text-center space-y-5 my-6">
            <div className="w-16 h-16 rounded-2xl bg-[#17365D] text-white mx-auto flex items-center justify-center font-bold shadow-md">
              <Icon name="lock" size={32} />
            </div>

            <div className="space-y-1.5">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900">
                Authentication Required · लॉगिन आवश्यक
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#17365D]">
                उत्पाद अपलोड करने के लिए पहले गूगल से लॉगिन करें
              </h3>
              <p className="text-xs text-[#5F6B76] max-w-sm mx-auto">
                सुरक्षित रूप से अपना हस्तशिल्प और स्वरोजगार उत्पाद बाज़ार में प्रदर्शित करने के लिए प्रमाणित गूगल खाते से साइन इन करें।
              </p>
            </div>

            <div className="pt-2">
              {onOpenGoogleLogin && (
                <button
                  type="button"
                  onClick={onOpenGoogleLogin}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#17365D] hover:bg-[#245A91] text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2.5 mx-auto transition-all active:scale-95"
                >
                  <Icon name="user" size={18} />
                  <span>🔐 Google से लॉगिन करें (Google Sign-In)</span>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => (onClose ? onClose() : go('home'))}
                className="text-xs font-bold text-[#5F6B76] hover:text-[#17365D] underline"
              >
                ← मुख्य पृष्ठ पर लौटें (Return Home)
              </button>
            </div>
          </div>
        ) : (
          /* If LOGGED IN: Show the Upload Form */
          <div className="space-y-6">
            {/* Logged in success banner */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <div className="font-bold text-emerald-900">
                    Logged in as: {currentUser?.displayName || currentUser?.email || 'Seller'}
                  </div>
                  <div className="text-[10px] text-emerald-700">आप प्रमाणित विक्रेता के रूप में लॉग इन हैं।</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                Active Session
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Image Upload Box with Cloudinary preview */}
              <div>
                <label className="block font-bold text-[#17365D] mb-1.5">
                  उत्पाद की तस्वीर (Product Image) *
                </label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-dashed border-[#DCE3EA]">
                  {previewUrl ? (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#DCE3EA] flex-shrink-0 shadow-xs">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                      <Icon name="camera" size={28} />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#17365D] file:text-white hover:file:bg-[#245A91] cursor-pointer"
                    />
                    <p className="text-[11px] text-[#5F6B76] mt-1.5">
                      Cloudinary (kvyah2au) पर सुरक्षित रूप से संपीड़ित व संग्रहीत।
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">उत्पाद का नाम / शीर्षक *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="उदा. हस्तनिर्मित कढ़ाई कुर्ती, जैविक अचार, टेराकोटा दीये"
                  required
                  className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">कीमत (Price)</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="उदा. ₹ 450"
                    className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">श्रेणी (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold bg-white"
                  >
                    <option value="हस्तशिल्प व कपड़े">हस्तशिल्प व कपड़े (Handicrafts &amp; Apparel)</option>
                    <option value="खाद्य प्रसंस्करण">खाद्य प्रसंस्करण (Food &amp; Pickles)</option>
                    <option value="मिट्टी शिल्प">मिट्टी शिल्प व टेराकोटा (Pottery)</option>
                    <option value="घरेलू व अन्य">घरेलू व अन्य उत्पाद (Home &amp; Others)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">कारीगर / SHG का नाम *</label>
                  <input
                    type="text"
                    value={artisanName}
                    onChange={(e) => setArtisanName(e.target.value)}
                    placeholder="उदा. सुनीता देवी (उजाला SHG)"
                    required
                    className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17365D] mb-1">मोबाइल नंबर (संपर्क हेतु)</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="98391XXXXX"
                    className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">स्थान (गाँव / ज़िला, राज्य)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="उदा. महाराजगंज, उत्तर प्रदेश"
                  className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17365D] mb-1">उत्पाद विवरण (Description)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="सामग्री, निर्माण विधि और विशेषता के बारे में लिखें..."
                  className="w-full p-3 rounded-xl border border-[#DCE3EA] text-[#17365D] font-medium resize-none"
                />
              </div>

              {uploading && (
                <div className="space-y-1.5 p-3 bg-[#287D73]/10 rounded-xl border border-[#287D73]/30">
                  <div className="flex justify-between text-xs font-bold text-[#287D73]">
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

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => (onClose ? onClose() : go('home'))}
                  className="flex-1 py-3.5 rounded-xl border border-[#DCE3EA] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3.5 rounded-xl bg-[#287D73] hover:bg-[#1E6058] text-white font-extrabold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {uploading ? 'प्रकाशित हो रहा है...' : '🚀 उत्पाद प्रकाशित करें'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
