/**
 * NextAuth error-param code → user-facing copy (ATH-5).
 * Shared by the /login and /signup cards. Product copy follows the project
 * convention (Spanish, neutral/professional).
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Acceso denegado: canceló la autorización con GitHub.",
  OAuthAccountNotLinked:
    "Este email ya está vinculado a otra cuenta. Inicie sesión con esa cuenta.",
  OAuthSignin: "No se pudo iniciar el flujo de GitHub. Inténtelo de nuevo.",
  OAuthCallback: "GitHub no completó el inicio de sesión. Inténtelo de nuevo.",
  OAuthCreateAccount:
    "No se pudo crear la cuenta con GitHub. Inténtelo de nuevo.",
  Configuration: "Error de configuración del servidor. Contacte a soporte.",
};

const DEFAULT_AUTH_ERROR = "No se pudo iniciar sesión. Inténtelo de nuevo.";

/**
 * Maps a NextAuth error code to a user-facing message. Returns null when
 * there is no error (empty string counts as absent) so the caller renders no
 * banner; unknown codes fall back to a generic message.
 */
export function authErrorMessage(error: string | null): string | null {
  if (!error) {
    return null;
  }
  return AUTH_ERROR_MESSAGES[error] ?? DEFAULT_AUTH_ERROR;
}
