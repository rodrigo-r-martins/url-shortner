function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 mt-auto">
      <div className="text-center text-gray-400 text-sm">
        © {currentYear} URL Shortener - Rodrigo Martins. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
