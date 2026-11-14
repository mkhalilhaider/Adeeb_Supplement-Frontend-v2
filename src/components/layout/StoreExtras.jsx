import PromoPopup from "../../features/promo/PromoPopup";
import FloatingWhatsApp from "./FloatingWhatsApp";

/**
 * Store-wide extras that load just after the page (one small download, not part of any page's
 * first load): the floating WhatsApp button and the promo popup.
 */
export default function StoreExtras() {
  return (
    <>
      <FloatingWhatsApp />
      <PromoPopup />
    </>
  );
}
