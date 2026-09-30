import PropTypes from "prop-types";
import Providers from "./providers";
import "./globals.css";

// Next.js requires metadata to be exported from the route layout.
// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: "UrbanAssist",
  description: "Neighborhood services finder",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.node.isRequired,
};
