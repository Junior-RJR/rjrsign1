export default async function (req: any, res: any) {
  try {
    // Dynamic import to catch module loading/initialization errors
    const { default: app } = await import("../server");
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Init Error occurred:", err);
    res.status(500).json({
      error: "Instabilidade na inicialização do servidor RJR Sign (Vercel Boot Error)",
      message: err.message,
      stack: err.stack,
      cwd: process.cwd(),
      env_sample: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        SUPABASE_URL_SET: !!process.env.SUPABASE_URL
      }
    });
  }
}

