// Rhythm.play uses Neon Data API for public skins and guest-submitted scores.
// This HTTPS endpoint is public browser configuration, NOT a database password.
// Keep Supabase available until the production cutover has been verified.
window.RHYTHM_CONFIG = {
  neonDataApiUrl: "https://ep-royal-dust-beuaeal0.apirest.c-9.us-east-2.aws.neon.tech/zuzify/rest/v1"
};
