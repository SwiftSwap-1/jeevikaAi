# JeevikaAI

**Voice-Based Livelihood & Skill Assistant** · Team Knight Coders · Prototype

JeevikaAI helps people with low digital literacy discover skills, NSQF-aligned training pathways and nearby jobs or self-employment options, in Hindi, English or Hinglish.

> **DEMO PROTOTYPE.** All profiles, recommendations, course details, NSQF levels and job listings are fictional or illustrative sample data. They are not verified live listings or official certifications. Nothing here is approved by or affiliated with any government body.

## Pages

- **Home**: landing page with dashboard preview, features and a four-step workflow
- **Voice Assessment**: step-by-step onboarding by voice (Web Speech API where supported) or text
- **Dashboard**: "Your Livelihood Roadmap" with skill pathways, explainable scoring, learning roadmap and local opportunities

## Run it

No build, backend or API keys needed. Open `jeevikaai.html` in a browser (needs internet once for React and Google Fonts).

## Demo flow

1. Home → **Start Voice Assessment**
2. Choose Hindi or English
3. **Load Demo Beneficiary** (fictional: Sunita Devi, Maharajganj, Uttar Pradesh)
4. Step through the 8 questions → **See my roadmap**
5. Open **Why this recommendation?** on each pathway
6. **Download Summary** saves a text summary

## How recommendations work

Transparent rule-based scoring, not a trained model. Each pathway gets points for matching interests, existing skills, education, work type, travel range and an illustrative local-demand signal. Every factor is shown in the dashboard.

## Files

- `index.html`: final single-file build (open this)
- `app.jsx`: React source
- `shell.html`: page shell and styles; the compiled `app.jsx` is inlined into it to produce `jeevikaai.html`

## Notes

- Voice capture needs microphone permission. If it is blocked or unsupported, the app says so and the text input works.
- Built with React 18 loaded from cdnjs and Google Fonts (Bricolage Grotesque, Hind).
