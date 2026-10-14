"use client";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="px-4 pb-2 pt-3 lg:px-5">
      <input
        type="search"
        placeholder="Search regions..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:border-[#ff6b4a]/40 focus:bg-white/8 focus:outline-none"
      />
    </div>
  );
}
