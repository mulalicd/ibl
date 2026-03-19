export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z }                         from 'zod';
import { supabaseAdmin }             from '@/lib/supabase';
import { validatePinSession }        from '@/lib/pin';
import { generateDocx }              from '@/lib/docx-generator';

const ExportSchema = z.object({
  plan_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!await validatePinSession(req.cookies.get('pin_session')?.value)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body   = await req.json().catch(() => ({}));
  const parsed = ExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('plans')
    .select('*')
    .eq('id', parsed.data.plan_id)
    .eq('is_deleted', false)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    const buffer = await generateDocx(data);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

    await supabaseAdmin
      .from('plans')
      .update({ docx_export_count: (data.docx_export_count ?? 0) + 1 })
      .eq('id', data.id);

    const filename = `IBL_Plan_${data.subject}_${data.grade}r_${data.id.slice(0, 8)}.docx`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      buffer.byteLength.toString(),
      },
    });
  } catch (err) {
    console.error('[DOCX export]', err);
    return NextResponse.json({ error: 'EXPORT_FAILED' }, { status: 500 });
  }
}