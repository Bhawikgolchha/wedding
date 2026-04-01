// Vercel Serverless Function - GET /api/images
// Uses an external storage solution (Supabase or similar)
// For now, proxies to the backend or returns stored data

export default function handler(req, res) {
  res.status(200).json([]);
}
