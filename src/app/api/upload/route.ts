import { getAuthUser } from "@/lib/auth";
import { ok, err, unauthorized } from "@/lib/response";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const auth = await getAuthUser(request);
  if (!auth) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return err("No file provided");

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return err("File too large (max 10MB)", 413);
    }

    const allowed = ["image/", "video/", "application/pdf"];
    const isAllowed = allowed.some((t) => {
      if (t === "image/") return file.type.startsWith("image/");
      if (t === "video/") return file.type.startsWith("video/");
      if (t === "application/pdf") return file.type === "application/pdf";
      return false;
    });

    if (!isAllowed) {
      return err("File type not allowed. Allowed: images, videos, PDF");
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), buffer);

    return ok({ data: { url: `/uploads/${filename}` } });
  } catch (e) {
    console.error("[upload POST]", e);
    return err("File upload failed", 500);
  }
}
