import React, { useState } from 'react';
import { Icon } from './Icons';
import { NotificationPreferences } from '../types';

interface NotificationSettingsViewProps {
  onNotify: (msg: string) => void;
  go: (route: string) => void;
}

export const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({
  onNotify,
  go,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => {
    try {
      const saved = localStorage.getItem('jeevika_notif_prefs');
      return saved
        ? JSON.parse(saved)
        : {
            smsAlerts: true,
            whatsappAlerts: false,
            pushNotifications: true,
            newOpportunitiesAlert: true,
            roadmapReminders: true,
          };
    } catch (e) {
      return {
        smsAlerts: true,
        whatsappAlerts: false,
        pushNotifications: true,
        newOpportunitiesAlert: true,
        roadmapReminders: true,
      };
    }
  });

  const toggle = (key: keyof NotificationPreferences) => {
    setPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('jeevika_notif_prefs', JSON.stringify(updated));
      return updated;
    });
    onNotify('Notification preferences updated.');
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="pb-6 border-b border-[#DCE3EA] mb-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#17365D]/10 text-[#17365D] mb-2">
          <Icon name="phone" size={14} />
          <span>Alert Channels &amp; Reminders</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17365D]">
          Notification Preferences · सूचना सेटिंग्स
        </h1>
        <p className="text-sm text-[#5F6B76] mt-1">
          Choose how you receive alerts about new vocational training batches and local openings.
        </p>
      </div>

      <div className="bg-white border border-[#DCE3EA] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <div>
              <div className="text-sm font-bold text-[#17365D]">SMS Alerts (एसएमएस सूचना)</div>
              <p className="text-xs text-[#5F6B76]">Receive text messages on your registered phone for new local vacancies.</p>
            </div>
            <button
              onClick={() => toggle('smsAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                prefs.smsAlerts ? 'bg-[#287D73]' : 'bg-[#DCE3EA]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.smsAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <div>
              <div className="text-sm font-bold text-[#17365D]">WhatsApp Updates (व्हाट्सएप अपडेट)</div>
              <p className="text-xs text-[#5F6B76]">Receive periodic training batch announcements via WhatsApp Business API.</p>
            </div>
            <button
              onClick={() => toggle('whatsappAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                prefs.whatsappAlerts ? 'bg-[#287D73]' : 'bg-[#DCE3EA]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.whatsappAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <div>
              <div className="text-sm font-bold text-[#17365D]">PWA Web Push (वेब पुश नोटिफिकेशन)</div>
              <p className="text-xs text-[#5F6B76]">Receive instant device notifications when your roadmap has recommended updates.</p>
            </div>
            <button
              onClick={() => toggle('pushNotifications')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                prefs.pushNotifications ? 'bg-[#287D73]' : 'bg-[#DCE3EA]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.pushNotifications ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-xl border border-[#DCE3EA]">
            <div>
              <div className="text-sm font-bold text-[#17365D]">Learning Roadmap Reminders</div>
              <p className="text-xs text-[#5F6B76]">Gentle weekly check-in prompts to help you finish your learning stages.</p>
            </div>
            <button
              onClick={() => toggle('roadmapReminders')}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                prefs.roadmapReminders ? 'bg-[#287D73]' : 'bg-[#DCE3EA]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.roadmapReminders ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[#DCE3EA] flex items-center justify-between">
          <span className="text-xs text-[#5F6B76]">Preferences are saved to this device.</span>
          <button
            onClick={() => go('dashboard')}
            className="px-5 py-2.5 rounded-xl bg-[#245A91] text-white text-xs font-bold shadow-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
};
