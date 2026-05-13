export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-4xl mx-auto px-4 py-4 text-center text-xs text-muted" style={{ fontFamily: 'Arial, system-ui, sans-serif' }}>
        &copy; {new Date().getFullYear()} sFOX Inc &amp; affiliates. All rights reserved.
        <span className="mx-2">|</span>
        <a href="mailto:clientservices@sfox.com" className="text-primary hover:underline">clientservices@sfox.com</a>
      </div>
    </footer>
  );
}