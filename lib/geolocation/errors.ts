/**
 * Device geolocation failure handling, shared by the report form and the map.
 *
 * On iPhone `navigator.geolocation.getCurrentPosition` fails in two ways that
 * look identical to the user (no permission prompt, immediate error):
 *
 *   1. In-app browsers (WhatsApp, Instagram, Facebook) embed their links in a
 *      restricted WebView that blocks the Geolocation API outright, so the call
 *      rejects without ever asking for permission. It is most visible on iPhone
 *      (WhatsApp on Android opens links in Chrome Custom Tabs, which inherit
 *      Chrome's permissions), but the Facebook and Instagram in-app browsers
 *      restrict geolocation on Android too, so the guidance stays OS-neutral.
 *   2. Plain Safari with Location Services turned off for Safari, or a site the
 *      user already denied, rejects with PERMISSION_DENIED and shows no prompt.
 *
 * Both cases share the same recovery: drop a pin on the map by hand. Reading the
 * error code and the user agent lets us turn one generic "verifica los permisos"
 * line into an instruction tailored to what actually went wrong.
 */

/** A known in-app browser whose embedded WebView restricts geolocation. */
export type InAppBrowser = 'WhatsApp' | 'Instagram' | 'Facebook';

/**
 * Identifies a known in-app browser from a user agent string.
 *
 * Only the named apps are matched, never a generic "looks like a WebView"
 * heuristic: a false positive would wrongly tell a real Safari user to "open in
 * Safari", which is worse than the generic permission message they get instead.
 *
 * @param userAgent The `navigator.userAgent` value.
 * @returns The app label for messaging, or null for a standalone browser.
 */
export function detectInAppBrowser(userAgent: string): InAppBrowser | null {
  if (/WhatsApp/i.test(userAgent)) return 'WhatsApp';
  if (/Instagram/i.test(userAgent)) return 'Instagram';
  // Facebook and Messenger both ship the FBAN/FBAV/FB_IAB tokens.
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return 'Facebook';
  return null;
}

/**
 * Builds a Spanish, actionable message for a geolocation failure.
 *
 * When the user is inside a known in-app browser the API is blocked regardless
 * of the error code, so that case takes priority and points them to a real
 * browser. Every message ends with the same fallback (drop a pin on the map) so
 * the user is never stuck.
 *
 * @param error The failure, narrowed to its `code` (1-3, per the spec).
 * @param inAppBrowser The detected in-app browser, or null.
 * @returns A user-facing message describing the cause and the way forward.
 */
export function geolocationErrorMessage(
  error: Pick<GeolocationPositionError, 'code'>,
  inAppBrowser: InAppBrowser | null,
): string {
  if (inAppBrowser) {
    return `El navegador interno de ${inAppBrowser} no permite compartir tu ubicación. Ábrelo en Safari o Chrome desde el menú del navegador, o marca el punto tocando el mapa.`;
  }

  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return 'No diste permiso de ubicación, o está desactivada para tu navegador. Actívala en los ajustes del teléfono (Privacidad y seguridad, Localización) o marca el punto tocando el mapa.';
    case 2: // POSITION_UNAVAILABLE
      return 'No pudimos determinar tu ubicación en este momento. Marca el punto tocando el mapa.';
    case 3: // TIMEOUT
      return 'La ubicación tardó demasiado en responder. Inténtalo de nuevo o marca el punto tocando el mapa.';
    default:
      return 'No se pudo obtener tu ubicación. Marca el punto tocando el mapa.';
  }
}
