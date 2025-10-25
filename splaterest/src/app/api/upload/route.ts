export const runtime = 'nodejs'; // needed for file system access

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return new Response(JSON.stringify({ error: 'No file' }), { status: 400 });

    const bytes = await file.arrayBuffer();
    const buf = Buffer.from(bytes);
    const name = file.name.replace(/[^a-z0-9._-]/gi, '_'); // sanitize

    const fs = await import('fs/promises');
    await fs.writeFile(`./public/splats/${name}`, buf);

    return Response.json({ ok: true, path: `/splats/${name}` });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Upload error' }), { status: 500 });
  }
}
