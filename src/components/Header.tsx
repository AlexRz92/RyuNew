export function Header() {
  return (
    <header className="bg-gradient-to-b from-slate-900 to-slate-800 border-b border-amber-500/20">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-center">
          <div className="flex flex-col items-center gap-3">
            <img
              src="/ryu.png"
              alt="Ryu Logo"
              className="h-24 md:h-32 lg:h-40 w-auto object-contain"
            />
            <img
              src="/ferreteria.png"
              alt="Ferretería Ryu"
              className="h-8 md:h-10 lg:h-12 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
