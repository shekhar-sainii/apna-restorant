import React from "react";
import { useLocation } from "react-router-dom";
import { OffersStrip } from "./OffersStrip";
import { MobileTabBar } from "./MobileTabBar";

const HIDDEN_PREFIXES = ["/login", "/register", "/forgot-password", "/reset-password", "/admin", "/t/"];
const HIDE_OFFERS_ON = ["/checkout"];

export const MobileBottomDock: React.FC = () => {
  const { pathname } = useLocation();

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const showOffers = !HIDE_OFFERS_ON.some((p) => pathname.startsWith(p));

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 flex flex-col">
      {showOffers && <OffersStrip />}
      <MobileTabBar embedded />
    </div>
  );
};

export default MobileBottomDock;
