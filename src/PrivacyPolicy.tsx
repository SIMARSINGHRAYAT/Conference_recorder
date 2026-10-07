export default function PrivacyPolicy() {
  return (
    <main className="conference-light animate-bg min-h-screen bg-gradient-to-br from-black via-slate-950 to-black px-4 py-12 sm:px-8 font-sans relative overflow-hidden text-gray-200">
      <div className="absolute inset-0 grid-overlay opacity-30 mix-blend-overlay"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto space-y-8 bg-black/50 p-8 sm:p-12 rounded-3xl backdrop-blur-xl border border-gray-700 shadow-2xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-100 via-gray-300 to-gray-500 tracking-wider uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] border-b border-gray-700 pb-6">
          Privacy Policy
        </h1>
        
        <div className="space-y-6 text-lg leading-relaxed font-light">
          <p>
            Welcome to <strong className="text-white font-semibold">SCHOLARDECK</strong>. We are committed to protecting your personal information and your right to privacy.
          </p>
          
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-widest mt-8">
              1. Information We Collect
            </h2>
            <p>
              When you use our application to log in via GitHub, we collect your GitHub username. We do not access, collect, or transmit any other personal information, source code, or private repositories from your GitHub account. All publication data and records you create within the application are strictly associated with this username.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-widest mt-8">
              2. How We Use Your Information
            </h2>
            <p>
              We use your GitHub username solely for the purpose of identifying you within the application and maintaining your personalized dashboard. This ensures that your research, tracked publications, and presentation schedules are securely linked to your profile and isolated from other users.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-widest mt-8">
              3. Data Storage and Security
            </h2>
            <p>
              Your personal data and conference records are stored securely. We implement reasonable security measures to maintain the safety of your personal information. However, no electronic transmission over the internet or information storage technology can be guaranteed to be 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-widest mt-8">
              4. Third-Party Services
            </h2>
            <p>
              We use GitHub for authentication services. By logging in, you are also subject to GitHub's Privacy Statement. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-widest mt-8">
              5. Changes to This Policy
            </h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page. You are advised to review this privacy policy periodically for any changes.
            </p>
          </section>
        </div>
        
        <div className="pt-8 border-t border-gray-700 text-center text-gray-400 text-sm">
          <p>Last updated: October 2026</p>
        </div>
      </div>
    </main>
  );
}
