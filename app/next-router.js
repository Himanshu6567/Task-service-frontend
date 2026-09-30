"use client";

import NextLink from "next/link";
import PropTypes from "prop-types";
import { useCallback } from "react";
import { usePathname, useRouter as useNextRouter } from "next/navigation";

export function Link({ to, children, ...props }) {
  return (
    <NextLink href={to} {...props}>
      {children}
    </NextLink>
  );
}

Link.propTypes = {
  to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
  children: PropTypes.node,
};

export function useNavigate() {
  const router = useNextRouter();
  return useCallback(
    (path, options = {}) => {
      if (options.state)
        sessionStorage.setItem(
          "navigationState",
          JSON.stringify(options.state),
        );
      router.push(path);
    },
    [router],
  );
}

export function useLocation() {
  const pathname = usePathname();
  let state = null;
  if (typeof window !== "undefined") {
    const savedState = sessionStorage.getItem("navigationState");
    state = savedState ? JSON.parse(savedState) : null;
  }
  return { pathname, search: "", state };
}
