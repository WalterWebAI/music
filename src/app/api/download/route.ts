import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import util from "util";
import ffmpegPath from "ffmpeg-static";

const execAsync = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    const uniqueTmpDir = path.join(os.tmpdir(), `ytdlp-${Date.now()}`);
    fs.mkdirSync(uniqueTmpDir, { recursive: true });

    const outputPathTemplate = path.join(uniqueTmpDir, "%(title)s.%(ext)s");

    const isWin = process.platform === "win32";
    let ytDlpPath = "";
    if (isWin) {
      ytDlpPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp.exe");
    } else {
      ytDlpPath = path.join(process.cwd(), "bin", "yt-dlp_linux");
      try {
        fs.chmodSync(ytDlpPath, 0o755);
      } catch (e) {}
    }
    
    let resolvedFfmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", isWin ? "ffmpeg.exe" : "ffmpeg");
    if (!fs.existsSync(/*turbopackIgnore: true*/ resolvedFfmpegPath) && ffmpegPath && fs.existsSync(/*turbopackIgnore: true*/ ffmpegPath)) {
      resolvedFfmpegPath = ffmpegPath;
    }

    if (!isWin && fs.existsSync(/*turbopackIgnore: true*/ resolvedFfmpegPath)) {
      try {
        fs.chmodSync(resolvedFfmpegPath, 0o755);
      } catch (e) {}
    }

    // Descargar, convertir a mp3 a 320kbps y guardar con el nombre original del video
    // Se agregan extractor-args para bypass de restriccion bot de YouTube en servidores datacenter (Vercel)
    const ffmpegArg = fs.existsSync(/*turbopackIgnore: true*/ resolvedFfmpegPath) ? `--ffmpeg-location "${resolvedFfmpegPath}"` : "";
    const command = `"${ytDlpPath}" -f bestaudio -x --audio-format mp3 --audio-quality 320K ${ffmpegArg} --restrict-filenames -o "${outputPathTemplate}" --js-runtimes node --extractor-args "youtube:player_client=mweb,android" "${url}"`;
    await execAsync(command);

    // Encontrar el archivo generado en el directorio temporal
    const files = fs.readdirSync(uniqueTmpDir);
    if (files.length === 0) {
      throw new Error("Failed to download or convert file to MP3");
    }

    const downloadedFilename = files[0];
    const finalFilePath = path.join(uniqueTmpDir, downloadedFilename);

    const fileBuffer = fs.readFileSync(finalFilePath);
    
    // Limpieza
    fs.unlinkSync(finalFilePath);
    fs.rmdirSync(uniqueTmpDir);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${downloadedFilename}"`,
      },
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





