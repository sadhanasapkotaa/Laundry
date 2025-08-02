import ThemeToggle from "../components/ThemeToggle";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-4 bg-bgPrimary border-b border-border1">
      <h1 className="text-primary font-bold">My Blue Site</h1>
      <ThemeToggle />
    </nav>
  );
}
