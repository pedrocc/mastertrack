import fs from "node:fs/promises";
import path from "node:path";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const isProduction = Bun.env["NODE_ENV"] === "production";
const LOCAL_STORAGE_PATH = "./uploads";

/**
 * Abstraction layer para storage
 * Usa sistema de arquivos local em dev e Supabase Storage em producao
 */
export const storage = {
  /**
   * Upload de arquivo
   */
  async upload(bucket: string, filePath: string, file: Buffer | Uint8Array): Promise<string> {
    if (isProduction && isSupabaseConfigured()) {
      // Supabase Storage em producao
      const client = getSupabase();
      const { data, error } = await client.storage.from(bucket).upload(filePath, file, {
        upsert: true,
        contentType: detectContentType(filePath),
      });

      if (error) throw error;
      return client.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
    }

    // Sistema de arquivos local em dev
    const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file);
    return `/uploads/${bucket}/${filePath}`;
  },

  /**
   * Download de arquivo
   */
  async download(bucket: string, filePath: string): Promise<Buffer> {
    if (isProduction && isSupabaseConfigured()) {
      const { data, error } = await getSupabase().storage.from(bucket).download(filePath);

      if (error) throw error;
      return Buffer.from(await data.arrayBuffer());
    }

    const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, filePath);
    return fs.readFile(fullPath);
  },

  /**
   * Deletar arquivo
   */
  async delete(bucket: string, filePath: string): Promise<void> {
    if (isProduction && isSupabaseConfigured()) {
      const { error } = await getSupabase().storage.from(bucket).remove([filePath]);
      if (error) throw error;
      return;
    }

    const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, filePath);
    await fs.unlink(fullPath).catch(() => {
      // Ignorar erro se arquivo nao existe
    });
  },

  /**
   * Obter URL publica do arquivo
   */
  getPublicUrl(bucket: string, filePath: string): string {
    if (isProduction && isSupabaseConfigured()) {
      return getSupabase().storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
    }
    return `/uploads/${bucket}/${filePath}`;
  },

  /**
   * Listar arquivos em um diretorio
   */
  async list(bucket: string, folderPath = ""): Promise<string[]> {
    if (isProduction && isSupabaseConfigured()) {
      const { data, error } = await getSupabase().storage.from(bucket).list(folderPath);

      if (error) throw error;
      return data.map((file) => file.name);
    }

    const fullPath = path.join(LOCAL_STORAGE_PATH, bucket, folderPath);
    try {
      const files = await fs.readdir(fullPath);
      return files;
    } catch {
      return [];
    }
  },
};

/**
 * Detecta content type baseado na extensao
 */
function detectContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".pdf": "application/pdf",
    ".json": "application/json",
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
  };
  return types[ext] ?? "application/octet-stream";
}
