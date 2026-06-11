export default async function (req: any, res: any) {
  console.log(`[RJR VERCEL] 1. Recebendo requisição para: ${req.method} ${req.url}`);
  try {
    console.log("[RJR VERCEL] 2. Iniciando importação dinâmica do server.ts...");
    const { default: app } = await import("../server");
    console.log("[RJR VERCEL] 3. Importação do server.ts concluída com sucesso! Chamando handler da requisição...");
    return app(req, res);
  } catch (err: any) {
    console.error("[RJR VERCEL] CRÍTICO: Erro capturado na inicialização:", err);
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

