import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { to, clientName, invoiceNumber, invoiceDate, dueDate, amount, companyName } = await req.json();
    if (!to) return Response.json({ error: 'Recipient email is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');
    if (!accessToken) return Response.json({ error: 'Gmail not connected' }, { status: 500 });

    const fmtDate = (s) => {
      if (!s) return '—';
      const [y, m, d] = s.split('-');
      return `${m}/${d}/${y}`;
    };
    const fmtCur = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const subject = `Invoice ${invoiceNumber} from ${companyName}`;
    const body = [
      `Dear ${clientName},`,
      '',
      'Please find your invoice summary below:',
      '',
      `Invoice Number: ${invoiceNumber}`,
      `Invoice Date: ${fmtDate(invoiceDate)}`,
      `Due Date: ${fmtDate(dueDate)}`,
      `Amount Due: ${fmtCur(amount)}`,
      '',
      'If you have any questions about this invoice, please don\'t hesitate to contact us.',
      '',
      'Thank you for your business.',
      '',
      companyName,
    ].join('\n');

    const rawEmail = `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`;
    const bytes = new TextEncoder().encode(rawEmail);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    const b64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: b64 }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Gmail API error: ${err}` }, { status: 500 });
    }

    return Response.json({ success: true, message: `Email sent to ${to}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});