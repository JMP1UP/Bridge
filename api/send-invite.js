export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, studentName, inviteLink } = req.body;
  if (!email || !studentName || !inviteLink) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Resend API key is not configured' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Bridge Invitation <noreply@school-bridge.org>',
        to: [email],
        subject: 'Bridge Invite: Collaborate with international classrooms!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">Bridge</h1>
              <p style="color: #4a5568; margin: 4px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Global Cultural Exchange</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">Hello ${studentName},</p>
            <p style="font-size: 16px; line-height: 1.6;">Your teacher has invited you to join <strong>Bridge</strong>, our international classroom exchange platform!</p>
            <p style="font-size: 16px; line-height: 1.6;">Use Bridge to collaborate with classrooms worldwide, build shared project slide decks, chat with partners, and translate messages automatically.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteLink}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 24px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Join Your Classroom</a>
            </div>
            <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-bottom: 0;">If the button above does not work, copy and paste this link into your browser:<br><a href="${inviteLink}" style="color: #3b82f6;">${inviteLink}</a></p>
          </div>
        `
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Resend API error' });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
